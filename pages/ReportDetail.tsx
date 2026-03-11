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

const getContactDisplay = (bundle: ReportBundle) => {
  const contact = bundle.preSalesContact || { name: '未配置售前负责人' };
  return {
    name: contact.name || '未配置售前负责人',
    phone: contact.phone || '未提供',
    email: contact.email || '未提供',
  };
};

const formatDate = (iso?: string) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('zh-CN');
  } catch {
    return iso;
  }
};

const IconBadge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${className || 'bg-blue-100 text-blue-700'}`}>{children}</div>
);

export const ReportDetail: React.FC = () => {
  const { hasPermission, guardPermission } = usePermission();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<{ survey: SurveyForm; report: ReportBundle } | null>(null);
  const [activeType, setActiveType] = useState<ActiveReportType>(() => getInitialReportType(location.search));
  const [exporting, setExporting] = useState(false);
  const exportRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveType(getInitialReportType(location.search));
  }, [location.search]);

  useEffect(() => {
    const loadReport = async () => {
      const surveys = JSON.parse(localStorage.getItem('ems_surveys') || '[]');
      const reports = JSON.parse(localStorage.getItem('ems_reports') || '{}');

      const survey = surveys.find((item: SurveyForm) => item.id === id);
      if (!survey) {
        alert('未找到该项目');
        navigate('/customer-survey/list');
        return;
      }

      const rawStored = reports[id || ''];
      if (!rawStored) {
        alert('未找到该项目的评估报告，请重新生成');
        navigate(`/surveys/fill/${id}`);
        return;
      }

      let reportBundle: ReportBundle;
      let shouldPersist = false;

      if (rawStored.aiReport && rawStored.templateReport) {
        const stored = rawStored as ReportBundle;
        const hasCompleteTemplate = Array.isArray((stored as any)?.templateReport?.sections) && Array.isArray((stored as any)?.templateReport?.charts);
        const hasCapabilityMatches = Array.isArray((stored as any)?.capabilityMatches);

        if (hasCompleteTemplate && hasCapabilityMatches) {
          reportBundle = stored;
        } else {
          const rebuilt = buildReportBundle(
            survey,
            stored.aiReport,
            stored.preSalesContact || {
              id: survey.preSalesResponsible,
              name: '售前负责人',
            },
          );
          reportBundle = {
            ...rebuilt,
            generatedAt: stored.generatedAt || rebuilt.generatedAt,
            preSalesContact: stored.preSalesContact || rebuilt.preSalesContact,
          };
          shouldPersist = true;
        }
      } else {
        reportBundle = buildReportBundle(survey, rawStored as ReportResult, {
          id: survey.preSalesResponsible,
          name: '售前负责人',
        });
        shouldPersist = true;
      }

      setData({ survey, report: reportBundle });

      if (shouldPersist) {
        reports[id || ''] = reportBundle;
        localStorage.setItem('ems_reports', JSON.stringify(reports));
      }

      if (!reportBundle.preSalesContact?.phone || !reportBundle.preSalesContact?.email) {
        try {
          const users = await userService.getUsers();
          const found = (users || []).find(
            (user: any) =>
              user.id === survey.preSalesResponsible || user.user_id === survey.preSalesResponsible
          );

          if (found) {
            const nextBundle: ReportBundle = {
              ...reportBundle,
              preSalesContact: {
                id: found.id || found.user_id,
                name: found.user_name || found.name || found.username || '售前负责人',
                username: found.username,
                phone: found.phone,
                email: found.email,
              },
            };

            setData({ survey, report: nextBundle });
            reports[id || ''] = nextBundle;
            localStorage.setItem('ems_reports', JSON.stringify(reports));
          }
        } catch {
          // ignore contact enrich failures
        }
      }
    };

    void loadReport();
  }, [id, navigate]);

  const capabilityMatches = useMemo(() => {
    if (!data) return [];
    const stored = data.report.capabilityMatches;
    if (Array.isArray(stored) && stored.length) return stored;
    return matchProductCapabilities(data.survey, getProductCapabilities());
  }, [data]);

  const matchedCount = capabilityMatches.filter((item) => item.matched).length;
  const unmatchedCount = Math.max(0, capabilityMatches.length - matchedCount);

  const scoreChartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: '能效成熟度', value: Math.max(0, Math.min(100, data.report.aiReport.efficiencyScore)) },
      { name: '提升空间', value: Math.max(0, 100 - Math.max(0, Math.min(100, data.report.aiReport.efficiencyScore))) },
    ];
  }, [data]);

  const recommendationBarData = useMemo(() => {
    if (!data) return [];
    return [
      { name: '软件', value: data.report.aiReport.softwareRecommendations.length },
      { name: '硬件', value: data.report.aiReport.hardwareRecommendations.length },
      { name: '咨询', value: data.report.aiReport.consultingRecommendations.length },
      { name: '能力匹配', value: matchedCount },
    ];
  }, [data, matchedCount]);

  if (!data) {
    return <div className="p-20 text-center text-slate-500">正在加载评估报告...</div>;
  }

  const contact = getContactDisplay(data.report);
  const templateReportLabel = data.report.templateReport.templateName || '模板输出报告';
  const reportTypeLabel = activeType === 'ai' ? 'AI诊断报告' : templateReportLabel;

  const handleShare = async () => {
    if (!guardPermission('survey_form:share_report', '分享报告')) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#/reports/${id}?type=${activeType}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('报告链接已复制到剪贴板');
    } catch {
      window.prompt('复制失败，请手动复制以下链接', shareUrl);
    }
  };

  const handleExport = async () => {
    if (!guardPermission('survey_form:export_report', '导出报告')) return;
    const target = exportRootRef.current;
    if (!target) {
      alert('导出失败：未找到报告内容');
      return;
    }

    setExporting(true);
    try {
      const safeProjectName = (data.survey.projectName || 'report').replace(/[\\/:*?"<>|]/g, '_');
      const safeTemplateLabel = templateReportLabel.replace(/[\\/:*?"<>|]/g, '_');
      const fileBaseName = `${safeProjectName}-${activeType === 'ai' ? 'AI诊断' : safeTemplateLabel}报告`;

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
      console.error('导出PDF失败:', error);
      alert('导出PDF失败，请重试');
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
                {data.survey.industry || '未分类行业'}
              </span>
              <span className="text-xs text-slate-500">{data.survey.region || '未设置区域'}</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">{data.survey.projectName}</h2>
            <p className="mt-2 text-sm text-slate-600">客户：{data.survey.customerName || '-'}</p>
            <p className="text-sm text-slate-500">报告生成时间：{formatDate(data.report.generatedAt)}</p>
          </div>

          <div className="flex items-center gap-3">
            {hasPermission('survey_form:share_report') && (
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8m0 0l-3-3m3 3l-3 3M4 6h8m8 0v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /></svg>
                链接分享
              </button>
            )}
            {hasPermission('survey_form:export_report') && (
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-xl transition-all hover:bg-slate-800 disabled:opacity-70"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v10m0 0l-4-4m4 4l4-4M4 18h16" /></svg>
                {exporting ? '导出中...' : `导出${reportTypeLabel}PDF`}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">您的售前专家</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{contact.name}</p>
          <p className="mt-2 text-xs text-slate-500">联系电话</p>
          <p className="text-sm font-semibold text-slate-800">{contact.phone}</p>
          <p className="mt-1 text-xs text-slate-500">邮箱</p>
          <p className="text-sm font-semibold text-slate-800">{contact.email}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
          <p className="text-xs text-blue-600">能效成熟度</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{data.report.aiReport.efficiencyScore}%</p>
          <p className="mt-2 text-xs text-blue-600">评分越高表示节能体系越成熟</p>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
          <p className="text-xs text-cyan-700">产品能力匹配</p>
          <p className="mt-2 text-3xl font-black text-cyan-800">
            {matchedCount}/{capabilityMatches.length}
          </p>
          <p className="mt-2 text-xs text-cyan-700">已匹配能力 / 总能力</p>
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
          AI诊断报告
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
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-8">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <IconBadge className="bg-blue-100 text-blue-700">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 014-4h6M3 7h6a4 4 0 014 4v10" /></svg>
                  </IconBadge>
                  <h3 className="text-xl font-bold text-slate-900">执行摘要</h3>
                </div>
                <p className="leading-8 text-slate-700">{data.report.aiReport.summary}</p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <IconBadge className="bg-cyan-100 text-cyan-700">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5h2m-7 4h12M4 13h16M7 17h10" /></svg>
                  </IconBadge>
                  <h3 className="text-xl font-bold text-slate-900">诊断分析</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-500">能源结构分析</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{data.report.aiReport.energyStructureAnalysis}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-500">节能潜力</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{data.report.aiReport.savingPotential}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-500">预计投入</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{data.report.aiReport.estimatedCostRange}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-500">ROI分析</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{data.report.aiReport.roiAnalysis}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6 xl:col-span-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-base font-bold text-slate-900">能效评分构成</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={scoreChartData} dataKey="value" nameKey="name" outerRadius={78} innerRadius={48}>
                        {scoreChartData.map((entry, idx) => (
                          <Cell key={`${entry.name}_${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-base font-bold text-slate-900">建议与匹配数量</h3>
                <div className="h-52">
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
              </section>
            </div>
          </div>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">关键差距</h3>
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {data.report.aiReport.keyGaps.map((item, idx) => (
                  <li key={`${item}_${idx}`} className="rounded-lg bg-rose-50 px-3 py-2 text-rose-800">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">下一步行动</h3>
              <ol className="space-y-2 text-sm leading-6 text-slate-700">
                {data.report.aiReport.nextSteps.map((step, idx) => (
                  <li key={`${step}_${idx}`} className="rounded-lg bg-slate-50 px-3 py-2">
                    {idx + 1}. {step}
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">AI建议明细</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold text-blue-700">软件建议</p>
                <p className="mt-2 text-sm leading-6 text-blue-900">{data.report.aiReport.softwareRecommendations.join('；') || '无'}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-bold text-emerald-700">硬件建议</p>
                <p className="mt-2 text-sm leading-6 text-emerald-900">{data.report.aiReport.hardwareRecommendations.join('；') || '无'}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-bold text-amber-700">咨询/改造建议</p>
                <p className="mt-2 text-sm leading-6 text-amber-900">{data.report.aiReport.consultingRecommendations.join('；') || '无'}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">产品能力匹配清单（全量）</h3>
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                匹配 {matchedCount} / 未匹配 {unmatchedCount}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">能力名称</th>
                    <th className="px-4 py-3">类型</th>
                    <th className="px-4 py-3">适用行业</th>
                    <th className="px-4 py-3">适用场景</th>
                    <th className="px-4 py-3">匹配状态</th>
                    <th className="px-4 py-3">匹配依据</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {capabilityMatches.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.type}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.industries.join('、') || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.scenarios.join('、') || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-xs font-bold ${item.matched ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {item.matched ? '已匹配' : '待匹配'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.reasons.join('；')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-500">报告模板</p>
              <p className="mt-1 text-base font-bold text-slate-900">{data.report.templateReport.templateName}</p>
              <p className="mt-2 text-xs text-slate-500">模板ID：{data.report.templateReport.templateId}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-500">关联调研模板</p>
              <p className="mt-1 text-base font-bold text-slate-900">{data.report.templateReport.surveyTemplateName}</p>
              <p className="mt-2 text-xs text-slate-500">模板ID：{data.report.templateReport.surveyTemplateId}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-500">章节 / 图表</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {(data.report.templateReport.sections || []).length} 章节 / {(data.report.templateReport.charts || []).length} 图表
              </p>
              <p className="mt-2 text-xs text-slate-500">模板输出结构完整展示</p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {(data.report.templateReport.sections || []).map((section) => (
              <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-lg font-bold text-slate-900">{section.title}</h3>
                <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{section.content}</pre>
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
            <h3 className="mb-3 text-lg font-bold text-slate-900">模板输出正文</h3>
            <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{data.report.templateReport.renderedContent}</pre>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h3 className="mb-3 text-lg font-bold text-slate-900">占位符映射</h3>
            <table className="min-w-[680px] w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">占位符</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">值</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.report.templateReport.placeholders.map((item) => (
                  <tr key={item.key}>
                    <td className="px-4 py-3 text-xs font-mono text-blue-700">{`{{${item.key}}}`}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
};
