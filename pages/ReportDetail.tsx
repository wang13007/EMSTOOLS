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
    return new Date(iso).toLocaleString('en-US');
  } catch {
    return iso;
  }
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
        name: 'Pre-sales Owner',
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
      name: 'Pre-sales Owner',
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
          window.alert('Project was not found.');
          navigate('/customer-survey/list');
          return;
        }

        const rawStored = reports[id || ''];
        if (!rawStored) {
          window.alert('Report was not found. Please generate it again.');
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
                name: found.user_name || found.name || found.username || 'Pre-sales Owner',
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
        console.error('Failed to load report:', error);
        window.alert('Failed to load report. Please try again later.');
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
      { name: 'Maturity Score', value: score },
      { name: 'Improvement Space', value: 100 - score },
    ];
  }, [data]);

  const recommendationBarData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Software', value: data.report.aiReport.softwareRecommendations.length },
      { name: 'Hardware', value: data.report.aiReport.hardwareRecommendations.length },
      { name: 'Consulting', value: data.report.aiReport.consultingRecommendations.length },
      { name: 'Capability Match', value: matchedCount },
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
    return <div className="p-20 text-center text-slate-500">Loading report...</div>;
  }

  const contact = data.report.preSalesContact || { name: 'Pre-sales Owner' };
  const templateReportLabel = data.report.templateReport.templateName || 'Template Report';
  const reportTypeLabel = activeType === 'ai' ? 'AI Report' : templateReportLabel;

  const handleShare = async () => {
    if (!guardPermission('survey_form:share_report', 'share report')) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}#/reports/${id}?type=${activeType}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      window.alert('Report link copied.');
    } catch {
      window.prompt('Copy failed. Please copy this link manually:', shareUrl);
    }
  };

  const handleExport = async () => {
    if (!guardPermission('survey_form:export_report', 'export report')) return;
    const target = exportRootRef.current;
    if (!target) {
      window.alert('Export failed: report content not found.');
      return;
    }

    setExporting(true);
    try {
      const safeProjectName = (data.survey.projectName || 'report').replace(/[\\/:*?"<>|]/g, '_');
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
      console.error('Export PDF failed:', error);
      window.alert('Export PDF failed. Please try again.');
    } finally {
      setExporting(false);
    }
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
                {data.survey.industry || 'Unknown Industry'}
              </span>
              <span className="text-xs text-slate-500">{data.survey.region || 'Unknown Region'}</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">{data.survey.projectName}</h2>
            <p className="mt-2 text-sm text-slate-600">Customer: {data.survey.customerName || '-'}</p>
            <p className="text-sm text-slate-500">Generated At: {formatDate(data.report.generatedAt)}</p>
          </div>

          <div className="flex items-center gap-3">
            {hasPermission('survey_form:share_report') && (
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
              >
                Share Link
              </button>
            )}
            {hasPermission('survey_form:export_report') && (
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-xl transition-all hover:bg-slate-800 disabled:opacity-70"
              >
                {exporting ? 'Exporting...' : `Export ${reportTypeLabel} PDF`}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Pre-sales Owner</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{contact.name || 'Pre-sales Owner'}</p>
          <p className="mt-2 text-xs text-slate-500">Phone</p>
          <p className="text-sm font-semibold text-slate-800">{contact.phone || 'N/A'}</p>
          <p className="mt-1 text-xs text-slate-500">Email</p>
          <p className="text-sm font-semibold text-slate-800">{contact.email || 'N/A'}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
          <p className="text-xs text-blue-600">Efficiency Maturity</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{data.report.aiReport.efficiencyScore}%</p>
          <p className="mt-2 text-xs text-blue-600">Higher score means more mature energy management.</p>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
          <p className="text-xs text-cyan-700">Capability Match</p>
          <p className="mt-2 text-3xl font-black text-cyan-800">
            {matchedCount}/{capabilityMatches.length}
          </p>
          <p className="mt-2 text-xs text-cyan-700">Matched capabilities / Total capabilities</p>
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
          AI Report
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
            <h3 className="mb-3 text-lg font-bold text-slate-900">Executive Summary</h3>
            <p className="leading-8 text-slate-700">{data.report.aiReport.summary}</p>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-slate-900">Efficiency Score Structure</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={scoreChartData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={52}>
                      {scoreChartData.map((entry, idx) => (
                        <Cell key={`${entry.name}_${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-slate-900">Recommendations and Matches</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recommendationBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">Diagnostic Analysis</h3>
              <div className="space-y-3 text-sm leading-7 text-slate-700">
                <p><span className="font-semibold">Energy Structure:</span> {data.report.aiReport.energyStructureAnalysis}</p>
                <p><span className="font-semibold">Saving Potential:</span> {data.report.aiReport.savingPotential}</p>
                <p><span className="font-semibold">Estimated Investment:</span> {data.report.aiReport.estimatedCostRange}</p>
                <p><span className="font-semibold">ROI:</span> {data.report.aiReport.roiAnalysis}</p>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">Gaps and Next Steps</h3>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">Key Gaps</p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {data.report.aiReport.keyGaps.map((item, idx) => (
                      <li key={`${item}_${idx}`} className="rounded-lg bg-rose-50 px-3 py-2 text-rose-800">{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">Next Steps</p>
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
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-500">Report Template</p>
              <p className="mt-1 text-base font-bold text-slate-900">{data.report.templateReport.templateName}</p>
              <p className="mt-2 text-xs text-slate-500">Template ID: {data.report.templateReport.templateId}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-500">Survey Template</p>
              <p className="mt-1 text-base font-bold text-slate-900">{data.report.templateReport.surveyTemplateName}</p>
              <p className="mt-2 text-xs text-slate-500">Template ID: {data.report.templateReport.surveyTemplateId}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-500">Sections / Charts</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {(data.report.templateReport.sections || []).length} / {(data.report.templateReport.charts || []).length}
              </p>
              <p className="mt-2 text-xs text-slate-500">Body is rendered as rich text blocks and charts.</p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {(data.report.templateReport.sections || []).map((section) => (
              <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-lg font-bold text-slate-900">{section.title}</h3>
                <div className="space-y-2 text-sm leading-7 text-slate-700">
                  {splitParagraphs(section.content).map((line, idx) => (
                    <p key={`${section.title}_${idx}`}>{line}</p>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {(data.report.templateReport.charts || []).map((chart) => (
              <article key={chart.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">{chart.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{chart.summary}</p>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {chart.type === 'pie' ? (
                      <PieChart>
                        <Pie data={chart.data} dataKey="value" nameKey="name" outerRadius={85} innerRadius={45}>
                          {chart.data.map((entry, idx) => (
                            <Cell key={`${entry.name}_${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    ) : (
                      <BarChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-bold text-slate-900">Template Body (Rich Text)</h3>
            <div className="space-y-4">
              {templateNarrativeBlocks.map((block, idx) => (
                <div key={`template_block_${idx}`} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  {splitParagraphs(block).map((line, lineIdx) => (
                    <p key={`template_block_${idx}_${lineIdx}`} className="text-sm leading-7 text-slate-700">
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
