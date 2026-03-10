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

type ActiveReportType = 'ai' | 'template';

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
    id: contact.id || '-',
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

export const ReportDetail: React.FC = () => {
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

        if (hasCompleteTemplate) {
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

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: '能效成熟度', value: data.report.aiReport.efficiencyScore },
      { name: '提升空间', value: 100 - data.report.aiReport.efficiencyScore },
    ];
  }, [data]);

  if (!data) {
    return <div className="p-20 text-center text-slate-500">正在加载评估报告...</div>;
  }

  const contact = getContactDisplay(data.report);
  const templateReportLabel = data.report.templateReport.templateName || '模板输出报告';
  const reportTypeLabel = activeType === 'ai' ? 'AI诊断报告' : templateReportLabel;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#/reports/${id}?type=${activeType}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('报告链接已复制到剪贴板');
    } catch {
      window.prompt('复制失败，请手动复制以下链接', shareUrl);
    }
  };

  const handleExport = async () => {
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
    <div ref={exportRootRef} className="space-y-8 animate-fadeIn pb-20">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded uppercase tracking-wider">
              {data.survey.industry}
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500 text-sm">{data.survey.region}</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">{data.survey.projectName}</h2>
          <p className="text-slate-500 mt-1">报告生成时间：{formatDate(data.report.generatedAt)}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h16M12 4l8 8-8 8"/></svg>
            复制链接
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-70"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            {exporting ? '导出中...' : `导出${reportTypeLabel}PDF`}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">您的售前专家</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-400">姓名</p>
            <p className="font-semibold text-slate-800">{contact.name}</p>
          </div>
          <div>
            <p className="text-slate-400">联系电话</p>
            <p className="font-semibold text-slate-800">{contact.phone}</p>
          </div>
          <div>
            <p className="text-slate-400">邮箱</p>
            <p className="font-semibold text-slate-800">{contact.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-2 inline-flex gap-2">
        <button
          type="button"
          onClick={() => setActiveType('ai')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            activeType === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          AI诊断报告
        </button>
        <button
          type="button"
          onClick={() => setActiveType('template')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            activeType === 'template' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {templateReportLabel}
        </button>
      </div>

      {activeType === 'ai' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-blue-600">执行摘要</h3>
              <p className="text-slate-700 leading-relaxed text-lg">{data.report.aiReport.summary}</p>
            </section>

            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-slate-900">诊断分析</h3>
              <div className="space-y-4 text-sm text-slate-700">
                <p><span className="font-semibold">能源结构分析：</span>{data.report.aiReport.energyStructureAnalysis}</p>
                <p><span className="font-semibold">节能潜力：</span>{data.report.aiReport.savingPotential}</p>
                <p><span className="font-semibold">预计投入：</span>{data.report.aiReport.estimatedCostRange}</p>
                <p><span className="font-semibold">ROI分析：</span>{data.report.aiReport.roiAnalysis}</p>
              </div>
            </section>

            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-slate-900">关键问题与建议</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-rose-600 mb-2">关键差距</p>
                  <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                    {data.report.aiReport.keyGaps.map((item, idx) => (
                      <li key={`${item}-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-2">软件建议</p>
                  <p className="text-sm text-slate-700">{data.report.aiReport.softwareRecommendations.join('；')}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-600 mb-2">硬件建议</p>
                  <p className="text-sm text-slate-700">{data.report.aiReport.hardwareRecommendations.join('；')}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-600 mb-2">咨询建议</p>
                  <p className="text-sm text-slate-700">{data.report.aiReport.consultingRecommendations.join('；')}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">下一步行动</p>
                  <ol className="space-y-2 text-sm text-slate-700 list-decimal pl-5">
                    {data.report.aiReport.nextSteps.map((step, idx) => (
                      <li key={`${step}-${idx}`}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="text-lg font-bold mb-2 text-slate-800">能效成熟度评分</h3>
              <div className="w-[300px] h-48 min-h-[192px] min-w-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="80%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      <Cell fill="#2563eb" />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pt-10">
                  <span className="text-4xl font-extrabold text-blue-600">{data.report.aiReport.efficiencyScore}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">模板信息</h3>
            <div className="mt-3 text-sm text-slate-700 space-y-1">
              <p>报告模板：{data.report.templateReport.templateName}</p>
              <p>报告模板ID：{data.report.templateReport.templateId}</p>
              <p>调研模板：{data.report.templateReport.surveyTemplateName}</p>
              <p>调研模板ID：{data.report.templateReport.surveyTemplateId}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(data.report.templateReport.sections || []).map((section) => (
              <section key={section.title} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-3">{section.title}</h3>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-6">{section.content}</pre>
              </section>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(data.report.templateReport.charts || []).map((chart) => (
              <section key={chart.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{chart.title}</h3>
                <p className="text-sm text-slate-500 mb-3">{chart.summary}</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {chart.type === 'pie' ? (
                      <PieChart>
                        <Pie data={chart.data} dataKey="value" nameKey="name" outerRadius={80}>
                          {chart.data.map((entry, idx) => (
                            <Cell key={`${entry.name}-${idx}`} fill={idx % 2 === 0 ? '#2563eb' : '#93c5fd'} />
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
              </section>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-3">模板输出正文</h3>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-6">{data.report.templateReport.renderedContent}</pre>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-3">占位符映射</h3>
            <table className="w-full text-left min-w-[680px]">
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
          </div>
        </div>
      )}
    </div>
  );
};
