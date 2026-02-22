
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SurveyForm } from '../types';
import { ReportResult } from '../services/geminiService';
import { ICONS } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{survey: SurveyForm, report: ReportResult} | null>(null);

  useEffect(() => {
    const surveys = JSON.parse(localStorage.getItem('ems_surveys') || '[]');
    const reports = JSON.parse(localStorage.getItem('ems_reports') || '{}');
    
    const survey = surveys.find((s: SurveyForm) => s.id === id);
    const report = reports[id || ''];
    
    if (survey && report) {
      setData({ survey, report });
    } else if (survey) {
      // If survey exists but report doesn't, maybe it's an old format or failed generation
      alert('未找到该项目的评估报告，请重新生成');
      navigate(`/surveys/fill/${id}`);
    } else {
      alert('未找到该项目');
      navigate('/customer-survey/list');
    }
  }, [id, navigate]);

  if (!data) return <div className="p-20 text-center text-slate-500">正在加载评估报告...</div>;

  const chartData = [
    { name: '能效成熟度', value: data.report.efficiencyScore },
    { name: '提升空间', value: 100 - data.report.efficiencyScore },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded uppercase tracking-wider">
              {data.survey.industry}
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500 text-sm">{data.survey.region}</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">{data.survey.projectName}</h2>
          <p className="text-slate-500 mt-1">评估日期：{new Date(data.survey.createTime).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            分享报告
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-all active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            导出 PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Analysis & Recommendations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Executive Summary */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
              <ICONS.Report className="w-6 h-6" /> 执行摘要
            </h3>
            <div className="space-y-4">
              <p className="text-slate-700 leading-relaxed text-lg">
                {data.report.summary}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">能源结构分析</p>
                  <p className="text-sm text-slate-700">{data.report.energyStructureAnalysis}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">节能潜力评估</p>
                  <p className="text-sm text-slate-700">{data.report.savingPotential}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Key Gaps */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-rose-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              关键差距与痛点 (Key Gaps)
            </h3>
            <div className="space-y-4">
              {data.report.keyGaps.map((gap, i) => (
                <div key={i} className="flex gap-4 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                  <span className="flex-shrink-0 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{i+1}</span>
                  <p className="text-rose-900 font-medium">{gap}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Comprehensive Solution */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-600">
              <ICONS.Energy className="w-6 h-6" /> 综合解决方案建议
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">软件功能模块</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.report.softwareRecommendations.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">硬件改造建议</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.report.hardwareRecommendations.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">专家咨询服务</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.report.consultingRecommendations.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Maturity & ROI */}
        <div className="space-y-8">
          {/* Maturity Score */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
            <h3 className="text-lg font-bold mb-2 text-slate-800">能效成熟度评分</h3>
            <div className="w-full h-48 relative">
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
                    paddingAngle={0}
                    dataKey="value"
                  >
                    <Cell fill="#2563eb" />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pt-10">
                <span className="text-4xl font-extrabold text-blue-600">{data.report.efficiencyScore}%</span>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 mt-2 font-medium">
              基于行业基准对比得出
            </p>
          </div>

          {/* ROI & Cost */}
          <div className="bg-blue-600 p-8 rounded-2xl shadow-xl text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
               投资与回报分析
            </h3>
            <div className="mb-6">
              <p className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1">预计投资规模</p>
              <div className="text-2xl font-black">{data.report.estimatedCostRange}</div>
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1">ROI 估算</p>
              <p className="text-sm font-medium">{data.report.roiAnalysis}</p>
            </div>
            <div className="space-y-3 pt-4 border-t border-blue-500">
              <p className="text-xs font-bold opacity-70 uppercase tracking-wider">后续行动建议</p>
              {data.report.nextSteps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start text-sm bg-blue-500/30 p-2 rounded">
                  <span className="font-bold">{i+1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
