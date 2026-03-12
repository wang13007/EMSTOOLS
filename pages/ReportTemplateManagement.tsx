import React, { useMemo, useRef, useState } from 'react';
import { ICONS } from '../constants';
import { ReportTemplate } from '../types';
import Portal from '../src/components/Portal';
import {
  applyReportTemplateNameOverrides,
  applySurveyTemplateNameOverrides,
  setReportTemplateDescriptionById,
  setReportTemplateNameById,
} from '../src/services/templateNameStore';
import { generateTemplateDraftFromFile, ImportedTemplateDraft } from '../src/services/templateImportService';
import { getAllReportTemplates, getAllSurveyTemplates, saveImportedTemplatePair } from '../src/services/templateStore';
import { usePermission } from '../src/auth/usePermission';

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
    const nextDescription = window.prompt('请输入新的模板描述', template.description || '');
    if (nextDescription === null) return;
    const normalized = nextDescription.trim();
    if (!normalized) {
      alert('模板描述不能为空');
      return;
    }
    setReportTemplateDescriptionById(template.id, normalized);
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

  const handleSaveImportedTemplate = () => {
    if (!importDraft) return;
    if (!guardPermission('report_template:rename', '保存导入模板')) return;
    setSavingImportedTemplate(true);
    try {
      const saved = saveImportedTemplatePair(importDraft.surveyTemplate, importDraft.reportTemplate);
      setImportDraft(null);
      setRefreshKey((prev) => prev + 1);
      setSelectedTemplateId(saved.reportTemplate.id);
      alert(`导入成功：已新增报告模板「${saved.reportTemplate.name}」并关联调研模板「${saved.surveyTemplate.name}」。`);
    } finally {
      setSavingImportedTemplate(false);
    }
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
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider">
                    只读
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">{tpl.name}</h3>
                <p className="text-xs text-slate-400 mb-2">模板ID：{tpl.id}</p>
                <p className="text-xs text-slate-400 mb-2">版本 {tpl.version}</p>
                <p className="text-sm text-slate-500 mb-2">{tpl.description}</p>
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
                  <p className="text-sm text-slate-600 leading-6">{selectedTemplate.description}</p>
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
                  <p className="text-xs text-slate-500 mt-1">
                    请确认自动拆解结果，保存后可在调研模板与报告模板页面直接使用。
                  </p>
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
                    <p className="text-sm font-semibold text-amber-800 mb-2">解析提示</p>
                    <ul className="space-y-1 text-xs text-amber-700">
                      {importDraft.warnings.map((item, idx) => (
                        <li key={`import_warning_${idx}`}>{idx + 1}. {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <article className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h4 className="text-base font-bold text-slate-900 mb-2">报告模板</h4>
                    <p className="text-sm text-slate-600">{importDraft.reportTemplate.name}</p>
                    <p className="text-xs text-slate-500 mt-1">版本：{importDraft.reportTemplate.version}</p>
                    <p className="text-xs text-slate-500 mt-1">{importDraft.reportTemplate.description}</p>
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-slate-700 mb-2">章节结构</p>
                      <div className="flex flex-wrap gap-2">
                        {importDraft.reportTemplate.sections.map((section) => (
                          <span key={section} className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">{section}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-slate-700 mb-2">模板正文预览</p>
                      <pre className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-6 whitespace-pre-wrap text-slate-700">
                        {importDraft.reportTemplate.content}
                      </pre>
                    </div>
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h4 className="text-base font-bold text-slate-900 mb-2">调研模板</h4>
                    <p className="text-sm text-slate-600">{importDraft.surveyTemplate.name}</p>
                    <p className="text-xs text-slate-500 mt-1">行业：{importDraft.surveyTemplate.industry}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      章节数：{importDraft.surveyTemplate.sections.length}，字段数：
                      {importDraft.surveyTemplate.sections.reduce((sum, section) => sum + section.fields.length, 0)}
                    </p>
                    <div className="mt-4 space-y-3 max-h-[420px] overflow-auto">
                      {importDraft.surveyTemplate.sections.map((section) => (
                        <div key={section.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-slate-800">{section.title}</p>
                          <ul className="mt-2 space-y-1 text-xs text-slate-600">
                            {section.fields.map((field) => (
                              <li key={field.id} className="rounded-md bg-white px-2 py-1">
                                {field.label}
                                <span className="ml-2 text-slate-400">[{field.type}]</span>
                                <span className="ml-2 font-mono text-blue-700">{`{{${field.id}}}`}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold text-slate-700 mb-2">源文档提取文本预览</p>
                  <pre className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-6 whitespace-pre-wrap text-slate-700">
                    {importDraft.sourceTextPreview || '未提取到文本预览'}
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
