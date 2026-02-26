
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';
import { SurveyForm, SurveyStatus, ReportStatus } from '../types';
import { surveyService, userService } from '../src/services/supabaseService';
import Portal from '../src/components/Portal';

export const SurveyList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyForm | null>(null);
  
  const [surveys, setSurveys] = useState<SurveyForm[]>([]);

  useEffect(() => {
    const fetchSurveys = async () => {
      const [surveyList, users] = await Promise.all([surveyService.getSurveys(), userService.getUsers()]);
      const userNameMap: Record<string, string> = {};

      (users || []).forEach((user: any) => {
        const displayName = user.user_name || user.name || user.username || user.id;
        if (user.id) userNameMap[user.id] = displayName;
        if (user.user_id) userNameMap[user.user_id] = displayName;
      });

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
        creator: userNameMap[survey.creator_id] || '-',
        submitter: userNameMap[survey.submitter_id] || '-',
        preSalesResponsible: userNameMap[survey.pre_sales_responsible_id] || '-'
      }));
      setSurveys(formattedSurveys);
    };

    fetchSurveys();
  }, []);

  const filteredSurveys = useMemo(() => {
    if (!searchTerm) return surveys;
    return surveys.filter((item: SurveyForm) => 
      item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, surveys]);

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除该表单吗？')) {
      const success = await surveyService.deleteSurvey(id);
      if (success) {
        setSurveys(surveys.filter((f: SurveyForm) => f.id !== id));
      }
    }
  };

  const handleRefill = async (id: string) => {
    if (window.confirm('确定要重填该表单吗？状态将回退至草稿。')) {
      const success = await surveyService.updateSurvey(id, {
        status: SurveyStatus.DRAFT,
        report_status: ReportStatus.NOT_GENERATED
      });
      if (success) {
        setSurveys(surveys.map((f: SurveyForm) => 
          f.id === id ? { ...f, status: SurveyStatus.DRAFT, reportStatus: ReportStatus.NOT_GENERATED } : f
        ));
      }
    }
  };

  const handleDownload = (type: 'word' | 'pdf') => {
    alert(`正在准备 ${type.toUpperCase()} 格式报告下载...`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">调研表单列表</h2>
          <p className="text-slate-500">查看及管理所有调研项目，支持在线预览报告及下载。</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <input 
              type="text"
              placeholder="搜索项目或客户..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-slate-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
          <Link 
            to="/surveys/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <ICONS.Plus />
            新建表单
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[1200px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">项目名称</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">客户名称</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">所属行业</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">所属区域</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">状态</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">报告</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">创建时间</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">售前负责</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">创建人</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">提交人</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSurveys.length > 0 ? filteredSurveys.map((item: SurveyForm) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 font-bold text-slate-900 text-sm">
                  <Link to={`/surveys/fill/${item.id}`} className="hover:text-blue-600 transition-colors">
                    {item.projectName}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">{item.customerName}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{item.industry}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{item.region}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.status === SurveyStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' :
                    item.status === SurveyStatus.FILLING ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {item.reportStatus === ReportStatus.GENERATED ? (
                    <button 
                      onClick={() => { setSelectedSurvey(item); setShowReportModal(true); }}
                      className="text-blue-600 hover:underline text-xs font-bold"
                    >
                      查看报告
                    </button>
                  ) : (
                    <span className="text-slate-300 text-xs italic">未生成</span>
                  )}
                </td>
                <td className="px-4 py-4 text-xs text-slate-500">
                  {new Date(item.createTime).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{item.preSalesResponsible || '-'}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{item.creator}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{item.submitter || '-'}</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => handleRefill(item.id)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                    >
                      重填
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-rose-600 hover:text-rose-800 font-bold text-xs"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={11} className="px-6 py-20 text-center text-slate-400">
                  <div className="flex flex-col items-center">
                    <ICONS.Form className="w-12 h-12 mb-4 opacity-20" />
                    <p className="mt-2 font-medium">未找到符合条件的调研记录</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Report Modal */}
      {showReportModal && selectedSurvey && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">调研报告预览</h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedSurvey.projectName} - {selectedSurvey.customerName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => handleDownload('word')}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-white hover:text-blue-600 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      Word 下载
                    </button>
                    <button 
                      onClick={() => handleDownload('pdf')}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-white hover:text-rose-600 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                      PDF 下载
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <ICONS.Plus className="w-6 h-6 rotate-45 text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-12 bg-slate-50">
                <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-xl p-16 min-h-full border border-slate-100">
                  <div className="text-center mb-12">
                    <h1 className="text-3xl font-black text-slate-900 mb-4">数字化转型调研报告</h1>
                    <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full" />
                  </div>
                  
                  <div className="space-y-10">
                    <section>
                      <h2 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2 mb-4">一、项目概况</h2>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between border-b border-slate-50 py-2"><span className="text-slate-500">项目名称：</span><span className="font-bold">{selectedSurvey.projectName}</span></div>
                        <div className="flex justify-between border-b border-slate-50 py-2"><span className="text-slate-500">客户名称：</span><span className="font-bold">{selectedSurvey.customerName}</span></div>
                        <div className="flex justify-between border-b border-slate-50 py-2"><span className="text-slate-500">所属行业：</span><span className="font-bold">{selectedSurvey.industry}</span></div>
                        <div className="flex justify-between border-b border-slate-50 py-2"><span className="text-slate-500">所属区域：</span><span className="font-bold">{selectedSurvey.region}</span></div>
                      </div>
                    </section>

                    <section>
                      <h2 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2 mb-4">二、调研结论</h2>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        基于对 {selectedSurvey.customerName} 的深入调研，我们发现客户在数字化转型过程中存在明显的能效管理优化空间。
                        目前系统集成度较低，数据孤岛现象普遍，建议引入 EMS 专家系统进行统一调度与监控。
                      </p>
                    </section>

                    <section>
                      <h2 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2 mb-4">三、建议方案</h2>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <h4 className="font-bold text-blue-700 text-sm mb-1">1. 基础能源监控</h4>
                          <p className="text-xs text-blue-600/80">实现全厂区水、电、气、热的实时在线监测。</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                          <h4 className="font-bold text-emerald-700 text-sm mb-1">2. 智能能效分析</h4>
                          <p className="text-xs text-emerald-600/80">利用 AI 算法识别异常用能，提供节能优化建议。</p>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-end">
                    <div className="text-[10px] text-slate-400">
                      <p>报告生成时间：{new Date().toLocaleString()}</p>
                      <p>EMS 售前专家助手系统 自动生成</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">售前负责人：{selectedSurvey.preSalesResponsible || '系统管理员'}</p>
                      <div className="w-24 h-12 bg-slate-50 border border-dashed border-slate-200 mt-2 flex items-center justify-center text-[10px] text-slate-300 italic">
                        (电子签章)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
