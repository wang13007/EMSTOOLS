
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SurveyForm, SurveyStatus, ReportStatus } from '../types';
import { INDUSTRIES, REGIONS, SURVEY_TEMPLATES } from '../constants';

export const SurveyCreate: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    customerName: '',
    projectName: '',
    industry: INDUSTRIES[0],
    region: REGIONS[0],
    templateId: SURVEY_TEMPLATES[0].id,
    preSalesResponsible: '',
    submitter: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const newForm: SurveyForm = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      status: SurveyStatus.DRAFT,
      reportStatus: ReportStatus.NOT_GENERATED,
      creator: '系统管理员',
      createTime: new Date().toISOString(),
      data: {}
    };

    const existing = JSON.parse(localStorage.getItem('ems_surveys') || '[]');
    localStorage.setItem('ems_surveys', JSON.stringify([...existing, newForm]));
    
    setLoading(false);
    navigate(`/surveys/fill/${newForm.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slideUp">
      <div className="bg-slate-50 border-b border-slate-200 px-8 py-6">
        <h2 className="text-xl font-bold text-slate-900">新建调研表单</h2>
        <p className="text-sm text-slate-500">创建一个新的调研任务，您可以随后填写或分享给客户。</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">表单名称</label>
          <input 
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="例如：2024Q1 某工厂能效调研"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">客户名称</label>
            <input 
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="客户公司全称"
              value={formData.customerName}
              onChange={e => setFormData({...formData, customerName: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">项目名称</label>
            <input 
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="项目具体名称"
              value={formData.projectName}
              onChange={e => setFormData({...formData, projectName: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">所属行业</label>
            <select 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.industry}
              onChange={e => setFormData({...formData, industry: e.target.value})}
            >
              {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">所属区域</label>
            <select 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.region}
              onChange={e => setFormData({...formData, region: e.target.value})}
            >
              {REGIONS.map(reg => <option key={reg} value={reg}>{reg}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">售前负责人</label>
            <input 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="指定售前负责人"
              value={formData.preSalesResponsible}
              onChange={e => setFormData({...formData, preSalesResponsible: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">提交人</label>
            <input 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="指定提交人"
              value={formData.submitter}
              onChange={e => setFormData({...formData, submitter: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">调研模板</label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.templateId}
            onChange={e => setFormData({...formData, templateId: e.target.value})}
          >
            {SURVEY_TEMPLATES.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
          </select>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            取消
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            {loading ? '正在创建...' : '立即创建'}
          </button>
        </div>
      </form>
    </div>
  );
};
