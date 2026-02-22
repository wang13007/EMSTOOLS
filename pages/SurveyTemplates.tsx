
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { SurveyTemplate } from '../types';
import { templateService } from '../src/services/supabaseService';

export const SurveyTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);

  useEffect(() => {
    // 从数据库获取模板列表
    const fetchTemplates = async () => {
      const templateList = await templateService.getTemplates();
      // 转换数据格式以匹配前端类型
      const formattedTemplates = templateList.map(template => ({
        id: template.id,
        name: template.name,
        industry: template.industry,
        sections: template.sections,
        createTime: template.create_time ? new Date(template.create_time).toISOString().split('T')[0] : ''
      }));
      setTemplates(formattedTemplates);
    };

    fetchTemplates();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">调研模板管理</h2>
          <p className="text-slate-500">维护各行业的调研问卷模板，支持动态字段配置。</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95">
          <ICONS.Plus />
          新增模板
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <ICONS.Template className="w-6 h-6" />
                </div>
                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">
                  {tpl.industry}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{tpl.name}</h3>
              <p className="text-sm text-slate-500 mb-6">包含 {tpl.sections.length} 个章节，共 {tpl.sections.reduce((acc, s) => acc + s.fields.length, 0)} 个调研字段。</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className="text-[10px] text-slate-400 font-medium">创建于: {tpl.createTime}</span>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
