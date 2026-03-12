import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { SurveyForm } from '../types';
import { ReportResult } from '../services/geminiService';
import { buildReportBundle, ReportBundle } from '../services/reportService';
import { surveyReportService, surveyService, userService } from '../src/services/supabaseService';
import { getProductCapabilities, matchProductCapabilities } from '../src/services/productCapabilityStore';
import { usePermission } from '../src/auth/usePermission';

type ActiveReportType = 'ai' | 'template';

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
  efficiencyMaturity: '\u80fd\u6548\u6210\u719f\u5ea6',
  efficiencyHint: '\u8bc4\u5206\u8d8a\u9ad8\u8868\u793a\u80fd\u6548\u7ba1\u7406\u4f53\u7cfb\u8d8a\u6210\u719f\u3002',
  capabilityMatch: '\u80fd\u529b\u5339\u914d',
  capabilityHint: '\u5df2\u5339\u914d\u80fd\u529b / \u603b\u80fd\u529b',
  aiReport: '\u667a\u80fd\u8bca\u65ad\u62a5\u544a',
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
  exportPrefix: '\u5bfc\u51fa',
  defaultReportName: '\u62a5\u544a',
  valueLabel: '\u6570\u503c',
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

const toReportBundle = (survey: SurveyForm, rawStored: any): { bundle: ReportBundle; shouldPersist: boolean } => {
  if (rawStored?.aiReport && rawStored?.templateReport) {
    const bundle = rawStored as ReportBundle;
    const hasTemplateStructure = Array.isArray(bundle.templateReport?.sections) && Array.isArray(bundle.templateReport?.charts);
    const hasCapabilities = Array.isArray(bundle.capabilityMatches);
    if (hasTemplateStructure && hasCapabilities) {
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

const mapSurveyRecordToForm = (survey: any): SurveyForm => {
  const rawData = survey?.data && typeof survey.data === 'object' ? survey.data : {};
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
  const rawData = survey?.data && typeof survey.data === 'object' ? survey.data : {};
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

  const rawData = survey?.data && typeof survey.data === 'object' ? survey.data : {};
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

export const ReportDetail: React.FC = () => {
  const { hasPermission, guardPermission } = usePermission();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState<ActiveReportType>(() => getInitialReportType(location.search));
  const [data, setData] = useState<{ survey: SurveyForm; report: ReportBundle } | null>(null);
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
        const rawStored = reportFromSurveyReport || reportFromSurveyForm || localReports[id];
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

  const capabilityMatches = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.report.capabilityMatches) && data.report.capabilityMatches.length) {
      return data.report.capabilityMatches;
    }
    return matchProductCapabilities(data.survey, getProductCapabilities());
  }, [data]);

  const matchedCount = capabilityMatches.filter((item) => item.matched).length;
  const unmatchedCount = Math.max(0, capabilityMatches.length - matchedCount);

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
    return [
      { name: ZH.software, value: data.report.aiReport.softwareRecommendations.length },
      { name: ZH.hardware, value: data.report.aiReport.hardwareRecommendations.length },
      { name: ZH.consulting, value: data.report.aiReport.consultingRecommendations.length },
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

  const aiExtended = useMemo(() => {
    const ai = (data?.report?.aiReport || {}) as any;
    const project = data?.survey?.projectName || '本项目';
    const customer = data?.survey?.customerName || '客户方';

    return {
      fullNarrative: String(
        ai.fullNarrative
          || `${ai.summary || ''}\n\n${ai.energyStructureAnalysis || ''}\n${ai.savingPotential || ''}\n${ai.roiAnalysis || ''}`,
      ).trim(),
      detailedFindings: toDisplayList(ai.detailedFindings, [
        `${project} 当前缺少统一的数据口径与质量监控，存在统计偏差风险。`,
        `针对 ${customer} 的运营场景，能源异常发现与处置仍偏人工流程。`,
        '关键设备运行策略未形成可复制的标准化规则库。',
        '跨部门协同缺乏固定节奏，问题闭环与复盘机制有待强化。',
      ]),
      phasedRoadmap: toDisplayList(ai.phasedRoadmap, [
        '0-30天：完成点位复核、数据接入清单与试点范围确认。',
        '31-90天：完成看板、告警、分析模型上线并持续优化。',
        '91-180天：复制至更多系统/区域并固化经营协同机制。',
      ]),
      riskMitigations: toDisplayList(ai.riskMitigations, [
        '建立数据质量稽核机制，降低统计口径不一致风险。',
        '采用灰度发布与回滚预案，降低集成上线风险。',
        '建立跨部门例会与升级路径，降低协同执行风险。',
      ]),
      kpiSuggestions: toDisplayList(ai.kpiSuggestions, [
        '综合能耗强度同比下降 5%-10%',
        '异常告警处置闭环时长下降 40%+',
        '能源数据完整率保持在 98%+',
      ]),
      investmentBreakdown: toDisplayList(ai.investmentBreakdown, [
        '计量采集层投入：仪表、传感器、网关与安装调试。',
        '平台与集成投入：应用配置、接口开发与联调验收。',
        '运营服务投入：培训赋能、持续优化与运维支持。',
      ]),
      expectedBenefits: toDisplayList(ai.expectedBenefits, [
        '直接收益：能源成本下降与电费优化可量化兑现。',
        '间接收益：设备稳定性提升并减少故障停机损失。',
        '管理收益：提升经营决策时效与透明度。',
      ]),
      operationMechanism: toDisplayList(ai.operationMechanism, [
        '建立“日监控、周复盘、月经营”三级运营节奏。',
        '按角色绑定指标责任并纳入绩效考核。',
        '形成问题清单、整改清单、复盘清单三清单机制。',
      ]),
      dataGovernancePlan: toDisplayList(ai.dataGovernancePlan, [
        '统一主数据编码、计量口径、指标定义与时间粒度。',
        '建设数据质量看板，持续监测完整性与准确性。',
        '建立权限分级与审计日志，保障数据安全合规。',
      ]),
      recommendedModules: toDisplayList(ai.recommendedModules, []),
      softwareRecommendations: toDisplayList(ai.softwareRecommendations, []),
      hardwareRecommendations: toDisplayList(ai.hardwareRecommendations, []),
      consultingRecommendations: toDisplayList(ai.consultingRecommendations, []),
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
          }
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

  const tooltipFormatter = (value: number | string | undefined, _name: string, payload?: any) => {
    const metricName = payload?.payload?.name || ZH.valueLabel;
    return [value ?? 0, metricName];
  };

  return (
    <div ref={exportRootRef} data-export-root="report" className="space-y-6 pb-20">
      <section className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-200/30" />
        <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-cyan-200/30" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-lg bg-blue-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                {data.survey.industry || ZH.unknownIndustry}
              </span>
              <span className="text-xs text-slate-500">{data.survey.region || ZH.unknownRegion}</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">{data.survey.projectName}</h2>
            <p className="mt-2 text-sm text-slate-600">{ZH.customerPrefix}{data.survey.customerName || '-'}</p>
            <p className="text-sm text-slate-500">{ZH.generatedAtPrefix}{formatDate(data.report.generatedAt)}</p>
          </div>

          <div className="flex items-center gap-3">
            {hasPermission('survey_form:share_report') && (
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
              >
                {ZH.shareLink}
              </button>
            )}
            {hasPermission('survey_form:export_report') && (
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-xl transition-all hover:bg-slate-800 disabled:opacity-70"
              >
                {exporting ? ZH.exporting : `${ZH.exportPrefix}${reportTypeLabel}PDF`}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">{ZH.preSalesOwner}</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{contact.name || ZH.preSalesOwner}</p>
          <p className="mt-2 text-xs text-slate-500">{ZH.phone}</p>
          <p className="text-sm font-semibold text-slate-800">{contact.phone || ZH.notProvided}</p>
          <p className="mt-1 text-xs text-slate-500">{ZH.email}</p>
          <p className="text-sm font-semibold text-slate-800">{contact.email || ZH.notProvided}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
          <p className="text-xs text-blue-600">{ZH.efficiencyMaturity}</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{data.report.aiReport.efficiencyScore}%</p>
          <p className="mt-2 text-xs text-blue-600">{ZH.efficiencyHint}</p>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
          <p className="text-xs text-cyan-700">{ZH.capabilityMatch}</p>
          <p className="mt-2 text-3xl font-black text-cyan-800">
            {matchedCount}/{capabilityMatches.length}
          </p>
          <p className="mt-2 text-xs text-cyan-700">{ZH.capabilityHint}</p>
        </div>
      </section>

      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveType('ai')}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            activeType === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {ZH.aiReport}
        </button>
        <button
          type="button"
          onClick={() => setActiveType('template')}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            activeType === 'template' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {templateReportLabel}
        </button>
      </div>

      {activeType === 'ai' ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.execSummary}</h3>
            <p className="leading-8 text-slate-700">{data.report.aiReport.summary}</p>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
                    {data.report.aiReport.keyGaps.map((item, idx) => (
                      <li key={`${item}_${idx}`} className="rounded-lg bg-rose-50 px-3 py-2 text-rose-800">{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">{ZH.nextSteps}</p>
                  <ol className="space-y-2 text-sm text-slate-700">
                    {data.report.aiReport.nextSteps.map((step, idx) => (
                      <li key={`${step}_${idx}`} className="rounded-lg bg-slate-50 px-3 py-2">{idx + 1}. {step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">{ZH.fullNarrative}</h3>
            <div className="space-y-3 text-sm leading-8 text-slate-700">
              {splitParagraphs(aiExtended.fullNarrative).map((line, idx) => (
                <p key={`full_narrative_${idx}`} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  {line}
                </p>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">{ZH.moduleLibrary}</h3>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">{ZH.softwareSuggestion}</p>
                  <div className="flex flex-wrap gap-2">
                    {aiExtended.softwareRecommendations.map((item, idx) => (
                      <span key={`software_${idx}`} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{item}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">{ZH.hardwareSuggestion}</p>
                  <div className="flex flex-wrap gap-2">
                    {aiExtended.hardwareRecommendations.map((item, idx) => (
                      <span key={`hardware_${idx}`} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">{ZH.consultingSuggestion}</p>
                  <div className="flex flex-wrap gap-2">
                    {aiExtended.consultingRecommendations.map((item, idx) => (
                      <span key={`consulting_${idx}`} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{item}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">{ZH.capabilityMatch}</p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {aiExtended.recommendedModules.map((item, idx) => (
                      <li key={`module_${idx}`} className="rounded-lg bg-slate-50 px-3 py-2">{idx + 1}. {item}</li>
                    ))}
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

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
            <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  {(data.report.templateReport.sections || []).length} / {(data.report.templateReport.charts || []).length}
                </p>
                <p className="mt-2 text-xs text-slate-500">{ZH.bodyHint}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {(data.report.templateReport.sections || []).map((section, idx) => {
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

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
  );
};
