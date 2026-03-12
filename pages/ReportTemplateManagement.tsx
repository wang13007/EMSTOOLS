import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ICONS } from '../constants';
import { ReportTemplate, SurveyField } from '../types';
import Portal from '../src/components/Portal';
import {
  applyReportTemplateNameOverrides,
  applySurveyTemplateNameOverrides,
  setReportTemplateDescriptionById,
  setReportTemplateNameById,
} from '../src/services/templateNameStore';
import { generateTemplateDraftFromFile, ImportedTemplateDraft } from '../src/services/templateImportService';
import {
  deleteImportedTemplatePairByReportId,
  getAllReportTemplates,
  getAllSurveyTemplates,
  readImportedReportTemplates,
  saveImportedTemplatePair,
  syncImportedTemplatesFromDatabase,
} from '../src/services/templateStore';
import { usePermission } from '../src/auth/usePermission';

const FIELD_TYPE_LABELS: Record<SurveyField['type'], string> = {
  text: '文本',
  number: '数字',
  select: '单选',
  multiselect: '多选',
  textarea: '长文本',
};

export const ReportTemplateManagement: React.FC = () => {
  const { guardPermission } = usePermission();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [savingImportedTemplate, setSavingImportedTemplate] = useState(false);
  const [importDraft, setImportDraft] = useState<ImportedTemplateDraft | null>(null);

  const reportTemplates = useMemo(() => applyReportTemplateNameOverrides(getAllReportTemplates()), [refreshKey]);
  const surveyTemplates = useMemo(() => applySurveyTemplateNameOverrides(getAllSurveyTemplates()), [refreshKey]);
  const importedReportTemplateIds = useMemo(
    () => new Set(readImportedReportTemplates().map((item) => item.id)),
    [refreshKey]
  );
  const surveyTemplateMap = useMemo(() => new Map(surveyTemplates.map((item) => [item.id, item])), [surveyTemplates]);

  const selectedTemplate = useMemo(
    () => reportTemplates.find((item) => item.id === selectedTemplateId) || null,
    [reportTemplates, selectedTemplateId]
  );

  const placeholderList = useMemo(() => {
    if (!selectedTemplate) return [] as Array<{ sectionTitle: string; fieldLabel: string; fieldId: string }>;
    const linkedSurveyTemplate = surveyTemplateMap.get(selectedTemplate.surveyTemplateId);
    if (!linkedSurveyTemplate) return [];

    return linkedSurveyTemplate.sections.flatMap((section) =>
      section.fields.map((field) => ({
        sectionTitle: section.title,
        fieldLabel: field.label,
        fieldId: field.id,
      }))
    );
  }, [selectedTemplate, surveyTemplateMap]);

  useEffect(() => {
    let active = true;

    const syncTemplates = async () => {
      await syncImportedTemplatesFromDatabase();
      if (active) setRefreshKey((prev) => prev + 1);
    };

    void syncTemplates();

    return () => {
      active = false;
    };
  }, []);

  const handleRenameTemplate = (template: ReportTemplate) => {
    const nextName = window.prompt('请输入新的报告模板名称', template.name);
    if (!nextName) return;

    const normalized = nextName.trim();
    if (!normalized) {
      alert('模板名称不能为空');
      return;
    }

    setReportTemplateNameById(template.id, normalized);
    setRefreshKey((prev) => prev + 1);
  };

  const handleEditDescription = (template: ReportTemplate) => {
    const nextDescription = window.prompt('请输入新的模板描述（可留空）', template.description || '');
    if (nextDescription === null) return;

    setReportTemplateDescriptionById(template.id, nextDescription.trim());
    setRefreshKey((prev) => prev + 1);
  };

  const triggerTemplateImport = () => {
    if (!guardPermission('report_template:rename', '导入模板')) return;
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImporting(true);
    try {
      const draft = await generateTemplateDraftFromFile(file);
      setImportDraft(draft);
    } catch (error) {
      console.error('模板导入失败:', error);
      alert(error instanceof Error ? error.message : '模板导入失败，请重试。');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveImportedTemplate = async () => {
    if (!importDraft) return;
    if (!guardPermission('report_template:rename', '保存导入模板')) return;

    const reportName = importDraft.reportTemplate.name.trim();
    const surveyName = importDraft.surveyTemplate.name.trim();
    const reportDescription = (importDraft.reportTemplate.description || '').trim();
    const surveyDescription = (importDraft.surveyTemplate.description || '').trim();

    if (!reportName || !surveyName) {
      alert('报告模板名称和调研模板名称为必填项。');
      return;
    }

    setSavingImportedTemplate(true);
    try {
      const saved = await saveImportedTemplatePair(
        {
          ...importDraft.surveyTemplate,
          name: surveyName,
          description: surveyDescription || undefined,
        },
        {
          ...importDraft.reportTemplate,
          name: reportName,
          description: reportDescription,
        }
      );

      setImportDraft(null);
      setRefreshKey((prev) => prev + 1);
      setSelectedTemplateId(saved.reportTemplate.id);
      alert(`导入成功：已新增报告模板「${saved.reportTemplate.name}」并关联调研模板「${saved.surveyTemplate.name}」。`);
    } catch (error) {
      console.error('保存导入模板失败:', error);
      alert(error instanceof Error ? error.message : '保存导入模板失败，请重试。');
    } finally {
      setSavingImportedTemplate(false);
    }
  };

  const handleDeleteSelectedTemplate = async () => {
    if (!selectedTemplate) return;

    const imported = importedReportTemplateIds.has(selectedTemplate.id);
    if (!imported) {
      alert('系统预置模板不可删除，仅支持删除用户导入模板。');
      return;
    }

    if (!guardPermission('report_template:rename', '删除导入模板')) return;

    const confirmed = window.confirm(
      `确定删除导入模板「${selectedTemplate.name}」吗？将同时删除其关联的调研模板。`
    );
    if (!confirmed) return;

    const deleted = await deleteImportedTemplatePairByReportId(selectedTemplate.id);
    if (!deleted.deleted) {
      alert('删除失败，未找到可删除模板或数据库操作失败。');
      return;
    }

    setSelectedTemplateId(null);
    setRefreshKey((prev) => prev + 1);
    alert('导入模板已删除。');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <input
        ref={importInputRef}
        type="file"
        className="hidden"
        accept=".doc,.docx,.pdf,.md,.markdown,.ppt,.pptx,.html,.htm,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/markdown,text/html,text/plain"
        onChange={handleImportFile}
      />

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">报告模板管理</h2>
          <p className="text-slate-500">支持导入文档自动拆解为报告模板和调研模板，预览确认后生效。</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={importing}
            onClick={triggerTemplateImport}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {importing ? '解析中...' : '导入模板文档'}
          </button>
          <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">
            当前模板: {reportTemplates.length} 个
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTemplates.map((tpl) => {
          const linkedSurveyName = surveyTemplateMap.get(tpl.surveyTemplateId)?.name || '未关联';
          const imported = importedReportTemplateIds.has(tpl.id);

          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setSelectedTemplateId(tpl.id)}
              className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <ICONS.Report className="w-6 h-6" />
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      imported ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {imported ? '导入' : '预置'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">{tpl.name}</h3>
                <p className="text-xs text-slate-400 mb-2">模板ID：{tpl.id}</p>
                <p className="text-xs text-slate-400 mb-2">版本 {tpl.version}</p>
                <p className="text-sm text-slate-500 mb-2">{tpl.description || '暂无描述'}</p>
                <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-2 py-1 inline-block">
                  关联调研模板：{linkedSurveyName}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-4">
                  <span className="text-[10px] text-slate-400 font-medium">更新于 {tpl.updatedAt}</span>
                  <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">查看模板</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedTemplate && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-slideUp">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedTemplate.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">模板ID：{selectedTemplate.id}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    版本 {selectedTemplate.version}，共 {selectedTemplate.sections.length} 个章节，关联调研模板：
                    {surveyTemplateMap.get(selectedTemplate.surveyTemplateId)?.name || '未关联'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    模板类型：{importedReportTemplateIds.has(selectedTemplate.id) ? '用户导入模板（可删除）' : '系统预置模板（不可删除）'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRenameTemplate(selectedTemplate)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    修改名称
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditDescription(selectedTemplate)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    修改描述
                  </button>
                  <button
                    type="button"
                    disabled={!importedReportTemplateIds.has(selectedTemplate.id)}
                    onClick={handleDeleteSelectedTemplate}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      importedReportTemplateIds.has(selectedTemplate.id)
                        ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                        : 'text-slate-400 bg-slate-100 cursor-not-allowed'
                    }`}
                  >
                    删除模板
                  </button>
                  <button
                    onClick={() => setSelectedTemplateId(null)}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    aria-label="关闭模板详情"
                  >
                    <ICONS.Plus className="w-6 h-6 rotate-45 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h4 className="font-bold text-slate-900 mb-3">模板说明</h4>
                  <p className="text-sm text-slate-600 leading-6">{selectedTemplate.description || '暂无描述'}</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">章节结构</h4>
                    <span className="text-xs text-slate-500">章节数: {selectedTemplate.sections.length}</span>
                  </div>
                  <div className="px-6 py-4 flex flex-wrap gap-2">
                    {selectedTemplate.sections.map((section) => (
                      <span key={section} className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                        {section}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h4 className="font-bold text-slate-900 mb-3">模板正文（占位符）</h4>
                  <pre className="text-xs leading-6 text-slate-700 whitespace-pre-wrap">{selectedTemplate.content}</pre>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">输入占位符清单</h4>
                    <span className="text-xs text-slate-500">共 {placeholderList.length} 项</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white">
                        <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="px-6 py-3">章节</th>
                          <th className="px-6 py-3">输入项</th>
                          <th className="px-6 py-3">占位符</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {placeholderList.map((item) => (
                          <tr key={`${item.sectionTitle}_${item.fieldId}`}>
                            <td className="px-6 py-3 text-sm text-slate-600">{item.sectionTitle}</td>
                            <td className="px-6 py-3 text-sm text-slate-900 font-medium">{item.fieldLabel}</td>
                            <td className="px-6 py-3 text-xs font-mono text-blue-700">{`{{${item.fieldId}}}`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {importDraft && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-slideUp">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">导入模板预览</h3>
                  <p className="text-xs text-slate-500 mt-1">请确认名称、描述和字段结构后再保存。名称必填，描述可选。</p>
                </div>
                <button
                  type="button"
                  onClick={() => setImportDraft(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                  aria-label="关闭导入预览"
                >
                  <ICONS.Plus className="w-6 h-6 rotate-45 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                {importDraft.warnings.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-2">导入提示</p>
                    <ul className="space-y-1 text-xs text-amber-700">
                      {importDraft.warnings.map((item, idx) => (
                        <li key={`import_warning_${idx}`}>
                          {idx + 1}. {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <article className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h4 className="text-base font-bold text-slate-900 mb-2">报告模板</h4>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">报告模板名称（必填）</label>
                      <input
                        value={importDraft.reportTemplate.name}
                        onChange={(event) =>
                          setImportDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  reportTemplate: { ...prev.reportTemplate, name: event.target.value },
                                }
                              : prev
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入报告模板名称"
                        required
                      />
                    </div>

                    <p className="text-xs text-slate-500 mt-1">版本：{importDraft.reportTemplate.version}</p>

                    <div className="space-y-2 mt-2">
                      <label className="text-xs font-semibold text-slate-600">报告模板描述（可选）</label>
                      <textarea
                        rows={3}
                        value={importDraft.reportTemplate.description}
                        onChange={(event) =>
                          setImportDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  reportTemplate: { ...prev.reportTemplate, description: event.target.value },
                                }
                              : prev
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="可不填写"
                      />
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-semibold text-slate-700 mb-2">章节结构</p>
                      <div className="flex flex-wrap gap-2">
                        {importDraft.reportTemplate.sections.map((section) => (
                          <span key={section} className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-semibold text-slate-700 mb-2">报告正文预览</p>
                      <pre className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-6 whitespace-pre-wrap text-slate-700">
                        {importDraft.reportTemplate.content}
                      </pre>
                    </div>
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h4 className="text-base font-bold text-slate-900 mb-2">调研模板</h4>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">调研模板名称（必填）</label>
                      <input
                        value={importDraft.surveyTemplate.name}
                        onChange={(event) =>
                          setImportDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  surveyTemplate: { ...prev.surveyTemplate, name: event.target.value },
                                }
                              : prev
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入调研模板名称"
                        required
                      />
                    </div>

                    <div className="space-y-2 mt-2">
                      <label className="text-xs font-semibold text-slate-600">调研模板描述（可选）</label>
                      <textarea
                        rows={3}
                        value={importDraft.surveyTemplate.description || ''}
                        onChange={(event) =>
                          setImportDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  surveyTemplate: { ...prev.surveyTemplate, description: event.target.value },
                                }
                              : prev
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="可不填写"
                      />
                    </div>

                    <p className="text-xs text-slate-500 mt-1">行业：{importDraft.surveyTemplate.industry || '通用'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      共 {importDraft.surveyTemplate.sections.length} 个章节，
                      {importDraft.surveyTemplate.sections.reduce((sum, section) => sum + section.fields.length, 0)} 个字段
                    </p>

                    <div className="mt-4 space-y-3 max-h-[420px] overflow-auto">
                      {importDraft.surveyTemplate.sections.map((section) => (
                        <div key={section.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-slate-800">{section.title}</p>
                          <ul className="mt-2 space-y-1 text-xs text-slate-600">
                            {section.fields.map((field) => (
                              <li key={field.id} className="rounded-md bg-white px-2 py-2 space-y-1">
                                <div>
                                  <span className="font-medium text-slate-900">{field.label}</span>
                                  <span className="ml-2 text-slate-500">[{FIELD_TYPE_LABELS[field.type]}]</span>
                                  <span className="ml-2 font-mono text-blue-700">{`{{${field.id}}}`}</span>
                                  {field.required && <span className="ml-2 text-red-500">*</span>}
                                </div>
                                {field.options && field.options.length > 0 && (
                                  <div className="text-[11px] text-slate-500">选项: {field.options.join(' / ')}</div>
                                )}
                                {field.placeholder && <div className="text-[11px] text-slate-400">示例: {field.placeholder}</div>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold text-slate-700 mb-2">源文档文本预览</p>
                  <pre className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-6 whitespace-pre-wrap text-slate-700">
                    {importDraft.sourceTextPreview || '无可预览文本'}
                  </pre>
                </div>
              </div>

              <div className="px-8 py-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setImportDraft(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={savingImportedTemplate}
                  onClick={handleSaveImportedTemplate}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-70"
                >
                  {savingImportedTemplate ? '保存中...' : '确认保存并生效'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
