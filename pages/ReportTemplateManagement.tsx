import React, { useMemo, useState } from 'react';
import { ICONS } from '../constants';
import { REPORT_TEMPLATES } from '../constants/reportTemplatePreset';
import { SURVEY_TEMPLATES } from '../constants/surveyTemplatePreset';
import { ReportTemplate } from '../types';
import Portal from '../src/components/Portal';

const getSurveyTemplateMap = () => {
  return new Map(SURVEY_TEMPLATES.map((item) => [item.id, item]));
};

export const ReportTemplateManagement: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const surveyTemplateMap = useMemo(getSurveyTemplateMap, []);

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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">报告模板管理</h2>
          <p className="text-slate-500">模板内容为只读展示，输入项统一使用占位符表示。</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">
          预置模板: {REPORT_TEMPLATES.length} 个
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORT_TEMPLATES.map((tpl) => {
          const linkedSurveyName = surveyTemplateMap.get(tpl.surveyTemplateId)?.name || '未关联';
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
                    <ICONS.Report className="w-6 h-6" />
                  </div>
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider">
                    只读
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">{tpl.name}</h3>
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
                  <p className="text-xs text-slate-500 mt-1">
                    版本 {selectedTemplate.version}，共 {selectedTemplate.sections.length} 个章节，关联调研模板：
                    {surveyTemplateMap.get(selectedTemplate.surveyTemplateId)?.name || '未关联'}
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
    </div>
  );
};
