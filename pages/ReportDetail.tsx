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
import { userService } from '../src/services/supabaseService';
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
        const surveys = JSON.parse(localStorage.getItem('ems_surveys') || '[]') as SurveyForm[];
        const reports = JSON.parse(localStorage.getItem('ems_reports') || '{}') as Record<string, any>;

        const survey = surveys.find((item) => item.id === id);
        if (!survey) {
          window.alert(ZH.notFoundProject);
          navigate('/customer-survey/list');
          return;
        }

        const rawStored = reports[id || ''];
        if (!rawStored) {
          window.alert(ZH.notFoundReport);
          navigate(`/surveys/fill/${id}`);
          return;
        }

        const { bundle, shouldPersist } = toReportBundle(survey, rawStored);
        setData({ survey, report: bundle });

        if (shouldPersist) {
          reports[id || ''] = bundle;
          localStorage.setItem('ems_reports', JSON.stringify(reports));
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
            reports[id || ''] = nextBundle;
            localStorage.setItem('ems_reports', JSON.stringify(reports));
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

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${fileBaseName}.pdf`);
    } catch (error) {
      console.error('导出 PDF 失败:', error);
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
    <div ref={exportRootRef} className="space-y-6 animate-fadeIn pb-20">
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

