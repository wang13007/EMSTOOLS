
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SurveyForm, SurveyStatus, ReportStatus, SurveyTemplate } from '../types';
import { SURVEY_TEMPLATES } from '../constants';
import { generateEnergyReport } from '../services/geminiService';

export const SurveyFill: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<SurveyForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('ems_surveys');
    const data = raw ? JSON.parse(raw) : [];
    const found = data.find((f: SurveyForm) => f.id === id);
    if (found) {
      setForm(found);
    } else {
      alert('未找到该表单');
      navigate('/customer-survey/list');
    }
  }, [id, navigate]);

  const template = useMemo(() => {
    if (!form) return null;
    return SURVEY_TEMPLATES.find(t => t.id === form.templateId) || SURVEY_TEMPLATES[0];
  }, [form]);

  const handleFieldChange = (fieldId: string, value: any) => {
    if (!form) return;
    setForm({
      ...form,
      data: { ...form.data, [fieldId]: value },
      status: SurveyStatus.FILLING
    });
  };

  const saveDraft = () => {
    if (!form) return;
    setSaving(true);
    const raw = localStorage.getItem('ems_surveys');
    const data = raw ? JSON.parse(raw) : [];
    const newData = data.map((f: SurveyForm) => f.id === form.id ? form : f);
    localStorage.setItem('ems_surveys', JSON.stringify(newData));
    setTimeout(() => setSaving(false), 500);
  };

  const handleSubmit = async () => {
    if (!form) return;
    setLoading(true);
    try {
      // 1. Generate Report using AI
      const report = await generateEnergyReport(form);
      
      // 2. Update form status
      const updatedForm: SurveyForm = {
        ...form,
        status: SurveyStatus.COMPLETED,
        reportStatus: ReportStatus.GENERATED
      };

      // 3. Save to localStorage
      const raw = localStorage.getItem('ems_surveys');
      const data = raw ? JSON.parse(raw) : [];
      const newData = data.map((f: SurveyForm) => f.id === form.id ? updatedForm : f);
      
      // Also store the report separately or linked
      const reports = JSON.parse(localStorage.getItem('ems_reports') || '{}');
      reports[form.id] = report;
      localStorage.setItem('ems_reports', JSON.stringify(reports));
      
      localStorage.setItem('ems_surveys', JSON.stringify(newData));
      
      navigate(`/reports/${form.id}`);
    } catch (err) {
      console.error(err);
      alert('生成报告失败，请检查网络或 API 配置');
    } finally {
      setLoading(false);
    }
  };

  if (!form || !template) return <div className="p-20 text-center">加载中...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{form.name}</h2>
          <p className="text-slate-500">{form.customerName} · {form.projectName}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={saveDraft}
            disabled={saving || loading}
            className="px-6 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            {saving ? '正在保存...' : '保存草稿'}
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                AI 分析中...
              </>
            ) : '提交并生成报告'}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {template.sections.map(section => (
          <div key={section.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{section.title}</h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.fields.map(field => (
                <div key={field.id} className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.type === 'text' && (
                    <input 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.data[field.id] || ''}
                      onChange={e => handleFieldChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'number' && (
                    <input 
                      type="number"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.data[field.id] || ''}
                      onChange={e => handleFieldChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'select' && (
                    <select 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.data[field.id] || ''}
                      onChange={e => handleFieldChange(field.id, e.target.value)}
                    >
                      <option value="">请选择</option>
                      {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}

                  {field.type === 'multiselect' && (
                    <div className="flex flex-wrap gap-2">
                      {field.options?.map(opt => {
                        const current = form.data[field.id] || [];
                        const isSelected = current.includes(opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => {
                              const next = isSelected ? current.filter((i: string) => i !== opt) : [...current, opt];
                              handleFieldChange(field.id, next);
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                              isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {field.type === 'textarea' && (
                    <textarea 
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.data[field.id] || ''}
                      onChange={e => handleFieldChange(field.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
