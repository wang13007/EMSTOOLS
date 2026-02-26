import React, { useMemo, useState } from 'react';
import { ICONS } from '../constants';
import { SurveyTemplate } from '../types';
import { SURVEY_TEMPLATES } from '../constants/surveyTemplatePreset';
import Portal from '../src/components/Portal';

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: '文本',
  number: '数值',
  select: '单选',
  multiselect: '多选',
  textarea: '长文本',
};

export const SurveyTemplates: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | null>(null);
  const templates = SURVEY_TEMPLATES;

  const summary = useMemo(() => {
    const totalSections = templates.reduce((acc, tpl) => acc + tpl.sections.length, 0);
    const totalFields = templates.reduce(
      (acc, tpl) => acc + tpl.sections.reduce((sectionAcc, section) => sectionAcc + section.fields.length, 0),
      0
    );
    return { totalSections, totalFields };
  }, [templates]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">调研模板管理</h2>
          <p className="text-slate-500">系统内置 1 个标准模板，仅支持查看内容，不支持新增、编辑、删除。</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">
          预置模板: {templates.length} 个
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => {
          const fieldCount = tpl.sections.reduce((acc, section) => acc + section.fields.length, 0);
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setSelectedTemplate(tpl)}
              className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <ICONS.Template className="w-6 h-6" />
                  </div>
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider">
                    只读
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{tpl.name}</h3>
                <p className="text-sm text-slate-500 mb-4">
                  包含 {tpl.sections.length} 个章节，共 {fieldCount} 个调研字段。
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

      <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm text-slate-600">
        当前模板总计 {summary.totalSections} 个章节，{summary.totalFields} 个字段。新建调研表单将自动使用该模板发起。
      </div>

      {selectedTemplate && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedTemplate.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    共 {selectedTemplate.sections.length} 个章节，{selectedTemplate.sections.reduce((acc, s) => acc + s.fields.length, 0)} 个字段
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                  aria-label="关闭模板详情"
                >
                  <ICONS.Plus className="w-6 h-6 rotate-45 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                {selectedTemplate.sections.map((section) => (
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
                          </div>
                          {field.options && field.options.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {field.options.map((option) => (
                                <span key={`${field.id}-${option}`} className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                                  {option}
                                </span>
                              ))}
                            </div>
                          )}
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
