import { ReportTemplate } from '../types';

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'report-template-standard',
    name: '千丁EMS能源诊断标准报告模板',
    version: 'v1.0',
    description: '用于常规制造业与园区项目，覆盖现状分析、节能潜力、改造建议与投资回报评估。',
    sections: ['项目概况', '能耗结构分析', '关键问题识别', '实施建议', '投资回报评估'],
    content: `# 千丁EMS能源诊断标准报告模板

## 1. 项目概况
- 项目名称：{{project_name}}
- 客户名称：{{client_name}}
- 项目区域：{{field_003_3}}
- 详细地址：{{field_004_4}}
- 项目类型：{{field_005_5}}
- 所属行业：{{field_006_6}}

## 2. 能耗结构分析
- 能源类型：{{field_014_14}}
- 年总用电量(kWh)：{{field_016_16}}
- 年总电费(万元)：{{field_017_17}}
- 数据采集方式：{{field_018_18}}

## 3. 关键问题识别
- 核心功能诉求：{{field_019_19}}
- 当前管理痛点：{{field_070_75}}
- 现有系统情况：{{field_076_81}}

## 4. 实施建议
- 建议内容：{{implementation_advice_placeholder}}
- 部署方式偏好：{{field_078_83}}

## 5. 投资回报评估
- 项目预算：{{field_011_11}}
- 期望上线时间：{{field_012_12}}
- 项目目标：{{field_013_13}}`,
    updatedAt: '2026-03-10',
    surveyTemplateId: 'tpl-ems-presales-001',
  },
  {
    id: 'report-template-advanced',
    name: 'SGS节能诊断报告模板',
    version: 'v1.0',
    description: '用于重点客户深度诊断，增加分阶段落地路径与风险控制。',
    sections: ['诊断范围', '深度分析', '阶段性改造路线', '风险与保障', '实施计划'],
    content: `# SGS节能诊断报告模板

## 1. 诊断范围
- 报告编号：{{report_no}}
- 项目名称：{{project_name}}
- 客户名称：{{client_name}}
- 现场审计地点：{{audit_site}}
- 审计周期：{{audit_period}}

## 2. 深度分析
- 工艺说明：{{process_description}}
- 用能种类：{{energy_types}}
- 载能工质：{{energy_carriers}}
- 主要用能设备：{{major_equipment_list_json}}
- 近三年能源消耗数据：{{annual_energy_stats_json}}

## 3. 阶段性改造路线
- 系统诊断模块：{{system_diagnosis_modules_json}}
- 节能措施列表：{{energy_saving_measures_json}}
- 自动计算汇总：{{computed_summary_readonly}}

## 4. 风险与保障
- 计量配置表：{{metering_stats_json}}
- 能源统计管理现状：{{energy_stat_management_desc}}
- 风险控制建议：{{risk_control_placeholder}}

## 5. 实施计划
- 诊断开始日期：{{diagnosis_start_date}}
- 诊断结束日期：{{diagnosis_end_date}}
- AI结论：{{ai_generated_final_conclusion}}`,
    updatedAt: '2026-03-10',
    surveyTemplateId: 'tpl-sgs-diagnosis-001',
  },
];

export default REPORT_TEMPLATES;
