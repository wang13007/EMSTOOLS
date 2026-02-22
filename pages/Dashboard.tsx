
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ICONS, INDUSTRIES, REGIONS } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, ScatterChart, Scatter, ZAxis, ReferenceLine, LabelList
} from 'recharts';
import { SurveyForm, SurveyStatus, ReportStatus } from '../types';
import { surveyService } from '../src/services/supabaseService';

type TimeRange = 'month' | 'year' | 'all';

export const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [showAllValueList, setShowAllValueList] = useState(false);
  const [surveys, setSurveys] = useState<SurveyForm[]>([]);

  useEffect(() => {
    // 从数据库获取调研表单列表
    const fetchSurveys = async () => {
      const surveyList = await surveyService.getSurveys();
      // 转换数据格式以匹配前端类型
      const formattedSurveys = surveyList.map(survey => ({
        id: survey.id,
        name: survey.name,
        projectName: survey.project_name,
        customerName: survey.customer_name,
        industry: survey.industry,
        region: survey.region,
        templateId: survey.template_id,
        status: survey.status,
        reportStatus: survey.report_status,
        creatorId: survey.creator_id,
        submitterId: survey.submitter_id,
        preSalesResponsibleId: survey.pre_sales_responsible_id,
        data: survey.data,
        createTime: survey.create_time,
        updateTime: survey.update_time,
        // 前端需要的其他字段
        creator: '系统用户',
        submitter: '系统用户',
        preSalesResponsible: '系统用户'
      }));
      setSurveys(formattedSurveys);
    };

    fetchSurveys();
  }, []);

  const rawData: SurveyForm[] = useMemo(() => {
    return surveys;
  }, [surveys]);

  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return rawData.filter(f => {
      const createDate = new Date(f.createTime);
      if (timeRange === 'month') return createDate >= startOfMonth;
      if (timeRange === 'year') return createDate >= startOfYear;
      return true;
    });
  }, [rawData, timeRange]);

  const stats = useMemo(() => {
    const totalForms = filteredData.length;
    const customerCount = new Set(filteredData.map(f => f.customerName)).size;
    const projectCount = new Set(filteredData.map(f => f.projectName)).size;
    const reportCount = filteredData.filter(f => f.reportStatus === ReportStatus.GENERATED).length;
    
    return [
      { label: '调研客户数量', value: customerCount.toString(), icon: ICONS.Users, color: 'blue' },
      { label: '调研项目数量', value: projectCount.toString(), icon: ICONS.Form, color: 'indigo' },
      { label: '报告生成数量', value: reportCount.toString(), icon: ICONS.Report, color: 'amber' },
    ];
  }, [filteredData]);

  const industryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(f => {
      counts[f.industry] = (counts[f.industry] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [filteredData]);

  const regionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(f => {
      counts[f.region] = (counts[f.region] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [filteredData]);

  // Mock demand ranking based on filtered data
  const demandRanking = useMemo(() => {
    // In a real app, this would be derived from survey field analysis
    const baseDemands = [
      { name: '能效分析需求', base: 12 },
      { name: '数据报表需求', base: 10 },
      { name: '运维管理需求', base: 8 },
      { name: '碳管理需求', base: 6 },
      { name: '可视化需求', base: 5 },
    ];
    const factor = filteredData.length / (rawData.length || 1);
    return baseDemands.map(d => ({
      name: d.name,
      count: Math.max(1, Math.round(d.base * factor + (Math.random() * 2)))
    })).sort((a, b) => b.count - a.count);
  }, [filteredData, rawData]);

  // Mock customer value data (Scatter plot)
  const customerValueData = useMemo(() => {
    const customers = Array.from(new Set(filteredData.map(f => f.customerName)));
    return customers.map(name => ({
      name,
      x: 40 + Math.random() * 50, // Potential Value (0-100)
      y: 30 + Math.random() * 60, // Current Engagement (0-100)
      score: Math.round(70 + Math.random() * 25)
    })).sort((a, b) => b.score - a.score);
  }, [filteredData]);

  const top5Value = customerValueData.slice(0, 5);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">售前综合看板</h2>
          <p className="text-slate-500">实时监控调研进度、项目分布及客户需求趋势。</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {(['month', 'year', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === range 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {range === 'month' ? '本月' : range === 'year' ? '本年' : '累计'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Industry Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
            行业分类占比
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryData.length > 0 ? industryData : [{ name: '暂无数据', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(industryData.length > 0 ? industryData : [{ name: '暂无数据', value: 1 }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            项目区域占比
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData.length > 0 ? regionData : [{ name: '暂无数据', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(regionData.length > 0 ? regionData : [{ name: '暂无数据', value: 1 }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Demand Ranking */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
          客户需求排行榜
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={demandRanking} margin={{ left: 40, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} 
                width={100}
              />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                <LabelList dataKey="count" position="right" style={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Value Map (4 Quadrants) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-rose-500 rounded-full" />
            客户价值图 (Top 5)
          </h3>
          <button 
            onClick={() => setShowAllValueList(!showAllValueList)}
            className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1"
          >
            {showAllValueList ? '收起列表' : '更多客户'}
            <ICONS.ChevronRight className={`w-4 h-4 transition-transform ${showAllValueList ? 'rotate-90' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-px bg-slate-200" />
              <div className="h-full w-px bg-slate-200" />
            </div>
            <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">高价值 / 高参与</div>
            <div className="absolute top-2 right-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">高价值 / 低参与</div>
            <div className="absolute bottom-2 left-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">低价值 / 高参与</div>
            <div className="absolute bottom-2 right-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">低价值 / 低参与</div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="x" name="潜在价值" hide domain={[0, 100]} />
                <YAxis type="number" dataKey="y" name="当前参与度" hide domain={[0, 100]} />
                <ZAxis type="number" dataKey="score" range={[100, 500]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                          <p className="text-sm font-bold text-slate-900">{data.name}</p>
                          <p className="text-xs text-slate-500 mt-1">综合评分: <span className="text-blue-600 font-bold">{data.score}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Customers" data={top5Value} fill="#3b82f6">
                  {top5Value.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList dataKey="name" position="top" style={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">价值排行榜</h4>
            {top5Value.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-300 w-4">0{i+1}</span>
                  <p className="text-sm font-bold text-slate-700">{c.name}</p>
                </div>
                <span className="text-sm font-black text-blue-600">{c.score}</span>
              </div>
            ))}
          </div>
        </div>

        {showAllValueList && (
          <div className="mt-8 border-t border-slate-100 pt-8 animate-slideUp">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-4 py-2">排名</th>
                    <th className="px-4 py-2">客户名称</th>
                    <th className="px-4 py-2">潜在价值</th>
                    <th className="px-4 py-2">当前参与度</th>
                    <th className="px-4 py-2 text-right">综合评分</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customerValueData.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-700">{c.name}</td>
                      <td className="px-4 py-3">
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-400 h-full" style={{ width: `${c.x}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 h-full" style={{ width: `${c.y}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-blue-600">{c.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
