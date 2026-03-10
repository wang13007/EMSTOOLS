import { SurveyTemplate } from '../types';

const EMS_ENERGY_FIELD_ID = 'field_014_14';

export const EMS_PRESET_TEMPLATE: SurveyTemplate = {
  id: 'tpl-ems-presales-001',
  name: '千丁EMS能源诊断标准模板',
  industry: '通用',
  reportTemplateId: 'report-template-standard',
  createTime: '2026-02-26',
  readonlyContent: `用于常规售前调研的标准模板，覆盖企业基础、用能现状、系统能力、管理痛点与碳管理诉求。`,
  sections: [
    {
      id: 'ems_section_01',
      title: '企业与项目基础信息',
      fields: [
        { id: 'field_001_1', label: '企业名称', type: 'text', required: true },
        { id: 'field_002_2', label: '项目名称', type: 'text', required: true },
        { id: 'field_003_3', label: '项目区域', type: 'text', required: true },
        { id: 'field_004_4', label: '详细地址', type: 'text', required: true },
        {
          id: 'field_005_5',
          label: '项目类型',
          type: 'select',
          required: true,
          options: ['工业园区', '单体工厂', '商业综合体', '写字楼', '医院', '学校', '数据中心', '其他'],
        },
        {
          id: 'field_006_6',
          label: '所属行业',
          type: 'select',
          required: true,
          options: ['电子', '机械', '汽车', '化工', '医药', '食品', '能源', '建筑', '其他'],
        },
        { id: 'field_007_7', label: '建筑面积(㎡)', type: 'number' },
        { id: 'field_008_8', label: '联系人', type: 'text', required: true },
        { id: 'field_009_9', label: '联系电话', type: 'text', required: true },
        { id: 'field_010_10', label: '联系邮箱', type: 'text' },
      ],
    },
    {
      id: 'ems_section_02',
      title: '目标与预算信息',
      fields: [
        {
          id: 'field_011_11',
          label: '项目预算',
          type: 'select',
          required: true,
          options: ['<50万', '50-100万', '100-200万', '200-500万', '>500万', '尚未确定'],
        },
        {
          id: 'field_012_12',
          label: '期望上线时间',
          type: 'select',
          required: true,
          options: ['1-3个月', '3-6个月', '6个月以上', '不确定'],
        },
        {
          id: 'field_013_13',
          label: '项目目标',
          type: 'multiselect',
          required: true,
          options: ['降本', '分项计量', '节能改造', '运维优化', '碳排管理', '对外披露'],
        },
      ],
    },
    {
      id: 'ems_section_03',
      title: '用能总体情况',
      fields: [
        {
          id: EMS_ENERGY_FIELD_ID,
          label: '使用的能源类型',
          type: 'multiselect',
          required: true,
          options: ['电力', '天然气', '蒸汽', '供水', '光伏', '储能', '压缩空气', '其他'],
        },
        {
          id: 'field_015_15',
          label: '重点用能系统/设备',
          type: 'multiselect',
          required: true,
          options: ['变配电系统', '压缩空气系统', '照明系统', '暖通空调系统', '生产系统', '锅炉/蒸汽系统'],
        },
      ],
    },
    {
      id: 'ems_section_04',
      title: '电力系统诊断信息',
      visibleWhen: { fieldId: EMS_ENERGY_FIELD_ID, values: ['电力'] },
      fields: [
        { id: 'field_016_16', label: '年总用电量(kWh)', type: 'number', required: true },
        { id: 'field_017_17', label: '年总电费(万元)', type: 'number', required: true },
        {
          id: 'field_018_18',
          label: '数据采集方式',
          type: 'select',
          required: true,
          options: ['EMS直连', '第三方系统对接', '人工抄表'],
        },
        {
          id: 'field_019_19',
          label: '核心功能诉求',
          type: 'multiselect',
          required: true,
          options: ['能耗分项', '负荷分析', '电费优化', '异常告警', '节能评估'],
        },
      ],
    },
    {
      id: 'ems_section_05',
      title: '运行与管理现状',
      fields: [
        {
          id: 'field_066_71',
          label: '是否有能源管理人员',
          type: 'select',
          required: true,
          options: ['专职', '兼职', '没有'],
        },
        {
          id: 'field_067_72',
          label: '是否设定能源KPI',
          type: 'select',
          required: true,
          options: ['是', '否'],
        },
        {
          id: 'field_070_75',
          label: '当前管理痛点',
          type: 'multiselect',
          required: true,
          options: ['数据不准', '数据不及时', '浪费难定位', '缺乏对标', '报表成本高'],
        },
      ],
    },
    {
      id: 'ems_section_06',
      title: '碳管理与IT建设',
      fields: [
        {
          id: 'field_071_76',
          label: '是否做过碳盘查',
          type: 'select',
          required: true,
          options: ['定期开展', '做过一次', '计划中', '没有'],
        },
        {
          id: 'field_076_81',
          label: '现有系统情况',
          type: 'select',
          required: true,
          options: ['EMS', 'BMS', 'EMS+BMS', 'SCADA', '无'],
        },
        {
          id: 'field_078_83',
          label: '部署方式偏好',
          type: 'select',
          required: true,
          options: ['公有云', '私有云', '本地部署', '待确认'],
        },
      ],
    },
  ],
};

export const SGS_PRESET_TEMPLATE: SurveyTemplate = {
  id: 'tpl-sgs-diagnosis-001',
  name: 'SGS节能诊断模板',
  industry: '通用',
  reportTemplateId: 'report-template-advanced',
  createTime: '2026-03-10',
  readonlyContent: `# SGS节能诊断模板（只读）

1. 用户输入字段：覆盖项目基础、团队、诊断范围、企业概况、工艺、用能系统、设备、近三年能耗、计量管理、系统诊断、节能措施。
2. 输入规则：字段统一采用 text/number/select/multiselect/textarea；时间字段按 YYYY-MM-DD；关键列表字段使用 JSON 文本录入。
3. 自动计算：综合能耗、万元产值能耗、单位产品能耗、偏差率、节能量、节省费用、投资回收期。
4. 报告模板：采用占位符渲染（例如 {{project_name}}、{{report_no}}、{{computed.saving_summary.total_annual_saving_kwh}}）。
5. 数据结构：建议 input/computed/ai_generated 三层结构，用户只填 input。`,
  sections: [
    {
      id: 'sgs_section_a',
      title: 'A. 项目基础信息',
      fields: [
        { id: 'report_no', label: '报告编号', type: 'text', required: true, placeholder: '例如 SGS/RMSC/CC/2026/EA001-01' },
        { id: 'project_name', label: '项目名称', type: 'text', required: true },
        { id: 'project_code', label: '项目编号', type: 'text' },
        { id: 'client_name', label: '客户名称', type: 'text', required: true },
        { id: 'audit_site', label: '现场审计地点', type: 'text', required: true },
        { id: 'audit_date_text', label: '现场审计时间文本', type: 'text', required: true, placeholder: '例如 2026年3月' },
        { id: 'audit_period', label: '审计周期', type: 'text', required: true },
        { id: 'report_org', label: '报告编制单位', type: 'text', required: true },
        { id: 'report_issue_month', label: '报告编制时间', type: 'text', required: true },
        { id: 'report_writer', label: '报告编写人', type: 'text', required: true },
        { id: 'report_reviewer', label: '报告审核人', type: 'text', required: true },
        { id: 'report_approver', label: '报告签发人', type: 'text', required: true },
        { id: 'report_sign_date', label: '签发日期', type: 'text', required: true, placeholder: 'YYYY-MM-DD' },
      ],
    },
    {
      id: 'sgs_section_b',
      title: 'B. 诊断团队信息',
      fields: [
        { id: 'agency_team_members_json', label: '诊断机构成员（JSON数组）', type: 'textarea', placeholder: '[{"name":"张三","role":"负责人"}]' },
        { id: 'client_team_members_json', label: '企业诊断小组成员（JSON数组）', type: 'textarea', placeholder: '[{"name":"李四","group_role":"联络人"}]' },
      ],
    },
    {
      id: 'sgs_section_c',
      title: 'C. 诊断目的、依据、范围',
      fields: [
        { id: 'diagnosis_purpose', label: '诊断目的', type: 'textarea', required: true },
        { id: 'diagnosis_basis_list', label: '诊断依据列表（每行一条）', type: 'textarea', required: true },
        { id: 'diagnosis_boundary', label: '诊断边界', type: 'textarea', required: true },
        {
          id: 'audit_scope_systems',
          label: '审计范围系统',
          type: 'multiselect',
          required: true,
          options: ['变配电系统', '压缩空气系统', '照明系统', '暖通空调系统', '生产系统', '能源管理', '供水系统', '蒸汽系统', '天然气系统', '其他'],
        },
        { id: 'diagnosis_focus_points', label: '诊断重点列表（每行一条）', type: 'textarea' },
      ],
    },
    {
      id: 'sgs_section_d',
      title: 'D. 企业基本情况',
      fields: [
        { id: 'company_profile', label: '企业简介', type: 'textarea', required: true },
        { id: 'company_address', label: '企业地址', type: 'text', required: true },
        { id: 'company_founded_at', label: '成立时间', type: 'text' },
        { id: 'company_type', label: '企业性质', type: 'select', options: ['国有企业', '民营企业', '外资企业', '合资企业', '上市公司', '其他'] },
        { id: 'registered_capital', label: '注册资金', type: 'text' },
        { id: 'site_area_m2', label: '占地面积(㎡)', type: 'number', required: true },
        { id: 'building_area_m2', label: '建筑面积(㎡)', type: 'number' },
        { id: 'employee_count', label: '企业人数', type: 'number', required: true },
        { id: 'production_shift', label: '生产班次', type: 'select', required: true, options: ['一班', '两班', '三班', '四班', '连续生产', '其他'] },
        { id: 'working_days_per_year', label: '年工作日', type: 'number', required: true },
        { id: 'main_products', label: '主要产品列表（每行一条）', type: 'textarea', required: true },
        { id: 'target_markets', label: '主要市场（每行一条）', type: 'textarea' },
        { id: 'certifications', label: '认证体系（每行一条）', type: 'textarea' },
      ],
    },
    {
      id: 'sgs_section_e',
      title: 'E/F/G/H/I. 工艺、系统、设备、仪器、时间',
      fields: [
        { id: 'process_description', label: '工艺说明', type: 'textarea', required: true },
        { id: 'process_steps_json', label: '工艺流程步骤（JSON数组）', type: 'textarea' },
        { id: 'process_flowchart_url', label: '工艺流程图URL', type: 'text' },
        { id: 'energy_types', label: '用能种类', type: 'multiselect', required: true, options: ['电力', '蒸汽', '天然气', '水', '柴油', '压缩空气', '热水', '其他'] },
        { id: 'energy_carriers', label: '载能工质', type: 'multiselect', options: ['蒸汽', '热水', '冷冻水', '压缩空气', '导热油', '其他'] },
        { id: 'power_system_desc', label: '电力系统说明', type: 'textarea' },
        { id: 'water_system_desc', label: '供水系统说明', type: 'textarea' },
        { id: 'steam_system_desc', label: '蒸汽系统说明', type: 'textarea' },
        { id: 'gas_system_desc', label: '天然气系统说明', type: 'textarea' },
        { id: 'major_equipment_list_json', label: '主要用能设备（JSON数组）', type: 'textarea', required: true },
        { id: 'test_instruments_json', label: '测试仪器（JSON数组）', type: 'textarea' },
        { id: 'diagnosis_start_date', label: '诊断开始日期', type: 'text', required: true, placeholder: 'YYYY-MM-DD' },
        { id: 'diagnosis_end_date', label: '诊断结束日期', type: 'text', required: true, placeholder: 'YYYY-MM-DD' },
      ],
    },
    {
      id: 'sgs_section_j',
      title: 'J/K/L/M/N/O. 能耗、核对、计量、系统诊断、措施',
      fields: [
        { id: 'annual_energy_stats_json', label: '近三年能源消耗数据（JSON数组）', type: 'textarea', required: true },
        { id: 'energy_balance_check_json', label: '能源购入与消费核对（JSON对象）', type: 'textarea', required: true },
        { id: 'standard_coal_factors_json', label: '折标系数表（JSON数组）', type: 'textarea', required: true },
        { id: 'metering_stats_json', label: '能源计量配置表（JSON数组）', type: 'textarea', required: true },
        { id: 'metering_status_desc', label: '能源计量现状说明', type: 'textarea' },
        { id: 'energy_stat_management_desc', label: '能源统计管理现状', type: 'textarea' },
        { id: 'system_diagnosis_modules_json', label: '系统诊断模块（JSON数组）', type: 'textarea', required: true },
        { id: 'energy_saving_measures_json', label: '节能措施列表（JSON数组）', type: 'textarea' },
        { id: 'computed_summary_readonly', label: '自动计算汇总（系统生成，示例可填）', type: 'textarea' },
        { id: 'ai_generated_final_conclusion', label: 'AI生成结论（系统生成，示例可填）', type: 'textarea' },
        { id: 'report_template_placeholder', label: '占位符报告模板（只读规范）', type: 'textarea' },
      ],
    },
  ],
};

export const SURVEY_TEMPLATES: SurveyTemplate[] = [EMS_PRESET_TEMPLATE, SGS_PRESET_TEMPLATE];
