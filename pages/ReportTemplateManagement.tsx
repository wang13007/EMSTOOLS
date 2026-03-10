import React, { useMemo, useState } from 'react';
import { ICONS } from '../constants';
import Portal from '../src/components/Portal';

type ReportTemplate = {
  id: string;
  name: string;
  version: string;
  description: string;
  sections: string[];
  content: string;
  updatedAt: string;
};

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'report-template-standard',
    name: '标准能效评估模板',
    version: 'v1.0',
    description: '用于常规制造业与园区项目，覆盖现状分析、节能潜力、改造建议与投资回报评估。',
    sections: ['项目概况', '能耗结构分析', '关键问题识别', '实施建议', '投资回报评估'],
    content: `# 标准能效评估模板

## 1. 项目概况
- 客户信息
- 调研范围
- 业务背景

## 2. 能耗结构分析
- 用能分项占比
- 峰谷特征
- 历史波动趋势

## 3. 关键问题识别
- 计量盲区
- 管理短板
- 设备异常

## 4. 实施建议
- 软件能力建设
- 硬件改造建议
- 管理制度优化

## 5. 投资回报评估
- 投资估算
- 节能收益
- 回收期`,
    updatedAt: '2026-03-10',
  },
  {
    id: 'report-template-advanced',
    name: '高级诊断模板',
    version: 'v1.0',
    description: '用于重点客户深度诊断，增加分阶段落地路径与风险控制。',
    sections: ['诊断范围', '深度分析', '阶段性改造路线', '风险与保障', '实施计划'],
    content: `# 高级诊断模板

## 1. 诊断范围
- 工艺段划分
- 关键设备清单

## 2. 深度分析
- 负荷画像
- 设备效率评估
- 运行策略评估

## 3. 阶段性改造路线
- 短期优化
- 中期改造
- 长期升级

## 4. 风险与保障
- 数据完整性风险
- 停机窗口协调
- 实施资源保障

## 5. 实施计划
- 里程碑
- 责任分工
- 验收指标`,
    updatedAt: '2026-03-10',
  },
];

export const ReportTemplateManagement: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  const summary = useMemo(() => {
    const totalSections = REPORT_TEMPLATES.reduce((acc, item) => acc + item.sections.length, 0);
    return { totalSections };
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">报告模板管理</h2>
          <p className="text-slate-500">模板内容为只读展示，可用于报告生成时选择。</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">
          预置模板: {REPORT_TEMPLATES.length} 个
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORT_TEMPLATES.map((tpl) => (
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
              <p className="text-sm text-slate-500 mb-4">{tpl.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className="text-[10px] text-slate-400 font-medium">更新于 {tpl.updatedAt}</span>
                <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">查看模板</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm text-slate-600">
        当前模板总计 {summary.totalSections} 个章节。
      </div>

      {selectedTemplate && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedTemplate.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    版本 {selectedTemplate.version}，共 {selectedTemplate.sections.length} 个章节
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
                  <h4 className="font-bold text-slate-900 mb-3">模板正文（只读）</h4>
                  <pre className="text-xs leading-6 text-slate-700 whitespace-pre-wrap">{selectedTemplate.content}</pre>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
