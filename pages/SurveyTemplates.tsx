import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '../constants';
import { SurveyField, SurveyTemplate } from '../types';
import Portal from '../src/components/Portal';
import {
  applyReportTemplateNameOverrides,
  applySurveyTemplateNameOverrides,
  setSurveyTemplateNameById,
} from '../src/services/templateNameStore';
import {
  deleteImportedTemplatePairBySurveyId,
  getAllReportTemplates,
  getAllSurveyTemplates,
  readImportedSurveyTemplates,
  syncImportedTemplatesFromDatabase,
} from '../src/services/templateStore';

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: '文本',
  number: '数字',
  select: '单选',
  multiselect: '多选',
  textarea: '长文本',
};

const buildAllCheckedPreviewData = (template: SurveyTemplate) => {
  const previewData: Record<string, any> = {};

  template.sections.forEach((section) => {
    section.fields.forEach((field) => {
      if (field.type === 'multiselect') {
        previewData[field.id] = [...(field.options || [])];
        return;
      }
      if (field.type === 'select') {
        previewData[field.id] = field.options && field.options.length ? [...field.options] : ['__selected__'];
        return;
      }
      previewData[field.id] = '__filled__';
    });
  });

  return previewData;
};

const shouldShowByVisibleWhen = (
  visibleWhen: { fieldId: string; values: string[] } | undefined,
  previewData: Record<string, any>
) => {
  if (!visibleWhen) return true;
  const value = previewData[visibleWhen.fieldId];
  if (!value) return false;

  const values = Array.isArray(value) ? value : [value];
  return values.some((item) => visibleWhen.values.includes(item));
};

const getVisibleSectionsWithAllOptionsChecked = (template: SurveyTemplate) => {
  const previewData = buildAllCheckedPreviewData(template);

  return template.sections
    .filter((section) => shouldShowByVisibleWhen(section.visibleWhen, previewData))
    .map((section) => ({
      ...section,
      fields: section.fields.filter((field: SurveyField) => shouldShowByVisibleWhen(field.visibleWhen, previewData)),
    }));
};

export const SurveyTemplates: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const templates = useMemo(() => applySurveyTemplateNameOverrides(getAllSurveyTemplates()), [refreshKey]);
  const importedSurveyTemplateIds = useMemo(
    () => new Set(readImportedSurveyTemplates().map((item) => item.id)),
    [refreshKey]
  );
  const reportTemplates = useMemo(() => applyReportTemplateNameOverrides(getAllReportTemplates()), [refreshKey]);
  const reportTemplateMap = useMemo(() => new Map(reportTemplates.map((item) => [item.id, item])), [reportTemplates]);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const expandedSections = useMemo(() => {
    if (!selectedTemplate) return [];
    return getVisibleSectionsWithAllOptionsChecked(selectedTemplate);
  }, [selectedTemplate]);

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

  const handleRenameTemplate = (template: SurveyTemplate) => {
    const nextName = window.prompt('请输入新的调研模板名称', template.name);
    if (!nextName) return;

    const normalized = nextName.trim();
    if (!normalized) {
      alert('模板名称不能为空');
      return;
    }

    setSurveyTemplateNameById(template.id, normalized);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteTemplate = async (template: SurveyTemplate) => {
    if (!importedSurveyTemplateIds.has(template.id)) {
      alert('系统预置模板不可删除，仅支持删除用户导入模板。');
      return;
    }

    const confirmed = window.confirm(`确定删除导入模板「${template.name}」吗？将同时删除其关联的报告模板。`);
    if (!confirmed) return;

    const deleted = await deleteImportedTemplatePairBySurveyId(template.id);
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
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">调研模板管理</h2>
          <p className="text-slate-500">模板内容为只读展示，可在新建调研表单时进行选择。</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">
          当前模板: {templates.length} 个
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => {
          const fieldCount = tpl.sections.reduce((acc, section) => acc + section.fields.length, 0);
          const relatedReportTemplate = tpl.reportTemplateId ? reportTemplateMap.get(tpl.reportTemplateId) : undefined;
          const imported = importedSurveyTemplateIds.has(tpl.id);

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
                    <ICONS.Template className="w-6 h-6" />
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
                <p className="text-sm text-slate-500 mb-3">
                  包含 {tpl.sections.length} 个章节，共 {fieldCount} 个字段。
                </p>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{tpl.description || '暂无描述'}</p>

                <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-2 py-1 inline-block mb-4">
                  关联报告模板：{relatedReportTemplate?.name || '未关联'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 font-medium">创建于 {tpl.createTime}</span>
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
                    已按“所有选项勾选”展开显示，共 {expandedSections.length} 个章节，
                    {expandedSections.reduce((acc, section) => acc + section.fields.length, 0)} 个字段；关联报告模板：
                    {selectedTemplate.reportTemplateId
                      ? reportTemplateMap.get(selectedTemplate.reportTemplateId)?.name || '未关联'
                      : '未关联'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    模板类型：{importedSurveyTemplateIds.has(selectedTemplate.id) ? '用户导入模板（可删除）' : '系统预置模板（不可删除）'}
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
                    disabled={!importedSurveyTemplateIds.has(selectedTemplate.id)}
                    onClick={() => handleDeleteTemplate(selectedTemplate)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      importedSurveyTemplateIds.has(selectedTemplate.id)
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

                {selectedTemplate.readonlyContent && (
                  <div className="bg-white rounded-2xl border border-blue-100 p-6">
                    <h4 className="font-bold text-slate-900 mb-3">模板只读内容</h4>
                    <pre className="text-xs leading-6 text-slate-700 whitespace-pre-wrap">{selectedTemplate.readonlyContent}</pre>
                  </div>
                )}

                {expandedSections.map((section) => (
                  <div key={section.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{section.title}</h4>
                      <span className="text-xs text-slate-500">字段数: {section.fields.length}</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {section.fields.map((field) => (
                        <div key={field.id} className="px-6 py-4 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">{field.label}</span>
                            {field.required && <span className="text-red-500 text-xs">*</span>}
                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-600">
                              {FIELD_TYPE_LABELS[field.type] || field.type}
                            </span>
                            <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-blue-50 text-blue-700">{`{{${field.id}}}`}</span>
                          </div>

                          {field.options && field.options.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-slate-400">可选项（预览视为全选展开）</p>
                              <div className="flex flex-wrap gap-2">
                                {field.options.map((option) => (
                                  <span key={`${field.id}-${option}`} className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                                    {option}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {field.visibleWhen && (
                            <p className="text-xs text-amber-600">
                              显示条件：{field.visibleWhen.fieldId} ∈ [{field.visibleWhen.values.join('、')}]
                            </p>
                          )}

                          {field.placeholder && <p className="text-xs text-slate-400">示例: {field.placeholder}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
