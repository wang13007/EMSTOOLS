import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReportStatus, SurveyForm, SurveyStatus } from '../types';
import { SURVEY_TEMPLATES } from '../constants/surveyTemplatePreset';
import { generateEnergyReport } from '../services/geminiService';
import { surveyService } from '../src/services/supabaseService';

const getCurrentUserId = () => {
  try {
    const raw = localStorage.getItem('ems_user');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed?.id || '';
  } catch {
    return '';
  }
};

const toSurveyForm = (survey: any): SurveyForm => {
  const data = survey?.data && typeof survey.data === 'object' ? survey.data : {};
  return {
    id: survey.id,
    name: survey.name || '',
    customerName: survey.customer_name || '',
    projectName: survey.project_name || '',
    industry: survey.industry || '',
    region: survey.region || '',
    templateId: survey.template_id || data.template_key || SURVEY_TEMPLATES[0].id,
    status: survey.status || SurveyStatus.DRAFT,
    reportStatus: survey.report_status || ReportStatus.NOT_GENERATED,
    creator: survey.creator_id || '',
    submitter: survey.submitter_id || '',
    preSalesResponsible: survey.pre_sales_responsible_id || '',
    createTime: survey.create_time || new Date().toISOString(),
    data,
  };
};

const syncLocalSurvey = (form: SurveyForm) => {
  try {
    const raw = localStorage.getItem('ems_surveys');
    const list = raw ? (JSON.parse(raw) as SurveyForm[]) : [];
    const exists = list.some((item) => item.id === form.id);
    const next = exists ? list.map((item) => (item.id === form.id ? form : item)) : [...list, form];
    localStorage.setItem('ems_surveys', JSON.stringify(next));
  } catch {
    // ignore local cache write failures
  }
};

export const SurveyFill: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<SurveyForm | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadSurvey = async () => {
      if (!id) {
        alert('未找到该表单');
        navigate('/customer-survey/list');
        return;
      }

      setInitializing(true);
      const survey = await surveyService.getSurveyById(id);
      if (!survey) {
        alert('未找到该表单');
        navigate('/customer-survey/list');
        return;
      }

      const mapped = toSurveyForm(survey);
      setForm(mapped);
      syncLocalSurvey(mapped);
      setInitializing(false);
    };

    loadSurvey();
  }, [id, navigate]);

  const template = useMemo(() => {
    if (!form) return null;
    return SURVEY_TEMPLATES.find((item) => item.id === form.templateId) || SURVEY_TEMPLATES[0];
  }, [form]);

  const handleFieldChange = (fieldId: string, value: any) => {
    if (!form) return;
    setForm({
      ...form,
      data: { ...form.data, [fieldId]: value },
      status: SurveyStatus.FILLING,
    });
  };

  const saveDraft = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const currentUserId = getCurrentUserId();
      const updated = await surveyService.updateSurvey(form.id, {
        data: form.data,
        status: form.status,
        report_status: form.reportStatus,
        submitter_id: currentUserId || undefined,
      });

      if (!updated) {
        throw new Error('保存草稿失败');
      }

      const mapped = toSurveyForm(updated);
      setForm(mapped);
      syncLocalSurvey(mapped);
    } catch (error) {
      console.error('保存草稿失败:', error);
      alert('保存草稿失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!form) return;
    setSubmitting(true);
    try {
      const report = await generateEnergyReport(form);
      const currentUserId = getCurrentUserId();

      const updated = await surveyService.updateSurvey(form.id, {
        data: form.data,
        status: SurveyStatus.COMPLETED,
        report_status: ReportStatus.GENERATED,
        submitter_id: currentUserId || undefined,
      });

      if (!updated) {
        throw new Error('提交失败');
      }

      const mapped = toSurveyForm(updated);
      setForm(mapped);
      syncLocalSurvey(mapped);

      const reports = JSON.parse(localStorage.getItem('ems_reports') || '{}');
      reports[form.id] = report;
      localStorage.setItem('ems_reports', JSON.stringify(reports));

      navigate(`/reports/${form.id}`);
    } catch (error) {
      console.error('提交并生成报告失败:', error);
      alert('生成报告失败，请检查网络或 API 配置');
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing || !form || !template) {
    return <div className="p-20 text-center">加载中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{form.name}</h2>
          <p className="text-slate-500">
            {form.customerName} · {form.projectName}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={saveDraft}
            disabled={saving || submitting}
            className="px-6 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            {saving ? '正在保存...' : '保存草稿'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                AI 分析中...
              </>
            ) : (
              '提交并生成报告'
            )}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {template.sections.map((section) => (
          <div key={section.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{section.title}</h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.fields.map((field) => (
                <div key={field.id} className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {field.type === 'text' && (
                    <input
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.data[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.data[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.data[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    >
                      <option value="">请选择</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'multiselect' && (
                    <div className="flex flex-wrap gap-2">
                      {field.options?.map((opt) => {
                        const current = Array.isArray(form.data[field.id]) ? form.data[field.id] : [];
                        const isSelected = current.includes(opt);
                        return (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => {
                              const next = isSelected ? current.filter((item: string) => item !== opt) : [...current, opt];
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
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
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

