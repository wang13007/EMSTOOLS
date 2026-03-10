import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
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

      const reportBundle: ReportBundle = rawStored.aiReport && rawStored.templateReport
        ? (rawStored as ReportBundle)
        : buildReportBundle(survey, rawStored as ReportResult, {
            id: survey.preSalesResponsible,
            name: '售前负责人',
          });

      setData({ survey, report: reportBundle });

      if (!(rawStored.aiReport && rawStored.templateReport)) {
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
    const title = `${data.survey.projectName} - ${reportTypeLabel}`;
    const text = `${title}\n售前专家：${contact.name} / ${contact.phone}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('分享链接已复制到剪贴板');
      }
    } catch {
      // user cancelled share
    }
  };

  const handleExport = () => {
    const safeProjectName = (data.survey.projectName || 'report').replace(/[\\/:*?"<>|]/g, '_');
    const safeTemplateLabel = templateReportLabel.replace(/[\\/:*?"<>|]/g, '_');
    const filename = `${safeProjectName}-${activeType === 'ai' ? 'AI诊断' : safeTemplateLabel}报告.txt`;

    const header = [
      `项目名称: ${data.survey.projectName}`,
      `客户名称: ${data.survey.customerName}`,
      `报告类型: ${reportTypeLabel}`,
      `生成时间: ${formatDate(data.report.generatedAt)}`,
      `售前专家: ${contact.name}`,
      `联系电话: ${contact.phone}`,
      `邮箱: ${contact.email}`,
      '',
    ].join('\n');

    if (activeType === 'ai') {
      const ai = data.report.aiReport;
      const body = [
        '=== AI诊断报告 ===',
        `能效成熟度: ${ai.efficiencyScore}%`,
        `执行摘要: ${ai.summary}`,
        `能源结构分析: ${ai.energyStructureAnalysis}`,
        `节能潜力: ${ai.savingPotential}`,
        `关键差距: ${ai.keyGaps.join('；')}`,
        `软件建议: ${ai.softwareRecommendations.join('；')}`,
        `硬件建议: ${ai.hardwareRecommendations.join('；')}`,
        `咨询建议: ${ai.consultingRecommendations.join('；')}`,
        `预计投入: ${ai.estimatedCostRange}`,
        `ROI分析: ${ai.roiAnalysis}`,
        `后续建议: ${ai.nextSteps.join('；')}`,
      ].join('\n');
      downloadTextFile(filename, `${header}${body}`);
      return;
    }

    const template = data.report.templateReport;
    const placeholders = template.placeholders
      .map((item) => `{{${item.key}}}: ${item.value}`)
      .join('\n');

    const body = [
      `=== 模板输出报告 (${template.templateName}) ===`,
      `关联调研模板: ${template.surveyTemplateName}`,
      '',
      template.renderedContent,
      '',
      '=== 占位符映射 ===',
      placeholders,
    ].join('\n');

    downloadTextFile(filename, `${header}${body}`);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            分享{reportTypeLabel}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            导出{reportTypeLabel}
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
              <p>调研模板：{data.report.templateReport.surveyTemplateName}</p>
            </div>
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
