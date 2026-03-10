import React, { useMemo, useState } from 'react';

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
    description: '用于常规制造/园区项目，覆盖现状分析、节能潜力、改造建议。',
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
  const [activeTemplateId, setActiveTemplateId] = useState(REPORT_TEMPLATES[0].id);

  const activeTemplate = useMemo(
    () => REPORT_TEMPLATES.find((item) => item.id === activeTemplateId) || REPORT_TEMPLATES[0],
    [activeTemplateId]
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-2xl bg-gradient-to-r from-slate-50 via-white to-blue-50 p-5 border border-slate-200/80">
        <h2 className="text-2xl font-bold text-slate-900">报告模板管理</h2>
        <p className="text-slate-500 mt-1">当前页面为只读模式，仅支持查看模板内容。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
          {REPORT_TEMPLATES.map((template) => {
            const active = template.id === activeTemplate.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setActiveTemplateId(template.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  active ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className={`text-sm font-bold ${active ? 'text-blue-700' : 'text-slate-800'}`}>{template.name}</p>
                <p className="text-xs text-slate-500 mt-1">{template.version}</p>
              </button>
            );
          })}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{activeTemplate.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{activeTemplate.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeTemplate.sections.map((section) => (
              <span key={section} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-600">
                {section}
              </span>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500 mb-2">模板正文（只读）</p>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-6">{activeTemplate.content}</pre>
          </div>

          <p className="text-xs text-slate-400">最近更新：{activeTemplate.updatedAt}</p>
        </div>
      </div>
    </div>
  );
};

