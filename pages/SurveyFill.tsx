import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ReportStatus, SurveyForm, SurveyStatus } from '../types';
import { generateEnergyReport } from '../services/geminiService';
import { buildReportBundle, PreSalesContactInfo } from '../services/reportService';
import { surveyReportService, surveyService, userService } from '../src/services/supabaseService';
import { applySurveyTemplateNameOverrides } from '../src/services/templateNameStore';
import { usePermission } from '../src/auth/usePermission';
import { getAllSurveyTemplates, syncImportedTemplatesFromDatabase } from '../src/services/templateStore';
import { DetailPageHeader } from '../components/DetailPageHeader';
import { ReportDetailContent } from './ReportDetail';

const AUTO_SAVE_DELAY_MS = 1200;

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

const resolvePreSalesContact = async (preSalesResponsibleId?: string): Promise<PreSalesContactInfo> => {
  if (!preSalesResponsibleId) {
    return { name: '未配置售前负责人' };
  }

  try {
    const users = await userService.getUsers();
    const target = (users || []).find(
      (user: any) => user.id === preSalesResponsibleId || user.user_id === preSalesResponsibleId
    );

    if (!target) {
      return { id: preSalesResponsibleId, name: '未匹配售前负责人' };
    }

    return {
      id: target.id || target.user_id,
      name: target.user_name || target.name || target.username || '售前负责人',
      username: target.username,
      phone: target.phone,
      email: target.email,
    };
  } catch {
    return { id: preSalesResponsibleId, name: '售前负责人' };
  }
};

const toSurveyForm = (survey: any): SurveyForm => {
  const data = survey?.data && typeof survey.data === 'object' ? survey.data : {};
  const surveyTemplates = getAllSurveyTemplates();
  const fallbackTemplateId = surveyTemplates[0]?.id || '';
  return {
    id: survey.id,
    name: survey.name || '',
    customerName: survey.customer_name || '',
    projectName: survey.project_name || '',
    industry: survey.industry || '',
    region: survey.region || '',
    templateId: survey.template_id || data.template_key || fallbackTemplateId,
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

const formatTime = (iso?: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour12: false });
  } catch {
    return '';
  }
};

const getWorkspaceView = (search: string) => {
  const params = new URLSearchParams(search);
  return params.get('view') === 'report' ? 'report' : 'form';
};

export const SurveyFill: React.FC = () => {
  const { hasPermission, guardPermission } = usePermission();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState<SurveyForm | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [templateRefreshKey, setTemplateRefreshKey] = useState(0);
  const surveyTemplates = useMemo(
    () => applySurveyTemplateNameOverrides(getAllSurveyTemplates()),
    [templateRefreshKey]
  );
  const canEditSurvey = hasPermission('survey_form:edit');
  const canSubmitSurvey = hasPermission('survey_form:submit') && hasPermission('survey_form:generate_report');
  const canShareSurvey = hasPermission('survey_form:share_report');
  const canViewReport = hasPermission('survey_form:view_report');
  const workspaceView = getWorkspaceView(location.search);

  const persistLockRef = useRef(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const autoSaveStateResetTimerRef = useRef<number | null>(null);

  const setWorkspaceView = useCallback((nextView: 'form' | 'report') => {
    const params = new URLSearchParams(location.search);
    params.set('view', nextView);
    if (nextView === 'form') {
      params.delete('type');
    } else if (!params.get('type')) {
      params.set('type', 'ai');
    }
    navigate(
      {
        pathname: location.pathname,
        search: `?${params.toString()}`,
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    const loadSurvey = async () => {
      await syncImportedTemplatesFromDatabase();
      setTemplateRefreshKey((prev) => prev + 1);

      const routeId = id && id !== 'undefined' && id !== 'null' ? id : '';
      const fallbackId = localStorage.getItem('ems_last_created_survey_id') || '';
      const resolvedId = routeId || fallbackId;
      const fromAuthorizedLink = location.pathname.includes('/authorized/surveys/fill/');

      if (!resolvedId) {
        setInitializing(false);
        alert('未找到该表单');
        navigate('/customer-survey/list');
        return;
      }

      setInitializing(true);
      let survey = await surveyService.getSurveyById(resolvedId);
      if (!survey && fromAuthorizedLink) {
        survey = await surveyService.grantExternalAccessByAuthorizedLink(resolvedId);
      }
      if (!survey) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        survey = await surveyService.getSurveyById(resolvedId);
        if (!survey && fromAuthorizedLink) {
          survey = await surveyService.grantExternalAccessByAuthorizedLink(resolvedId);
        }
      }
      if (!survey) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        survey = await surveyService.getSurveyById(resolvedId);
        if (!survey && fromAuthorizedLink) {
          survey = await surveyService.grantExternalAccessByAuthorizedLink(resolvedId);
        }
      }
      if (!survey) {
        setInitializing(false);
        alert('未找到该表单');
        navigate('/customer-survey/list');
        return;
      }

      const mapped = toSurveyForm(survey);
      setForm(mapped);
      syncLocalSurvey(mapped);
      setDirty(false);
      setAutoSaveState('idle');
      setLastSavedAt(survey.update_time || survey.create_time || '');
      setInitializing(false);
    };

    loadSurvey();
  }, [id, location.pathname, navigate]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
      if (autoSaveStateResetTimerRef.current) {
        window.clearTimeout(autoSaveStateResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty && autoSaveState !== 'saving') return;
      event.preventDefault();
      event.returnValue = '当前有未保存修改，确认离开吗？';
      return event.returnValue;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, autoSaveState]);

  const persistDraft = useCallback(
    async (options?: { silent?: boolean; alertOnError?: boolean }) => {
      const silent = options?.silent ?? false;
      const alertOnError = options?.alertOnError ?? true;
      if (!form) return false;
      if (!canEditSurvey) {
        if (alertOnError) guardPermission('survey_form:edit', '保存草稿');
        return false;
      }
      if (persistLockRef.current) return false;

      persistLockRef.current = true;
      if (silent) {
        setAutoSaveState('saving');
      } else {
        setSaving(true);
      }

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
        setDirty(false);
        setLastSavedAt(new Date().toISOString());
        setAutoSaveState('saved');

        if (autoSaveStateResetTimerRef.current) {
          window.clearTimeout(autoSaveStateResetTimerRef.current);
        }
        autoSaveStateResetTimerRef.current = window.setTimeout(() => {
          setAutoSaveState('idle');
        }, 1800);
        return true;
      } catch (error) {
        console.error('保存草稿失败:', error);
        setAutoSaveState('error');
        if (alertOnError) {
          alert('保存草稿失败，请重试');
        }
        return false;
      } finally {
        persistLockRef.current = false;
        if (!silent) {
          setSaving(false);
        }
      }
    },
    [form, canEditSurvey, guardPermission]
  );

  useEffect(() => {
    if (!form || initializing || submitting || form.status === SurveyStatus.COMPLETED || !canEditSurvey) return;
    if (!dirty) return;

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      void persistDraft({ silent: true, alertOnError: false });
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [dirty, form, initializing, submitting, persistDraft, canEditSurvey]);

  const template = useMemo(() => {
    if (!form) return null;
    return surveyTemplates.find((item) => item.id === form.templateId) || surveyTemplates[0];
  }, [form, surveyTemplates]);

  const matchesVisibleWhen = (visibleWhen?: { fieldId: string; values: string[] }): boolean => {
    if (!visibleWhen) return true;
    const fieldValue = form?.data?.[visibleWhen.fieldId];
    if (!fieldValue) return false;

    const selectedValues = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
    return selectedValues.some((selected: string) => visibleWhen.values.includes(selected));
  };

  const shouldShowSection = (section: any): boolean => matchesVisibleWhen(section.visibleWhen);

  const shouldShowField = (field: any): boolean => matchesVisibleWhen(field.visibleWhen);

  const isFieldEmpty = (field: any, value: any) => {
    if (Array.isArray(value)) return value.length === 0;
    if (field.type === 'number') return value === '' || value === null || typeof value === 'undefined';
    return String(value ?? '').trim().length === 0;
  };

  const getMissingVisibleRequiredFields = () => {
    if (!template || !form) return [];

    return template.sections
      .filter((section) => shouldShowSection(section))
      .flatMap((section) =>
        section.fields
          .filter((field) => shouldShowField(field) && field.required)
          .filter((field) => isFieldEmpty(field, form.data?.[field.id]))
          .map((field) => `${section.title} / ${field.label}`)
      );
  };

  const isFieldReadOnly = (fieldId: string): boolean => {
    const readonlyFields = [
      'field_001_1',
      'field_002_2',
      'field_003_3',
      'field_004_4',
      'field_005_5',
      'field_006_6',
      'computed_summary_readonly',
      'ai_generated_final_conclusion',
      'report_template_placeholder',
    ];
    return readonlyFields.includes(fieldId);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    if (!form || form.status === SurveyStatus.COMPLETED || !canEditSurvey) {
      if (!canEditSurvey) guardPermission('survey_form:edit', '编辑表单');
      return;
    }
    setForm({
      ...form,
      data: { ...form.data, [fieldId]: value },
      status: SurveyStatus.FILLING,
    });
    setDirty(true);
    if (autoSaveState !== 'saving') {
      setAutoSaveState('idle');
    }
  };

  const saveDraft = async () => {
    await persistDraft({ silent: false, alertOnError: true });
  };

  const saveBeforeLeave = async () => {
    if (!dirty) return true;
    const saved = await persistDraft({ silent: true, alertOnError: false });
    if (saved) return true;
    return window.confirm('自动保存草稿失败，是否仍返回调研表单列表？');
  };

  const handleBackToList = async () => {
    if (submitting) return;
    const canLeave = await saveBeforeLeave();
    if (!canLeave) return;
    navigate('/customer-survey/list');
  };

  const handleCopyExternalLink = async () => {
    if (!canShareSurvey) {
      guardPermission('survey_form:share_report', '复制外链填写地址');
      return;
    }
    if (!form) return;
    try {
      const nextData = {
        ...(form.data || {}),
        external_link_enabled: true,
      };

      if (!form.data?.external_link_enabled) {
        const updated = await surveyService.updateSurvey(form.id, {
          data: nextData,
          status: form.status,
          report_status: form.reportStatus,
        });

        if (updated) {
          const mapped = toSurveyForm(updated);
          setForm(mapped);
          syncLocalSurvey(mapped);
        }
      }

      const link = `${window.location.origin}${window.location.pathname}#/authorized/surveys/fill/${form.id}`;
      await navigator.clipboard.writeText(link);
      alert('外链填写地址已复制，外部客户可通过该链接继续填写。');
    } catch (error) {
      console.error('复制外链失败:', error);
      alert('复制失败，请稍后重试');
    }
  };

  const handleSubmit = async () => {
    if (!canSubmitSurvey) {
      guardPermission('survey_form:submit', '提交并生成报告');
      return;
    }
    if (!form) return;
    setSubmitting(true);
    try {
      const missingFields = getMissingVisibleRequiredFields();
      if (missingFields.length) {
        const preview = missingFields.slice(0, 8).map((item) => `- ${item}`).join('\n');
        const suffix = missingFields.length > 8 ? `\n- 其余 ${missingFields.length - 8} 项请在表单中继续补全` : '';
        throw new Error(`请先补全当前联动显示的必填项：\n${preview}${suffix}`);
      }

      if (dirty) {
        const saved = await persistDraft({ silent: true, alertOnError: false });
        if (!saved && dirty) {
          throw new Error('自动保存失败，请先点击“保存草稿”');
        }
      }

      const aiReport = await generateEnergyReport(form);
      const preSalesContact = await resolvePreSalesContact(form.preSalesResponsible);
      const currentUserId = getCurrentUserId();
      const submitTime = new Date().toISOString();
      const reportSourceForm: SurveyForm = {
        ...form,
        status: SurveyStatus.COMPLETED,
        reportStatus: ReportStatus.GENERATED,
        submitter: currentUserId || form.submitter,
        data: {
          ...(form.data || {}),
          submit_time: submitTime,
        },
      };
      const reportBundle = buildReportBundle(reportSourceForm, aiReport, preSalesContact);
      const submittedData = {
        ...reportSourceForm.data,
        report_bundle: reportBundle,
        report_generated_at: reportBundle.generatedAt,
      };

      const updated = await surveyService.updateSurvey(form.id, {
        data: submittedData,
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
      setDirty(false);
      setLastSavedAt(new Date().toISOString());
      setAutoSaveState('saved');

      const reports = JSON.parse(localStorage.getItem('ems_reports') || '{}');
      reports[form.id] = reportBundle;
      localStorage.setItem('ems_reports', JSON.stringify(reports));

      await surveyReportService.saveSurveyReportByFormId(form.id, reportBundle);

      const params = new URLSearchParams(location.search);
      params.set('view', 'report');
      params.set('type', 'ai');
      navigate(
        {
          pathname: location.pathname,
          search: `?${params.toString()}`,
        },
        { replace: true },
      );
    } catch (error) {
      console.error('提交并生成报告失败:', error);
      alert(error instanceof Error ? error.message : '生成报告失败，请检查网络或 API 配置');
    } finally {
      setSubmitting(false);
    }
  };

  const autoSaveMessage = useMemo(() => {
    if (form?.status === SurveyStatus.COMPLETED) return '该表单已提交完成，当前为只读模式';
    if (autoSaveState === 'saving') return '正在自动保存...';
    if (autoSaveState === 'saved') return `已自动保存 ${formatTime(lastSavedAt)}`;
    if (autoSaveState === 'error') return '自动保存失败，请点击“保存草稿”重试';
    if (dirty) return '检测到变更，稍后将自动保存';
    if (lastSavedAt) return `上次保存 ${formatTime(lastSavedAt)}`;
    return '实时保存已开启';
  }, [autoSaveState, dirty, lastSavedAt]);

  const visibleSections = useMemo(() => {
    if (!template) return [];
    return template.sections
      .filter((section) => shouldShowSection(section))
      .map((section) => ({
        ...section,
        fields: section.fields.filter((field) => shouldShowField(field)),
      }))
      .filter((section) => section.fields.length > 0);
  }, [template, form]);

  if (initializing || !form || !template) {
    return <div className="p-20 text-center">加载中...</div>;
  }

  const isCompleted = form.status === SurveyStatus.COMPLETED;
  const isAuthorizedFill = location.pathname.includes('/authorized/surveys/fill/');
  const hasGeneratedReport = form.reportStatus === ReportStatus.GENERATED;
  const isFormWorkspace = workspaceView === 'form';
  const workspaceTitle = form.projectName || form.name || '调研工作区';
  const workspaceContainerClass = 'max-w-[1280px]';
  const formStatusLabel = isCompleted ? '已完成' : form.status === SurveyStatus.FILLING ? '填写中' : '草稿';
  const reportStatusLabel = hasGeneratedReport ? '已生成报告' : '未生成报告';
  const headerMetaItems = [
    { label: '客户', value: form.customerName || '未填写' },
    { label: '行业', value: form.industry || '未填写' },
    { label: '区域', value: form.region || '未填写' },
  ];
  const autoSaveIndicatorClass =
    autoSaveState === 'error'
      ? 'bg-rose-500'
      : autoSaveState === 'saving'
      ? 'animate-pulse bg-amber-500'
      : 'bg-emerald-500';
  const reportViewStatusText = hasGeneratedReport ? '已切换到报告视图' : '当前暂无报告内容';

  return (
    <div className="min-h-full animate-fadeIn bg-slate-100 pb-20">
      <div
        className="sticky top-0 z-30 overflow-hidden border-b border-slate-200/70 bg-slate-100 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.35)] [transform:translateZ(0)]"
        style={{ isolation: 'isolate', contain: 'paint' }}
      >
        <div className="px-4 pb-3 pt-3 lg:px-6 lg:pb-4 lg:pt-4">
          <div className={`mx-auto ${workspaceContainerClass}`}>
            <DetailPageHeader
              compact
              className="z-10"
              title={workspaceTitle}
              eyebrow={(
                <span className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-white">
                  {workspaceView === 'report' ? '项目报告' : '调研表单'}
                </span>
              )}
              subtitle={(
                <div className="space-y-2.5">
                  <div className="flex flex-wrap gap-2">
                    {headerMetaItems.map((item) => (
                      <div key={item.label} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                        <span className="text-[11px] font-medium text-slate-500">{item.label}</span>
                        <span className={`text-xs font-semibold ${item.value === '未填写' ? 'text-slate-400' : 'text-slate-800'}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-200">
                      <span className={`h-2 w-2 rounded-full ${isFormWorkspace ? autoSaveIndicatorClass : 'bg-blue-500'}`}></span>
                      {isFormWorkspace ? autoSaveMessage : reportViewStatusText}
                    </span>
                    <span className="rounded-full bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-200">
                      表单 {formStatusLabel}
                    </span>
                    <span className="rounded-full bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-200">
                      报告 {reportStatusLabel}
                    </span>
                    {lastSavedAt ? (
                      <span className="rounded-full bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-200">
                        最近保存 {formatTime(lastSavedAt)}
                      </span>
                    ) : null}
                  </div>
                </div>
              )}
              tabs={hasGeneratedReport ? [
                {
                  key: 'form',
                  label: '表单',
                  active: workspaceView === 'form',
                  onClick: () => setWorkspaceView('form'),
                },
                {
                  key: 'report',
                  label: '报告',
                  onClick: () => setWorkspaceView('report'),
                  disabled: !canViewReport || !hasGeneratedReport,
                  active: workspaceView === 'report',
                },
              ] : []}
              actions={(
                <>
                  <button
                    onClick={handleBackToList}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                  >
                    返回列表
                  </button>
                  {workspaceView === 'form' && !isCompleted && !isAuthorizedFill && canShareSurvey && (
                    <button
                      onClick={handleCopyExternalLink}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14a5 5 0 007.07 0l1.41-1.41a5 5 0 00-7.07-7.07l-1.41 1.41M14 10a5 5 0 00-7.07 0L5.52 11.41a5 5 0 007.07 7.07l1.41-1.41" />
                      </svg>
                      外链填写
                    </button>
                  )}
                  {workspaceView === 'form' && !isCompleted && canEditSurvey && (
                    <>
                      <button
                        onClick={saveDraft}
                        disabled={saving || submitting}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                      >
                        {saving ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || autoSaveState === 'saving' || !canSubmitSurvey}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-70"
                      >
                        {submitting ? (
                          <>
                            <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                    </>
                  )}
                </>
              )}
              footer={undefined}
            />
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 lg:px-6 lg:pt-6">
        <div className={`mx-auto space-y-8 ${workspaceContainerClass}`}>
          {workspaceView === 'report' ? (
            hasGeneratedReport && canViewReport ? (
              <ReportDetailContent embedded />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                当前暂无可查看报告，请先完成提交并生成报告。
              </div>
            )
          ) : (
            visibleSections.map((section) => {
              return (
                <div key={section.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800">{section.title}</h3>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.fields.map((field) => {
                      const readOnly = isFieldReadOnly(field.id);
                      const disabled = readOnly || isCompleted || !canEditSurvey;

                      return (
                        <div key={field.id} className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                          <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                            {readOnly && <span className="text-xs text-slate-400 ml-2">(已预填，不可修改)</span>}
                          </label>

                          {field.type === 'text' && (
                            <input
                              readOnly={disabled}
                              placeholder={field.placeholder}
                              className={`w-full px-4 py-2 border rounded-lg outline-none ${
                                disabled
                                  ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed'
                                  : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                              }`}
                              value={form.data[field.id] || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            />
                          )}

                          {field.type === 'number' && (
                            <input
                              type="number"
                              readOnly={disabled}
                              placeholder={field.placeholder}
                              className={`w-full px-4 py-2 border rounded-lg outline-none ${
                                disabled
                                  ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed'
                                  : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                              }`}
                              value={form.data[field.id] || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            />
                          )}

                          {field.type === 'select' && (
                            <select
                              disabled={disabled}
                              className={`w-full px-4 py-2 border rounded-lg outline-none ${
                                disabled
                                  ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed'
                                  : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                              }`}
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
                                    disabled={disabled}
                                    onClick={() => {
                                      if (disabled) return;
                                      const next = isSelected ? current.filter((item: string) => item !== opt) : [...current, opt];
                                      handleFieldChange(field.id, next);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                      isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-slate-200 text-slate-600'
                                    } ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-blue-300'}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {field.type === 'textarea' && (
                            <textarea
                              readOnly={disabled}
                              rows={4}
                              placeholder={field.placeholder}
                              className={`w-full px-4 py-2 border rounded-lg outline-none ${
                                disabled
                                  ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed'
                                  : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                              }`}
                              value={form.data[field.id] || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};


