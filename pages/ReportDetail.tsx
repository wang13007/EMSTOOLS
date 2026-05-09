import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { SurveyForm } from '../types';
import { generateEnergyReport, ReportResult } from '../services/geminiService';
import {
  buildCapabilityRecommendations,
  buildCapabilitySolutionCatalog,
  buildReportBundle,
  CapabilityRecommendationItem,
  CapabilitySolutionItem,
  ReportBundle,
} from '../services/reportService';
import { roleService, surveyReportService, surveyService, userService } from '../src/services/supabaseService';
import { buildCapabilityMatchPackage } from '../src/services/capabilityMatchingService';
import { usePermission } from '../src/auth/usePermission';
import { DetailPageHeader } from '../components/DetailPageHeader';

type ActiveReportType = 'ai' | 'template';
type PreSalesUserOption = {
  id: string;
  label: string;
  name: string;
  username?: string;
  phone?: string;
  email?: string;
};

interface ReportDetailContentProps {
  embedded?: boolean;
}

const PIE_COLORS = ['#2563eb', '#0ea5e9', '#14b8a6', '#64748b', '#94a3b8'];

const getInitialReportType = (search: string): ActiveReportType => {
  const params = new URLSearchParams(search);
  const type = params.get('type');
  return type === 'template' ? 'template' : 'ai';
};

const formatDate = (iso?: string) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('zh-CN');
  } catch {
    return iso;
  }
};

const SECTION_TONES = [
  {
    shell: 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50',
    title: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    shell: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50',
    title: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    shell: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50',
    title: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    shell: 'border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-pink-50',
    title: 'text-fuchsia-800',
    badge: 'bg-fuchsia-100 text-fuchsia-700',
  },
];

const getSectionTone = (idx: number) => SECTION_TONES[idx % SECTION_TONES.length];

const ZH = {
  notFoundProject: '\u672a\u627e\u5230\u8be5\u9879\u76ee\u3002',
  notFoundReport: '\u672a\u627e\u5230\u8be5\u9879\u76ee\u7684\u8bc4\u4f30\u62a5\u544a\uff0c\u8bf7\u91cd\u65b0\u751f\u6210\u3002',
  loadFail: '\u52a0\u8f7d\u62a5\u544a\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002',
  loading: '\u62a5\u544a\u52a0\u8f7d\u4e2d...',
  shareAction: '\u5206\u4eab\u62a5\u544a',
  shareOk: '\u62a5\u544a\u94fe\u63a5\u5df2\u590d\u5236\u3002',
  shareFailPrompt: '\u590d\u5236\u5931\u8d25\uff0c\u8bf7\u624b\u52a8\u590d\u5236\u4ee5\u4e0b\u94fe\u63a5\uff1a',
  exportAction: '\u5bfc\u51fa\u62a5\u544a',
  exportNoTarget: '\u5bfc\u51fa\u5931\u8d25\uff1a\u672a\u627e\u5230\u62a5\u544a\u5185\u5bb9\u3002',
  exportFail: '\u5bfc\u51fa PDF \u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002',
  exporting: '\u5bfc\u51fa\u4e2d...',
  shareLink: '\u94fe\u63a5\u5206\u4eab',
  unknownIndustry: '\u672a\u77e5\u884c\u4e1a',
  unknownRegion: '\u672a\u77e5\u533a\u57df',
  customerPrefix: '\u5ba2\u6237\uff1a',
  generatedAtPrefix: '\u751f\u6210\u65f6\u95f4\uff1a',
  preSalesOwner: '\u552e\u524d\u8d1f\u8d23\u4eba',
  phone: '\u8054\u7cfb\u7535\u8bdd',
  email: '\u90ae\u7bb1',
  notProvided: '\u672a\u63d0\u4f9b',
  selectPreSalesOwner: '\u8bf7\u9009\u62e9\u552e\u524d\u8d1f\u8d23\u4eba',
  savePreSalesOwner: '\u4fdd\u5b58\u552e\u524d\u8d1f\u8d23\u4eba',
  savePreSalesOwnerSuccess: '\u552e\u524d\u8d1f\u8d23\u4eba\u5df2\u66f4\u65b0\u3002',
  savePreSalesOwnerFail: '\u66f4\u65b0\u552e\u524d\u8d1f\u8d23\u4eba\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002',
  noPreSalesUsers: '\u672a\u627e\u5230\u53ef\u9009\u552e\u524d\u7528\u6237',
  editPreSalesOwner: '\u4fee\u6539\u552e\u524d\u8d1f\u8d23\u4eba',
  backToList: '\u8fd4\u56de\u5217\u8868',
  formTab: '\u8868\u5355',
  reportTab: '\u62a5\u544a',
  cancel: '\u53d6\u6d88',
  change: '\u4fee\u6539',
  efficiencyMaturity: '\u80fd\u6548\u6210\u719f\u5ea6',
  efficiencyHint: '\u8bc4\u5206\u8d8a\u9ad8\u8868\u793a\u80fd\u6548\u7ba1\u7406\u4f53\u7cfb\u8d8a\u6210\u719f\u3002',
  capabilityMatch: '\u80fd\u529b\u5339\u914d',
  capabilityHint: '\u5df2\u5339\u914d\u80fd\u529b / \u603b\u80fd\u529b',
  aiReport: 'AI诊断报告',
  execSummary: '\u6267\u884c\u6458\u8981',
  scoreStructure: '\u80fd\u6548\u8bc4\u5206\u7ed3\u6784',
  statRecommend: '\u5efa\u8bae\u4e0e\u5339\u914d\u7edf\u8ba1',
  diagnosis: '\u8bca\u65ad\u5206\u6790',
  energyStructure: '\u80fd\u6e90\u7ed3\u6784\uff1a',
  savingPotential: '\u8282\u80fd\u6f5c\u529b\uff1a',
  estimatedCost: '\u9884\u8ba1\u6295\u5165\uff1a',
  roi: '\u6295\u8d44\u56de\u62a5\u5206\u6790\uff1a',
  gapsAndSteps: '\u5173\u952e\u5dee\u8ddd\u4e0e\u4e0b\u4e00\u6b65',
  gaps: '\u5173\u952e\u5dee\u8ddd',
  nextSteps: '\u4e0b\u4e00\u6b65\u884c\u52a8',
  maturityScore: '\u6210\u719f\u5ea6\u5f97\u5206',
  improvementSpace: '\u63d0\u5347\u7a7a\u95f4',
  software: '\u8f6f\u4ef6\u5efa\u8bae',
  hardware: '\u786c\u4ef6\u5efa\u8bae',
  consulting: '\u54a8\u8be2\u5efa\u8bae',
  templateReport: '\u6a21\u677f\u8f93\u51fa\u62a5\u544a',
  reportTemplate: '\u62a5\u544a\u6a21\u677f',
  surveyTemplate: '\u8c03\u7814\u6a21\u677f',
  templateLinkedHint: '\u7cfb\u7edf\u5df2\u81ea\u52a8\u5b8c\u6210\u6a21\u677f\u5339\u914d',
  surveyLinkedHint: '\u57fa\u4e8e\u8c03\u7814\u6a21\u677f\u81ea\u52a8\u5173\u8054',
  sectionsCharts: '\u7ae0\u8282 / \u56fe\u8868',
  bodyHint: '\u6b63\u6587\u4ee5\u5bcc\u6587\u672c\u6bb5\u843d\u7ed3\u5408\u56fe\u8868\u5448\u73b0\u3002',
  richBody: '\u6a21\u677f\u6b63\u6587\uff08\u5bcc\u6587\u672c\uff09',
  templateInsight: '\u6a21\u677f\u62a5\u544a\u4e3b\u89c2\u6d1e\u5bdf',
  chartSnapshot: '\u5173\u952e\u56fe\u8868\u5feb\u7167',
  fullNarrative: '\u5b8c\u6574\u5206\u6790\u6b63\u6587',
  moduleLibrary: '\u63a8\u8350\u80fd\u529b\u6a21\u5757\u5e93',
  detailFindings: '\u8be6\u7ec6\u8bca\u65ad\u8981\u70b9',
  implementationRoadmap: '\u5206\u9636\u6bb5\u5b9e\u65bd\u8def\u7ebf',
  riskControl: '\u98ce\u9669\u4e0e\u63a7\u5236\u63aa\u65bd',
  kpiAndAcceptance: 'KPI \u4e0e\u9a8c\u6536\u6307\u6807',
  investmentBreakdown: '\u6295\u5165\u62c6\u89e3',
  expectedBenefits: '\u9884\u671f\u6536\u76ca',
  operationMechanism: '\u8fd0\u8425\u673a\u5236\u5efa\u8bae',
  dataGovernance: '\u6570\u636e\u6cbb\u7406\u89c4\u5212',
  softwareSuggestion: '\u8f6f\u4ef6\u5efa\u8bae',
  hardwareSuggestion: '\u786c\u4ef6\u5efa\u8bae',
  consultingSuggestion: '\u54a8\u8be2\u5efa\u8bae',
  moduleSuggestionDedup: '\u6a21\u5757\u5efa\u8bae\uff08\u53bb\u91cd\u540e\uff09',
  supplementInsights: '\u8865\u5145\u5206\u6790\uff08\u53bb\u91cd\u540e\uff09',
  capabilityAdviceMatch: '\u5efa\u8bae\u4e0e\u80fd\u529b\u9010\u9879\u5339\u914d',
  templateCapabilityTags: '\u6a21\u677f\u8bc6\u522b\u80fd\u529b\u6807\u7b7e',
  matchingRulesTitle: '\u80fd\u529b\u5339\u914d\u8ba1\u7b97\u89c4\u5219',
  solutionCatalogTitle: '\u7efc\u5408\u89e3\u51b3\u65b9\u6848\u6e05\u5355',
  templateTagThreshold: '\u6a21\u677f\u6807\u7b7e\u9608\u503c',
  matchingThresholds: '\u5339\u914d\u9608\u503c',
  highMatch: '\u9ad8\u5339\u914d',
  mediumMatch: '\u4e2d\u5339\u914d',
  lowMatch: '\u4f4e\u5339\u914d',
  needConfirm: '\u5f85\u786e\u8ba4',
  templateEvidence: '\u6a21\u677f\u8bc1\u636e',
  specificFunctions: '\u5177\u4f53\u529f\u80fd\u80fd\u529b',
  matchedRules: '\u547d\u4e2d\u89c4\u5219',
  solutionSummary: '\u65b9\u6848\u6458\u8981',
  templateLinkedTemplates: '\u5173\u8054\u6a21\u677f',
  scoreSuffix: '\u5206',
  mappingBasis: '\u5339\u914d\u4f9d\u636e',
  linkedSuggestion: '\u5173\u8054\u5efa\u8bae',
  actionSuggestion: '\u884c\u52a8\u5efa\u8bae',
  matched: '\u5df2\u5339\u914d',
  pendingMatch: '\u5f85\u5339\u914d',
  noDirectSuggestion: '\u6682\u65e0\u76f4\u63a5\u5efa\u8bae',
  exportPrefix: '\u5bfc\u51fa',
  defaultReportName: '\u62a5\u544a',
  valueLabel: '\u6570\u503c',
  templateTabShort: '\u6a21\u677f\u62a5\u544a',
};

const splitParagraphs = (content?: string) => {
  if (!content) return [] as string[];
  return content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
};

const toDisplayList = (value: unknown, fallback: string[]) => {
  if (Array.isArray(value)) {
    const normalized = Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean)));
    if (normalized.length) {
      return normalized;
    }
  }
  return fallback;
};

const normalizeSemanticText = (value: unknown) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\u4e00-\u9fa5a-z0-9]/gi, '');
};

const isSemanticallyDuplicate = (left: string, right: string) => {
  const l = normalizeSemanticText(left);
  const r = normalizeSemanticText(right);
  if (!l || !r) return false;
  if (l === r) return true;
  const minLen = Math.min(l.length, r.length);
  if (minLen < 6) return false;
  return l.includes(r) || r.includes(l);
};

const dedupeBySemantic = (items: string[]) => {
  const result: string[] = [];
  (items || []).forEach((item) => {
    const normalized = String(item || '').trim();
    if (!normalized) return;
    if (result.some((existing) => isSemanticallyDuplicate(existing, normalized))) return;
    result.push(normalized);
  });
  return result;
};

const excludeSemanticallyDuplicateItems = (items: string[], references: string[]) => {
  if (!items.length || !references.length) return items;
  return items.filter((item) => !references.some((reference) => isSemanticallyDuplicate(item, reference)));
};

const formatMatchLevelLabel = (level?: string) => {
  if (level === 'high') return ZH.highMatch;
  if (level === 'medium') return ZH.mediumMatch;
  if (level === 'low') return ZH.lowMatch;
  return ZH.needConfirm;
};

const getMatchLevelBadgeClass = (level?: string, matched?: boolean) => {
  if (level === 'high') return 'bg-emerald-100 text-emerald-700';
  if (level === 'medium') return 'bg-blue-100 text-blue-700';
  if (level === 'low' || matched) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
};

const toReportBundle = (survey: SurveyForm, rawStored: any): { bundle: ReportBundle; shouldPersist: boolean } => {
  if (rawStored?.aiReport && rawStored?.templateReport) {
    const bundle = rawStored as ReportBundle;
    const hasTemplateStructure = Array.isArray(bundle.templateReport?.sections) && Array.isArray(bundle.templateReport?.charts);
    const hasCapabilities = Array.isArray(bundle.capabilityMatches);
    const hasCapabilityRecommendations = Array.isArray((bundle as any).capabilityRecommendations);
    const hasMatchingContext = Boolean(
      (bundle as any).capabilityMatchingContext
      && Array.isArray((bundle as any).capabilityMatchingContext?.matchingRules)
      && Array.isArray((bundle as any).capabilityMatchingContext?.recognizedTemplateTags),
    );
    const hasSolutionCatalog = Array.isArray((bundle as any).solutionCatalog);
    if (hasTemplateStructure && hasCapabilities && hasCapabilityRecommendations && hasMatchingContext && hasSolutionCatalog) {
      return { bundle, shouldPersist: false };
    }

    const rebuilt = buildReportBundle(
      survey,
      bundle.aiReport,
      bundle.preSalesContact || {
        id: survey.preSalesResponsible,
        name: ZH.preSalesOwner,
      },
    );

    return {
      bundle: {
        ...rebuilt,
        generatedAt: bundle.generatedAt || rebuilt.generatedAt,
        preSalesContact: bundle.preSalesContact || rebuilt.preSalesContact,
      },
      shouldPersist: true,
    };
  }

  return {
    bundle: buildReportBundle(survey, rawStored as ReportResult, {
      id: survey.preSalesResponsible,
      name: ZH.preSalesOwner,
    }),
    shouldPersist: true,
  };
};

const REPORT_STORAGE_KEY = 'ems_reports';

const readLocalReportMap = (): Record<string, any> => {
  try {
    const raw = localStorage.getItem(REPORT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, any>) : {};
  } catch {
    return {};
  }
};

const writeLocalReport = (surveyId: string, bundle: ReportBundle) => {
  if (!surveyId) return;
  const reportMap = readLocalReportMap();
  reportMap[surveyId] = bundle;
  localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reportMap));
};

const getSurveyDataObject = (survey: any): Record<string, any> => {
  const rawData = survey?.data;
  if (rawData && typeof rawData === 'object') return rawData;
  if (typeof rawData === 'string') {
    try {
      const parsed = JSON.parse(rawData);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const mapSurveyRecordToForm = (survey: any): SurveyForm => {
  const rawData = getSurveyDataObject(survey);
  return {
    id: survey?.id || '',
    name: survey?.name || '',
    customerName: survey?.customerName || survey?.customer_name || '',
    projectName: survey?.projectName || survey?.project_name || '',
    industry: survey?.industry || '',
    region: survey?.region || '',
    templateId: survey?.templateId || survey?.template_id || rawData.template_key || '',
    status: survey?.status,
    reportStatus: survey?.reportStatus || survey?.report_status,
    creator: survey?.creator || survey?.creator_id || '',
    submitter: survey?.submitter || survey?.submitter_id || '',
    preSalesResponsible: survey?.preSalesResponsible || survey?.pre_sales_responsible_id || '',
    createTime: survey?.createTime || survey?.create_time || '',
    data: rawData,
  };
};

const readReportBundleFromSurvey = (survey: any): any => {
  const rawData = getSurveyDataObject(survey);
  return rawData.report_bundle || rawData.reportBundle || null;
};

const readReportBundleFromSurveyReport = (reportRow: any): any => {
  const content = reportRow?.content;
  if (!content) return null;
  if (typeof content === 'object') return content;
  if (typeof content !== 'string') return null;
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const persistReportBundleToSurvey = async (survey: any, bundle: ReportBundle) => {
  if (!survey?.id) return;
  writeLocalReport(survey.id, bundle);

  const rawData = getSurveyDataObject(survey);
  const current = rawData.report_bundle;
  if (current?.generatedAt === bundle.generatedAt) {
    await surveyReportService.saveSurveyReportByFormId(survey.id, bundle);
    return;
  }

  const nextData = {
    ...rawData,
    report_bundle: bundle,
    report_generated_at: bundle.generatedAt,
  };

  await surveyService.updateSurvey(survey.id, {
    data: nextData,
    status: survey.status,
    report_status: survey.report_status || survey.reportStatus,
  });
  await surveyReportService.saveSurveyReportByFormId(survey.id, bundle);
};

const isGeneratedReportStatus = (survey: any) => {
  const raw = String(survey?.report_status || survey?.reportStatus || '').trim().toLowerCase();
  return raw === 'generated' || raw === '\u5df2\u751f\u6210';
};

const isPreSalesEngineerRole = (role: any) => {
  const source = `${role?.name || ''} ${role?.description || ''}`.toLowerCase();
  const keywords = ['售前工程师', 'presales engineer', 'pre-sales engineer', 'pre sales engineer', '售前'];
  return keywords.some((keyword) => source.includes(keyword));
};

const toPreSalesUserOption = (user: any): PreSalesUserOption | null => {
  const id = String(user?.id || user?.user_id || '').trim();
  if (!id) return null;
  const name = user?.user_name || user?.name || user?.username || id;
  return {
    id,
    name,
    username: user?.username,
    phone: user?.phone,
    email: user?.email,
    label: `${name}${user?.username ? ` (${user.username})` : ''}`,
  };
};

export const ReportDetailContent: React.FC<ReportDetailContentProps> = ({ embedded = false }) => {
  const { hasPermission, guardPermission } = usePermission();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState<ActiveReportType>(() => getInitialReportType(location.search));
  const [data, setData] = useState<{ survey: SurveyForm; report: ReportBundle } | null>(null);
  const [preSalesUsers, setPreSalesUsers] = useState<PreSalesUserOption[]>([]);
  const [selectedPreSalesResponsibleId, setSelectedPreSalesResponsibleId] = useState('');
  const [editingPreSalesResponsible, setEditingPreSalesResponsible] = useState(false);
  const [savingPreSalesResponsible, setSavingPreSalesResponsible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveType(getInitialReportType(location.search));
  }, [location.search]);

  useEffect(() => {
    const loadReport = async () => {
      try {
        if (!id) {
          window.alert(ZH.notFoundProject);
          navigate('/customer-survey/list');
          return;
        }

        let surveyRecord = await surveyService.getSurveyById(id);
        if (!surveyRecord) {
          window.alert(ZH.notFoundProject);
          navigate('/customer-survey/list');
          return;
        }

        const reportRow = await surveyReportService.getSurveyReportByFormId(id);
        const reportFromSurveyReport = readReportBundleFromSurveyReport(reportRow);
        const survey = mapSurveyRecordToForm(surveyRecord);
        const localReports = readLocalReportMap();
        const reportFromSurveyForm = readReportBundleFromSurvey(surveyRecord);
        let rawStored = reportFromSurveyReport || reportFromSurveyForm || localReports[id];
        if (!rawStored && isGeneratedReportStatus(surveyRecord)) {
          const aiReport = await generateEnergyReport(survey);
          const rebuilt = buildReportBundle(survey, aiReport, {
            id: survey.preSalesResponsible,
            name: ZH.preSalesOwner,
          });
          await persistReportBundleToSurvey(surveyRecord, rebuilt);
          rawStored = rebuilt;
        }
        if (!rawStored) {
          window.alert(ZH.notFoundReport);
          navigate(`/surveys/fill/${id}`);
          return;
        }

        const { bundle, shouldPersist } = toReportBundle(survey, rawStored);
        setData({ survey, report: bundle });

        if (shouldPersist || !reportFromSurveyReport || !reportFromSurveyForm) {
          await persistReportBundleToSurvey(surveyRecord, bundle);
          const refreshedSurvey = await surveyService.getSurveyById(id);
          if (refreshedSurvey) {
            surveyRecord = refreshedSurvey;
          }
        }

        if (!bundle.preSalesContact?.phone || !bundle.preSalesContact?.email) {
          const users = await userService.getUsers();
          const found = (users || []).find(
            (user: any) => user.id === survey.preSalesResponsible || user.user_id === survey.preSalesResponsible,
          );

          if (found) {
            const nextBundle: ReportBundle = {
              ...bundle,
              preSalesContact: {
                id: found.id || found.user_id,
                name: found.user_name || found.name || found.username || ZH.preSalesOwner,
                username: found.username,
                phone: found.phone,
                email: found.email,
              },
            };

            setData({ survey, report: nextBundle });
            await persistReportBundleToSurvey(surveyRecord, nextBundle);
          }
        }
      } catch (error) {
        console.error('加载报告失败:', error);
        window.alert(ZH.loadFail);
      }
    };

    void loadReport();
  }, [id, navigate]);

  useEffect(() => {
    if (!data?.survey.preSalesResponsible) return;
    setSelectedPreSalesResponsibleId(data.survey.preSalesResponsible);
  }, [data?.survey.preSalesResponsible]);

  useEffect(() => {
    let active = true;

    const loadPreSalesUsers = async () => {
      try {
        const [roles, users] = await Promise.all([roleService.getRoles(), userService.getUsers()]);
        const preSalesRoleIds = new Set((roles || []).filter(isPreSalesEngineerRole).map((role: any) => role.id));

        const filtered = (users || [])
          .filter((user: any) => (user.status || 'enabled') === 'enabled')
          .filter((user: any) => {
            const roleIds = Array.isArray(user.role_ids) && user.role_ids.length ? user.role_ids : [user.role_id];
            const byRoleId = roleIds.some((roleId: string) => preSalesRoleIds.has(roleId));
            if (byRoleId) return true;
            const roleText = `${user.role || ''}`.toLowerCase();
            return roleText.includes('售前工程师') || roleText.includes('presales');
          })
          .map(toPreSalesUserOption)
          .filter(Boolean) as PreSalesUserOption[];

        const unique = new Map<string, PreSalesUserOption>();
        filtered.forEach((item) => unique.set(item.id, item));

        const currentId = String(data?.survey.preSalesResponsible || '').trim();
        if (currentId && !unique.has(currentId)) {
          const currentUser = (users || []).find(
            (user: any) => user.id === currentId || user.user_id === currentId,
          );
          const fallback = currentUser ? toPreSalesUserOption(currentUser) : null;
          if (fallback) unique.set(fallback.id, fallback);
        }

        if (active) {
          setPreSalesUsers(Array.from(unique.values()));
        }
      } catch (error) {
        console.error('加载售前负责人列表失败:', error);
        if (active) {
          setPreSalesUsers([]);
        }
      }
    };

    void loadPreSalesUsers();

    return () => {
      active = false;
    };
  }, [data?.survey.preSalesResponsible]);

  const capabilityMatches = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.report.capabilityMatches) && data.report.capabilityMatches.length) {
      return data.report.capabilityMatches;
    }
    return buildCapabilityMatchPackage(data.survey).matches;
  }, [data]);

  const matchedCount = capabilityMatches.filter((item) => item.matched).length;
  const canEditReportOwner = hasPermission('survey_form:edit_report_owner');
  const canViewSurvey = hasPermission('survey_form:view');
  const capabilityMatchingContext = useMemo(() => {
    if (!data) return null;
    if ((data.report as any).capabilityMatchingContext?.matchingRules) {
      return (data.report as any).capabilityMatchingContext;
    }
    return buildCapabilityMatchPackage(data.survey).context;
  }, [data]);
  const capabilityRecommendations = useMemo<CapabilityRecommendationItem[]>(() => {
    if (!data) return [];
    if (Array.isArray((data.report as any).capabilityRecommendations) && (data.report as any).capabilityRecommendations.length) {
      return (data.report as any).capabilityRecommendations as CapabilityRecommendationItem[];
    }
    return buildCapabilityRecommendations(capabilityMatches, data.report.aiReport);
  }, [data, capabilityMatches]);
  const solutionCatalog = useMemo<CapabilitySolutionItem[]>(() => {
    if (!data || !capabilityMatchingContext) return [];
    if (Array.isArray((data.report as any).solutionCatalog) && (data.report as any).solutionCatalog.length) {
      return (data.report as any).solutionCatalog as CapabilitySolutionItem[];
    }
    return buildCapabilitySolutionCatalog(capabilityMatches, capabilityRecommendations, capabilityMatchingContext);
  }, [data, capabilityMatches, capabilityRecommendations, capabilityMatchingContext]);
  const recognizedTemplateTags = capabilityMatchingContext?.recognizedTemplateTags || [];

  const scoreChartData = useMemo(() => {
    if (!data) return [];
    const score = Math.max(0, Math.min(100, Number(data.report.aiReport.efficiencyScore) || 0));
    return [
      { name: ZH.maturityScore, value: score },
      { name: ZH.improvementSpace, value: 100 - score },
    ];
  }, [data]);

  const recommendationBarData = useMemo(() => {
    if (!data) return [];
    const software = dedupeBySemantic(data.report.aiReport.softwareRecommendations || []);
    const hardware = dedupeBySemantic(data.report.aiReport.hardwareRecommendations || []);
    const consulting = dedupeBySemantic(data.report.aiReport.consultingRecommendations || []);
    return [
      { name: ZH.software, value: software.length },
      { name: ZH.hardware, value: hardware.length },
      { name: ZH.consulting, value: consulting.length },
      { name: ZH.capabilityMatch, value: matchedCount },
    ];
  }, [data, matchedCount]);

  const templateNarrativeBlocks = useMemo(() => {
    const content = data?.report?.templateReport?.renderedContent || '';
    return content
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);
  }, [data]);
  const templateSections = useMemo(
    () => (data?.report?.templateReport?.sections || []).filter((section) => section.title !== '能力匹配计算规则'),
    [data],
  );

  const aiExtended = useMemo(() => {
    const ai = (data?.report?.aiReport || {}) as any;
    const project = data?.survey?.projectName || '本项目';
    const customer = data?.survey?.customerName || '客户方';

    const keyGaps = dedupeBySemantic(toDisplayList(ai.keyGaps, []));
    const nextSteps = dedupeBySemantic(toDisplayList(ai.nextSteps, []));
    const softwareRecommendations = dedupeBySemantic(toDisplayList(ai.softwareRecommendations, []));
    const hardwareRecommendations = dedupeBySemantic(toDisplayList(ai.hardwareRecommendations, []));
    const consultingRecommendations = dedupeBySemantic(toDisplayList(ai.consultingRecommendations, []));
    const recommendedModules = excludeSemanticallyDuplicateItems(
      dedupeBySemantic(toDisplayList(ai.recommendedModules, [])),
      [...softwareRecommendations, ...hardwareRecommendations, ...consultingRecommendations],
    );
    const detailedFindings = excludeSemanticallyDuplicateItems(
      dedupeBySemantic(toDisplayList(ai.detailedFindings, [
        `${project} 当前缺少统一的数据口径与质量监控，存在统计偏差风险。`,
        `针对 ${customer} 的运营场景，能源异常发现与处置仍偏人工流程。`,
        '关键设备运行策略未形成可复制的标准化规则库。',
        '跨部门协同缺乏固定节奏，问题闭环与复盘机制有待强化。',
      ])),
      keyGaps,
    );
    const phasedRoadmap = excludeSemanticallyDuplicateItems(
      dedupeBySemantic(toDisplayList(ai.phasedRoadmap, [
        '0-30天：完成点位复核、数据接入清单与试点范围确认。',
        '31-90天：完成看板、告警、分析模型上线并持续优化。',
        '91-180天：复制至更多系统/区域并固化经营协同机制。',
      ])),
      nextSteps,
    );
    const riskMitigations = dedupeBySemantic(toDisplayList(ai.riskMitigations, [
      '建立数据质量稽核机制，降低统计口径不一致风险。',
      '采用灰度发布与回滚预案，降低集成上线风险。',
      '建立跨部门例会与升级路径，降低协同执行风险。',
    ]));
    const kpiSuggestions = dedupeBySemantic(toDisplayList(ai.kpiSuggestions, [
      '综合能耗强度同比下降 5%-10%',
      '异常告警处置闭环时长下降 40%+',
      '能源数据完整率保持在 98%+',
    ]));
    const investmentBreakdown = dedupeBySemantic(toDisplayList(ai.investmentBreakdown, [
      '计量采集层投入：仪表、传感器、网关与安装调试。',
      '平台与集成投入：应用配置、接口开发与联调验收。',
      '运营服务投入：培训赋能、持续优化与运维支持。',
    ]));
    const expectedBenefits = dedupeBySemantic(toDisplayList(ai.expectedBenefits, [
      '直接收益：能源成本下降与电费优化可量化兑现。',
      '间接收益：设备稳定性提升并减少故障停机损失。',
      '管理收益：提升经营决策时效与透明度。',
    ]));
    const operationMechanism = dedupeBySemantic(toDisplayList(ai.operationMechanism, [
      '建立“日监控、周复盘、月经营”三级运营节奏。',
      '按角色绑定指标责任并纳入绩效考核。',
      '形成问题清单、整改清单、复盘清单三清单机制。',
    ]));
    const dataGovernancePlan = dedupeBySemantic(toDisplayList(ai.dataGovernancePlan, [
      '统一主数据编码、计量口径、指标定义与时间粒度。',
      '建设数据质量看板，持续监测完整性与准确性。',
      '建立权限分级与审计日志，保障数据安全合规。',
    ]));
    const fullNarrative = String(
      ai.fullNarrative
        || `${ai.summary || ''}\n\n${ai.energyStructureAnalysis || ''}\n${ai.savingPotential || ''}\n${ai.roiAnalysis || ''}`,
    ).trim();
    const narrativeHighlights = excludeSemanticallyDuplicateItems(
      dedupeBySemantic(splitParagraphs(fullNarrative)),
      [
        String(ai.summary || ''),
        String(ai.energyStructureAnalysis || ''),
        String(ai.savingPotential || ''),
        String(ai.roiAnalysis || ''),
        ...keyGaps,
        ...nextSteps,
        ...detailedFindings,
        ...phasedRoadmap,
        ...riskMitigations,
      ],
    ).slice(0, 8);

    return {
      fullNarrative,
      narrativeHighlights,
      keyGaps,
      nextSteps,
      detailedFindings,
      phasedRoadmap,
      riskMitigations,
      kpiSuggestions,
      investmentBreakdown,
      expectedBenefits,
      operationMechanism,
      dataGovernancePlan,
      recommendedModules,
      softwareRecommendations,
      hardwareRecommendations,
      consultingRecommendations,
    };
  }, [data]);

  if (!data) {
    return <div className="p-20 text-center text-slate-500">{ZH.loading}</div>;
  }

  const contact = data.report.preSalesContact || { name: ZH.preSalesOwner };
  const templateReportLabel = data.report.templateReport.templateName || ZH.templateReport;
  const reportTypeLabel = activeType === 'ai' ? ZH.aiReport : templateReportLabel;

  const handleShare = async () => {
    if (!guardPermission('survey_form:share_report', ZH.shareAction)) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}#/reports/${id}?type=${activeType}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      window.alert(ZH.shareOk);
    } catch {
      window.prompt(ZH.shareFailPrompt, shareUrl);
    }
  };

  const handleExport = async () => {
    if (!guardPermission('survey_form:export_report', ZH.exportAction)) return;
    const target = exportRootRef.current;
    if (!target) {
      window.alert(ZH.exportNoTarget);
      return;
    }

    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const safeProjectName = (data.survey.projectName || ZH.defaultReportName).replace(/[\\/:*?"<>|]/g, '_');
      const safeTypeName = reportTypeLabel.replace(/[\\/:*?"<>|]/g, '_');
      const fileBaseName = `${safeProjectName}-${safeTypeName}`;

      const maxCanvasEdge = 14000;
      const baseScale = Math.min(window.devicePixelRatio || 1.5, 2);
      const safeScale = Math.max(
        0.8,
        Math.min(
          baseScale,
          maxCanvasEdge / Math.max(target.scrollHeight || 1, target.scrollWidth || 1),
        ),
      );

      const canvas = await html2canvas(target, {
        scale: safeScale,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (doc) => {
          const root = doc.querySelector('[data-export-root="report"]') as HTMLElement | null;
          if (root) {
            root.style.opacity = '1';
            root.style.animation = 'none';
            root.style.transform = 'none';
            root.style.maxWidth = '210mm';
            root.style.width = '210mm';
            root.style.margin = '0 auto';
            root.style.background = '#ffffff';
            root.style.boxShadow = 'none';
          }
          doc.querySelectorAll<HTMLElement>('[data-export-hide="true"]').forEach((node) => {
            node.style.display = 'none';
          });
          doc.querySelectorAll<HTMLElement>('*').forEach((node) => {
            node.style.animation = 'none';
            node.style.transition = 'none';
          });
        },
      });

      if (!canvas.width || !canvas.height) {
        throw new Error('empty canvas');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 6;
      const renderWidth = pageWidth - margin * 2;
      const renderHeight = pageHeight - margin * 2;

      const pxPerMm = canvas.width / renderWidth;
      const pageCanvasHeightPx = Math.max(1, Math.floor(renderHeight * pxPerMm));

      let renderedPx = 0;
      let pageIndex = 0;

      while (renderedPx < canvas.height) {
        const sliceHeight = Math.min(pageCanvasHeightPx, canvas.height - renderedPx);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (!ctx) throw new Error('canvas context is null');
        ctx.drawImage(
          canvas,
          0,
          renderedPx,
          canvas.width,
          sliceHeight,
          0,
          0,
          pageCanvas.width,
          pageCanvas.height,
        );

        const pageImage = pageCanvas.toDataURL('image/jpeg', 0.95);
        const pageImageHeightMm = sliceHeight / pxPerMm;

        if (pageIndex > 0) {
          pdf.addPage();
        }
        pdf.addImage(pageImage, 'JPEG', margin, margin, renderWidth, pageImageHeightMm);

        renderedPx += sliceHeight;
        pageIndex += 1;
      }

      pdf.save(`${fileBaseName}.pdf`);
    } catch (error) {
      console.error('Export PDF failed:', error);
      window.alert(ZH.exportFail);
    } finally {
      setExporting(false);
    }
  };

  const handleSavePreSalesResponsible = async () => {
    if (!data) return;
    if (!guardPermission('survey_form:edit_report_owner', ZH.editPreSalesOwner)) return;

    const nextId = String(selectedPreSalesResponsibleId || '').trim();
    if (!nextId) {
      window.alert(ZH.selectPreSalesOwner);
      return;
    }

    if (nextId === data.survey.preSalesResponsible) {
      return;
    }

    setSavingPreSalesResponsible(true);
    try {
      const updatedSurvey = await surveyService.updateSurvey(data.survey.id, {
        status: data.survey.status,
        report_status: data.survey.reportStatus,
        pre_sales_responsible_id: nextId,
      });

      if (!updatedSurvey) {
        throw new Error('update survey failed');
      }

      const mappedSurvey = mapSurveyRecordToForm(updatedSurvey);
      const matchedUser = preSalesUsers.find((item) => item.id === nextId);
      const nextBundle: ReportBundle = {
        ...data.report,
        preSalesContact: {
          id: nextId,
          name: matchedUser?.name || ZH.preSalesOwner,
          username: matchedUser?.username,
          phone: matchedUser?.phone,
          email: matchedUser?.email,
        },
      };

      setData({ survey: mappedSurvey, report: nextBundle });
      setEditingPreSalesResponsible(false);
      await persistReportBundleToSurvey(updatedSurvey, nextBundle);
      window.alert(ZH.savePreSalesOwnerSuccess);
    } catch (error) {
      console.error('更新售前负责人失败:', error);
      window.alert(ZH.savePreSalesOwnerFail);
    } finally {
      setSavingPreSalesResponsible(false);
    }
  };

  const handleCancelPreSalesResponsibleEdit = () => {
    setSelectedPreSalesResponsibleId(data?.survey.preSalesResponsible || '');
    setEditingPreSalesResponsible(false);
  };

  const tooltipFormatter = (value: number | string | undefined, _name: string, payload?: any) => {
    const metricName = payload?.payload?.name || ZH.valueLabel;
    return [value ?? 0, metricName];
  };

  return (
    <div className={embedded ? '' : 'bg-slate-100 pb-20'}>
      <div
        ref={exportRootRef}
        data-export-root="report"
        className={
          embedded
            ? 'w-full space-y-6'
            : 'mx-auto w-full max-w-[210mm] space-y-6 px-3 pb-12 md:px-6'
        }
      >
        {embedded ? (
          <section data-export-hide="true" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                  {ZH.generatedAtPrefix}{formatDate(data.report.generatedAt)}
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                  {ZH.efficiencyMaturity} {data.report.aiReport.efficiencyScore}%
                </span>
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">
                  {ZH.capabilityMatch} {matchedCount}/{capabilityMatches.length}
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 xl:justify-end">
                <div className="inline-flex shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveType('ai')}
                    className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
                      activeType === 'ai' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    {ZH.aiReport}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveType('template')}
                    className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
                      activeType === 'template' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white'
                    }`}
                    title={templateReportLabel}
                  >
                    {ZH.templateTabShort}
                  </button>
                </div>
                {hasPermission('survey_form:share_report') && (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                  >
                    {ZH.shareLink}
                  </button>
                )}
                {hasPermission('survey_form:export_report') && (
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-70"
                  >
                    {exporting ? ZH.exporting : '导出PDF'}
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : (
          <div
            className="sticky top-0 z-30 overflow-hidden border-b border-slate-200/70 bg-slate-100 pb-3 pt-3 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.35)] [transform:translateZ(0)] md:pt-4"
            style={{ isolation: 'isolate', contain: 'paint' }}
          >
            <DetailPageHeader
              className="z-10"
              title={data.survey.projectName}
              eyebrow={(
                <>
                  <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">
                    {data.survey.industry || ZH.unknownIndustry}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    客户 {data.survey.customerName || '-'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    区域 {data.survey.region || ZH.unknownRegion}
                  </span>
                </>
              )}
              subtitle={(
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                    {ZH.generatedAtPrefix}{formatDate(data.report.generatedAt)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                    当前查看 {reportTypeLabel}
                  </span>
                </div>
              )}
              tabs={[
                {
                  key: 'form',
                  label: ZH.formTab,
                  onClick: () => canViewSurvey && navigate(`/surveys/fill/${data.survey.id}?view=form`),
                  disabled: !canViewSurvey,
                },
                {
                  key: 'report',
                  label: ZH.reportTab,
                  active: true,
                },
              ]}
              tabsHiddenOnExport
              actions={(
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/customer-survey/list')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                  >
                    {ZH.backToList}
                  </button>
                  {hasPermission('survey_form:share_report') && (
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                    >
                      {ZH.shareLink}
                    </button>
                  )}
                  {hasPermission('survey_form:export_report') && (
                    <button
                      type="button"
                      onClick={handleExport}
                      disabled={exporting}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-70"
                    >
                      {exporting ? ZH.exporting : '导出PDF'}
                    </button>
                  )}
                </>
              )}
              actionsHiddenOnExport
              footer={(
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                      {ZH.efficiencyMaturity} {data.report.aiReport.efficiencyScore}%
                    </span>
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">
                      {ZH.capabilityMatch} {matchedCount}/{capabilityMatches.length}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                      {ZH.preSalesOwner} {contact.name || ZH.notProvided}
                    </span>
                  </div>

                  <div data-export-hide="true" className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setActiveType('ai')}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                        activeType === 'ai' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      {ZH.aiReport}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveType('template')}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                        activeType === 'template' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white'
                      }`}
                      title={templateReportLabel}
                    >
                      {ZH.templateTabShort}
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <p className="text-xs text-slate-500">{ZH.preSalesOwner}</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{contact.name || ZH.preSalesOwner}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{ZH.phone}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{contact.phone || ZH.notProvided}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{ZH.email}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{contact.email || ZH.notProvided}</p>
              </div>
            </div>
            {canEditReportOwner && (
              <button
                type="button"
                data-export-hide="true"
                onClick={() => setEditingPreSalesResponsible((prev) => !prev)}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                {editingPreSalesResponsible ? ZH.cancel : ZH.change}
              </button>
            )}
          </div>
          {canEditReportOwner && editingPreSalesResponsible && (
            <div data-export-hide="true" className="mt-4 flex flex-nowrap items-center gap-2 overflow-x-auto border-t border-slate-100 pt-4">
              <select
                value={selectedPreSalesResponsibleId}
                onChange={(event) => setSelectedPreSalesResponsibleId(event.target.value)}
                disabled={savingPreSalesResponsible || preSalesUsers.length === 0}
                className="min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">{preSalesUsers.length ? ZH.selectPreSalesOwner : ZH.noPreSalesUsers}</option>
                {preSalesUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSavePreSalesResponsible}
                disabled={
                  savingPreSalesResponsible
                  || !selectedPreSalesResponsibleId
                  || selectedPreSalesResponsibleId === data.survey.preSalesResponsible
                }
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {savingPreSalesResponsible ? '保存中...' : ZH.savePreSalesOwner}
              </button>
              <button
                type="button"
                onClick={handleCancelPreSalesResponsibleEdit}
                disabled={savingPreSalesResponsible}
                className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {ZH.cancel}
              </button>
            </div>
          )}
        </section>

      {activeType === 'ai' ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.execSummary}</h3>
            <p className="leading-8 text-slate-700">{data.report.aiReport.summary}</p>
          </section>

          <section className="grid grid-cols-1 gap-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-slate-900">{ZH.scoreStructure}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={scoreChartData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={52}>
                      {scoreChartData.map((entry, idx) => (
                        <Cell key={`${entry.name}_${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-slate-900">{ZH.statRecommend}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recommendationBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.diagnosis}</h3>
              <div className="space-y-3 text-sm leading-7 text-slate-700">
                <p><span className="font-semibold">{ZH.energyStructure}</span>{data.report.aiReport.energyStructureAnalysis}</p>
                <p><span className="font-semibold">{ZH.savingPotential}</span>{data.report.aiReport.savingPotential}</p>
                <p><span className="font-semibold">{ZH.estimatedCost}</span>{data.report.aiReport.estimatedCostRange}</p>
                <p><span className="font-semibold">{ZH.roi}</span>{data.report.aiReport.roiAnalysis}</p>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.gapsAndSteps}</h3>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">{ZH.gaps}</p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {aiExtended.keyGaps.map((item, idx) => (
                      <li key={`${item}_${idx}`} className="rounded-lg bg-rose-50 px-3 py-2 text-rose-800">{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">{ZH.nextSteps}</p>
                  <ol className="space-y-2 text-sm text-slate-700">
                    {aiExtended.nextSteps.map((step, idx) => (
                      <li key={`${step}_${idx}`} className="rounded-lg bg-slate-50 px-3 py-2">{idx + 1}. {step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </article>
          </section>

          {aiExtended.narrativeHighlights.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-900">{ZH.supplementInsights}</h3>
              <div className="space-y-3 text-sm leading-8 text-slate-700">
                {aiExtended.narrativeHighlights.map((line, idx) => (
                  <p key={`narrative_highlight_${idx}`} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    {line}
                  </p>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 gap-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">{ZH.templateCapabilityTags}</h3>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {recognizedTemplateTags.length} items
                </span>
              </div>
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
                <p className="font-semibold text-slate-800">{ZH.templateLinkedTemplates}</p>
                <p>
                  {capabilityMatchingContext?.surveyTemplateName || ZH.surveyTemplate}
                  {' / '}
                  {capabilityMatchingContext?.reportTemplateName || ZH.reportTemplate}
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {recognizedTemplateTags.length ? recognizedTemplateTags.map((item: any) => (
                  <article key={`template_tag_${item.capabilityId}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.capabilityName}</p>
                        <p className="mt-1 text-xs text-slate-500">{ZH.templateEvidence}</p>
                      </div>
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {item.score} {ZH.scoreSuffix}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(item.evidence || []).length ? item.evidence.map((evidence: string, idx: number) => (
                        <span key={`${item.capabilityId}_evidence_${idx}`} className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 shadow-sm">
                          {evidence}
                        </span>
                      )) : (
                        <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">{ZH.noDirectSuggestion}</span>
                      )}
                    </div>
                  </article>
                )) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{ZH.noDirectSuggestion}</div>
                )}
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">{ZH.solutionCatalogTitle}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {solutionCatalog.length} items
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {solutionCatalog.length ? solutionCatalog.map((item) => (
                <article key={`solution_catalog_${item.capabilityId}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.capabilityName}</p>
                      <p className="text-xs text-slate-500">{item.capabilityType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getMatchLevelBadgeClass(item.matchLevel, item.matched)}`}>
                        {formatMatchLevelLabel(item.matchLevel)}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {item.score} {ZH.scoreSuffix}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-md bg-white px-3 py-2 text-xs leading-6 text-slate-700">
                    <span className="font-semibold">{ZH.solutionSummary}: </span>
                    {item.solutionSummary}
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-700">{ZH.templateCapabilityTags}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {item.templateTagNames.length ? item.templateTagNames.map((tag, idx) => (
                        <span key={`${item.capabilityId}_tag_${idx}`} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {tag}
                        </span>
                      )) : (
                        <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">{ZH.noDirectSuggestion}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-700">{ZH.specificFunctions}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {item.specificFunctions.length ? item.specificFunctions.map((func, idx) => (
                        <span key={`${item.capabilityId}_func_${idx}`} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {func}
                        </span>
                      )) : (
                        <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">{ZH.noDirectSuggestion}</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-700">{ZH.mappingBasis}</p>
                    <ul className="mt-1 space-y-1 text-xs leading-6 text-slate-700">
                      {item.matchEvidence.length ? item.matchEvidence.map((evidence, idx) => (
                        <li key={`${item.capabilityId}_basis_${idx}`} className="rounded-md bg-white px-2.5 py-1.5">
                          {evidence}
                        </li>
                      )) : (
                        <li className="rounded-md bg-white px-2.5 py-1.5">{ZH.noDirectSuggestion}</li>
                      )}
                    </ul>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-700">{ZH.linkedSuggestion}</p>
                    <ul className="mt-1 space-y-1 text-xs leading-6 text-slate-700">
                      {item.recommendations.length ? item.recommendations.map((suggestion, idx) => (
                        <li key={`${item.capabilityId}_suggest_${idx}`} className="rounded-md bg-white px-2.5 py-1.5">
                          {idx + 1}. {suggestion}
                        </li>
                      )) : (
                        <li className="rounded-md bg-white px-2.5 py-1.5">{ZH.noDirectSuggestion}</li>
                      )}
                    </ul>
                  </div>

                  <div className="mt-3 rounded-md bg-blue-50 px-2.5 py-2 text-xs leading-6 text-blue-700">
                    <span className="font-semibold">{ZH.actionSuggestion}: </span>
                    {item.actionSuggestion}
                  </div>
                </article>
              )) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{ZH.noDirectSuggestion}</div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">{ZH.capabilityAdviceMatch}</h3>
            <div className="grid grid-cols-1 gap-4">
              {capabilityRecommendations.length ? capabilityRecommendations.map((item) => (
                <article key={`capability_recommend_${item.capabilityId}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.capabilityName}</p>
                      <p className="text-xs text-slate-500">{item.capabilityType}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.matched ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.matched ? ZH.matched : ZH.pendingMatch}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-700">{ZH.mappingBasis}</p>
                    <p className="mt-1 text-xs leading-6 text-slate-600">{(item.reasons || []).join('；') || ZH.noDirectSuggestion}</p>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-700">{ZH.linkedSuggestion}</p>
                    <ul className="mt-1 space-y-1 text-xs leading-6 text-slate-700">
                      {(item.recommendations || []).length ? item.recommendations.map((suggestion, idx) => (
                        <li key={`${item.capabilityId}_suggest_${idx}`} className="rounded-md bg-white px-2.5 py-1.5">
                          {idx + 1}. {suggestion}
                        </li>
                      )) : (
                        <li className="rounded-md bg-white px-2.5 py-1.5">{ZH.noDirectSuggestion}</li>
                      )}
                    </ul>
                  </div>
                  <div className="mt-3 rounded-md bg-blue-50 px-2.5 py-2 text-xs leading-6 text-blue-700">
                    <span className="font-semibold">{ZH.actionSuggestion}：</span>
                    {item.actionSuggestion}
                  </div>
                </article>
              )) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{ZH.noDirectSuggestion}</div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.moduleLibrary}</h3>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">{ZH.softwareSuggestion}</p>
                  <div className="flex flex-wrap gap-2">
                    {aiExtended.softwareRecommendations.length ? aiExtended.softwareRecommendations.map((item, idx) => (
                      <span key={`software_${idx}`} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{item}</span>
                    )) : <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{ZH.noDirectSuggestion}</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">{ZH.hardwareSuggestion}</p>
                  <div className="flex flex-wrap gap-2">
                    {aiExtended.hardwareRecommendations.length ? aiExtended.hardwareRecommendations.map((item, idx) => (
                      <span key={`hardware_${idx}`} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item}</span>
                    )) : <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{ZH.noDirectSuggestion}</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">{ZH.consultingSuggestion}</p>
                  <div className="flex flex-wrap gap-2">
                    {aiExtended.consultingRecommendations.length ? aiExtended.consultingRecommendations.map((item, idx) => (
                      <span key={`consulting_${idx}`} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{item}</span>
                    )) : <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{ZH.noDirectSuggestion}</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">{ZH.moduleSuggestionDedup}</p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {aiExtended.recommendedModules.length ? aiExtended.recommendedModules.map((item, idx) => (
                      <li key={`module_${idx}`} className="rounded-lg bg-slate-50 px-3 py-2">{idx + 1}. {item}</li>
                    )) : <li className="rounded-lg bg-slate-50 px-3 py-2">{ZH.noDirectSuggestion}</li>}
                  </ul>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.detailFindings}</h3>
              <ul className="space-y-2 text-sm leading-7 text-slate-700">
                {aiExtended.detailedFindings.map((item, idx) => (
                  <li key={`finding_${idx}`} className="rounded-lg bg-rose-50 px-3 py-2 text-rose-800">{idx + 1}. {item}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.implementationRoadmap}</h3>
              <ol className="space-y-2 text-sm leading-7 text-slate-700">
                {aiExtended.phasedRoadmap.map((item, idx) => (
                  <li key={`roadmap_${idx}`} className="rounded-lg bg-slate-50 px-3 py-2">{idx + 1}. {item}</li>
                ))}
              </ol>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.riskControl}</h3>
              <ul className="space-y-2 text-sm leading-7 text-slate-700">
                {aiExtended.riskMitigations.map((item, idx) => (
                  <li key={`risk_${idx}`} className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">{idx + 1}. {item}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.kpiAndAcceptance}</h3>
              <ul className="space-y-2 text-sm leading-7 text-slate-700">
                {aiExtended.kpiSuggestions.map((item, idx) => (
                  <li key={`kpi_${idx}`} className="rounded-lg bg-cyan-50 px-3 py-2 text-cyan-900">{idx + 1}. {item}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.investmentBreakdown}</h3>
              <ul className="space-y-2 text-sm leading-7 text-slate-700">
                {aiExtended.investmentBreakdown.map((item, idx) => (
                  <li key={`invest_${idx}`} className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-900">{idx + 1}. {item}</li>
                ))}
              </ul>
              <h4 className="mb-2 mt-4 text-sm font-semibold text-slate-900">{ZH.expectedBenefits}</h4>
              <ul className="space-y-2 text-sm leading-7 text-slate-700">
                {aiExtended.expectedBenefits.map((item, idx) => (
                  <li key={`benefit_${idx}`} className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">{idx + 1}. {item}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.operationMechanism}</h3>
              <ul className="space-y-2 text-sm leading-7 text-slate-700">
                {aiExtended.operationMechanism.map((item, idx) => (
                  <li key={`operation_${idx}`} className="rounded-lg bg-slate-50 px-3 py-2">{idx + 1}. {item}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.dataGovernance}</h3>
              <ul className="space-y-2 text-sm leading-7 text-slate-700">
                {aiExtended.dataGovernancePlan.map((item, idx) => (
                  <li key={`governance_${idx}`} className="rounded-lg bg-slate-50 px-3 py-2">{idx + 1}. {item}</li>
                ))}
              </ul>
            </article>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 shadow-sm">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-200/40" />
            <div className="absolute left-1/4 top-1/2 h-20 w-20 rounded-full bg-sky-200/30" />
            <div className="relative grid grid-cols-1 gap-4">
              <div className="rounded-2xl border border-indigo-100 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs font-semibold text-indigo-600">{ZH.reportTemplate}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{data.report.templateReport.templateName}</p>
                <p className="mt-2 text-xs text-slate-500">{ZH.templateLinkedHint}</p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs font-semibold text-sky-600">{ZH.surveyTemplate}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{data.report.templateReport.surveyTemplateName}</p>
                <p className="mt-2 text-xs text-slate-500">{ZH.surveyLinkedHint}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs font-semibold text-emerald-600">{ZH.sectionsCharts}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {templateSections.length} / {(data.report.templateReport.charts || []).length}
                </p>
                <p className="mt-2 text-xs text-slate-500">{ZH.bodyHint}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6">
            {templateSections.map((section, idx) => {
              const tone = getSectionTone(idx);
              return (
                <article key={section.title} className={`rounded-3xl border p-6 shadow-sm ${tone.shell}`}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`text-lg font-black ${tone.title}`}>{section.title}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}>
                      {ZH.templateInsight}
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {splitParagraphs(section.content).map((line, lineIdx) => (
                      <p key={`${section.title}_${lineIdx}`} className="rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-sm leading-7 text-slate-700">
                        {line}
                      </p>
                    ))}
                  </div>
                </article>
              );
            })}
          </section>

          <section className="grid grid-cols-1 gap-6">
            {(data.report.templateReport.charts || []).map((chart, idx) => {
              const tone = getSectionTone(idx + 1);
              return (
                <article key={chart.id} className={`rounded-3xl border p-6 shadow-sm ${tone.shell}`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className={`text-lg font-black ${tone.title}`}>{chart.title}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}>{ZH.chartSnapshot}</span>
                  </div>
                  <p className="text-sm text-slate-600">{chart.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {chart.data.map((point, pointIdx) => (
                      <span
                        key={`${chart.id}_legend_${point.name}`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-xs text-slate-700"
                      >
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[pointIdx % PIE_COLORS.length] }} />
                        {point.name} {point.value}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 h-64 rounded-2xl border border-white/70 bg-white/70 p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      {chart.type === 'pie' ? (
                        <PieChart>
                          <Pie data={chart.data} dataKey="value" nameKey="name" outerRadius={85} innerRadius={45}>
                            {chart.data.map((entry, colorIdx) => (
                              <Cell key={`${entry.name}_${colorIdx}`} fill={PIE_COLORS[colorIdx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={tooltipFormatter} />
                        </PieChart>
                      ) : (
                        <BarChart data={chart.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={tooltipFormatter} />
                          <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-black text-slate-900">{ZH.richBody}</h3>
            <div className="space-y-4">
              {templateNarrativeBlocks.map((block, idx) => {
                const tone = getSectionTone(idx + 2);
                return (
                  <div key={`template_block_${idx}`} className={`rounded-2xl border p-4 shadow-sm ${tone.shell}`}>
                    {splitParagraphs(block).map((line, lineIdx) => (
                      <p
                        key={`template_block_${idx}_${lineIdx}`}
                        className="border-l-4 border-white/80 bg-white/70 px-3 py-2 text-sm leading-7 text-slate-700"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
      </div>
    </div>
  );
};

export const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  if (!id) {
    return <Navigate to="/customer-survey/list" replace />;
  }

  const params = new URLSearchParams(location.search);
  params.set('view', 'report');
  const nextSearch = params.toString();

  return <Navigate to={`/surveys/fill/${id}${nextSearch ? `?${nextSearch}` : ''}`} replace />;
};



