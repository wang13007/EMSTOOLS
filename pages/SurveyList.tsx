import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';
import { ReportStatus, SurveyForm, SurveyStatus } from '../types';
import { surveyService, userService } from '../src/services/supabaseService';

export const SurveyList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [surveys, setSurveys] = useState<SurveyForm[]>([]);
  const [isExternalView, setIsExternalView] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ems_user');
      if (!raw) return;
      const user = JSON.parse(raw);
      const type = user?.type || user?.user_type;
      setIsExternalView(type === 'external');
    } catch {
      setIsExternalView(false);
    }
  }, []);

  useEffect(() => {
    const fetchSurveys = async () => {
      const [surveyList, users] = await Promise.all([surveyService.getSurveys(), userService.getUsers()]);
      const userNameMap: Record<string, string> = {};

      (users || []).forEach((user: any) => {
        const displayName = user.user_name || user.name || user.username || user.id;
        if (user.id) userNameMap[user.id] = displayName;
        if (user.user_id) userNameMap[user.user_id] = displayName;
      });

      const formattedSurveys = (surveyList || []).map((survey: any) => ({
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
        preSalesResponsible: userNameMap[survey.pre_sales_responsible_id] || '-',
      }));

      setSurveys(formattedSurveys);
    };

    void fetchSurveys();
  }, []);

  const filteredSurveys = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return surveys;
    return surveys.filter((item) => {
      return (
        (item.name || '').toLowerCase().includes(keyword) ||
        (item.projectName || '').toLowerCase().includes(keyword) ||
        (item.customerName || '').toLowerCase().includes(keyword)
      );
    });
  }, [searchTerm, surveys]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除该表单吗？')) return;
    const success = await surveyService.deleteSurvey(id);
    if (success) {
      setSurveys((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleRefill = async (id: string) => {
    if (!window.confirm('确定要重填该表单吗？状态将回退至草稿。')) return;
    const success = await surveyService.updateSurvey(id, {
      status: SurveyStatus.DRAFT,
      report_status: ReportStatus.NOT_GENERATED,
    });
    if (success) {
      setSurveys((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: SurveyStatus.DRAFT, reportStatus: ReportStatus.NOT_GENERATED } : item
        )
      );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">调研表单列表</h2>
          <p className="text-slate-500">查看并管理调研项目表单。</p>
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索项目"
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
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
        <table className={`w-full text-left ${isExternalView ? 'min-w-[1240px]' : 'min-w-[1120px]'}`}>
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">表单名称</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">项目名称</th>
              {!isExternalView && (
                <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">客户名称</th>
              )}
              {isExternalView && (
                <>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">创建人</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">提交人</th>
                </>
              )}
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">状态</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">报告</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">创建时间</th>
              <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredSurveys.length > 0 ? (
              filteredSurveys.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-900 text-sm">
                    <Link to={`/surveys/fill/${item.id}`} className="hover:text-blue-600 transition-colors">
                      {item.name || '-'}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{item.projectName || '-'}</td>
                  {!isExternalView && <td className="px-4 py-4 text-sm text-slate-700">{item.customerName || '-'}</td>}
                  {isExternalView && (
                    <>
                      <td className="px-4 py-4 text-sm text-slate-700">{item.creator || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{item.submitter || '-'}</td>
                    </>
                  )}
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === SurveyStatus.COMPLETED
                          ? 'bg-emerald-50 text-emerald-600'
                          : item.status === SurveyStatus.FILLING
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {item.reportStatus === ReportStatus.GENERATED ? (
                      <Link to={`/reports/${item.id}`} className="text-blue-600 hover:underline text-xs font-bold">
                        查看报告
                      </Link>
                    ) : (
                      <span className="text-slate-300 text-xs italic">未生成</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">{new Date(item.createTime).toLocaleDateString()}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      {item.status === SurveyStatus.COMPLETED && (
                        <button onClick={() => handleRefill(item.id)} className="text-blue-600 hover:text-blue-800 font-bold text-xs">
                          重填
                        </button>
                      )}
                      <button onClick={() => handleDelete(item.id)} className="text-rose-600 hover:text-rose-800 font-bold text-xs">
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isExternalView ? 8 : 7} className="px-6 py-20 text-center text-slate-400">
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
    </div>
  );
};
