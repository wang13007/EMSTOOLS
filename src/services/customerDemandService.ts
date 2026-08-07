import { SurveyField, SurveyForm, SurveyTemplate } from '../../types';
import { getAllSurveyTemplates } from './templateStore';

export type DemandRuleDefinition = {
  code: string;
  name: string;
  description: string;
  valueKeywords: string[];
  fieldKeywords: string[];
};

export type SurveyDemandRecognition = {
  demandCode: string;
  demandName: string;
  surveyId: string;
  customerName: string;
  evidence: string[];
};

export type CustomerDemandRankingItem = {
  code: string;
  name: string;
  count: number;
  customers: string[];
  evidence: string[];
};

export type CustomerDemandRankingResult = {
  ranking: CustomerDemandRankingItem[];
  rules: DemandRuleDefinition[];
};

type FilledFieldEntry = {
  fieldId: string;
  sectionTitle: string;
  fieldLabel: string;
  valueText: string;
  searchText: string;
};

const DEMAND_RULES: DemandRuleDefinition[] = [
  {
    code: 'efficiency_analysis',
    name: '能效分析需求',
    description: '客户关注能耗结构、分项计量、负荷分析、节能评估、电费优化等分析能力。',
    valueKeywords: ['能效分析', '能耗分析', '能源分析', '分项计量', '负荷分析', '能效对标', '电费优化', '节能评估', '节能潜力'],
    fieldKeywords: ['核心功能诉求', '重点用能系统', '用能种类', '能耗结构', '节能评估'],
  },
  {
    code: 'reporting',
    name: '数据报表需求',
    description: '客户关注经营报表、统计分析、数据导出、多维报表与分析报告。',
    valueKeywords: ['报表', '报告', '统计分析', '数据导出', '分析报告', '多维分析', '月报', '周报'],
    fieldKeywords: ['报表', '报告', '统计', '汇总'],
  },
  {
    code: 'operations_management',
    name: '运维管理需求',
    description: '客户关注设备运维、巡检、维保、工单、设备健康与管理闭环。',
    valueKeywords: ['运维', '巡检', '维保', '工单', '设备管理', '设备健康', '故障处理', '管理痛点'],
    fieldKeywords: ['运维', '巡检', '维保', '管理痛点', 'kpi'],
  },
  {
    code: 'carbon_management',
    name: '碳管理需求',
    description: '客户关注碳盘查、碳核算、碳排管理、双碳和 ESG 披露。',
    valueKeywords: ['碳管理', '碳排', '碳盘查', '碳核算', '双碳', 'esg', '对外披露', '碳披露'],
    fieldKeywords: ['碳', '披露', '核算'],
  },
  {
    code: 'visualization',
    name: '可视化需求',
    description: '客户关注看板、大屏、驾驶舱、图形化展示和场景可视化。',
    valueKeywords: ['可视化', '大屏', '看板', '驾驶舱', '图形化', '展示', '数字孪生'],
    fieldKeywords: ['看板', '可视化', '大屏', '驾驶舱'],
  },
  {
    code: 'data_collection_integration',
    name: '数据采集接入需求',
    description: '客户关注仪表接入、协议转换、边缘采集、第三方系统对接与实时采集。',
    valueKeywords: ['数据采集', '实时采集', '协议转换', '协议接入', '边缘网关', '第三方系统对接', 'ems直连', 'scada', 'bms'],
    fieldKeywords: ['数据采集方式', '现有系统情况', '系统情况', '协议', '接入'],
  },
  {
    code: 'warning_monitoring',
    name: '预警监测需求',
    description: '客户关注告警、预警、异常监测、阈值提醒和实时监控。',
    valueKeywords: ['告警', '预警', '异常告警', '异常监测', '阈值', '实时监控', '异常提醒'],
    fieldKeywords: ['告警', '异常', '预警'],
  },
  {
    code: 'retrofit',
    name: '节能改造需求',
    description: '客户关注节能改造、系统升级、改造施工、节能措施与分阶段落地。',
    valueKeywords: ['节能改造', '改造', '系统升级', '设备替换', '节能措施', '实施计划', '改造施工'],
    fieldKeywords: ['改造', '升级', '节能措施', '实施计划'],
  },
];

const normalizeText = (value: unknown) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\u4e00-\u9fa5a-z0-9]/gi, '');
};

const dedupeStrings = (values: string[]) => {
  return Array.from(new Set(values.map((item) => String(item || '').trim()).filter(Boolean)));
};

const textMatches = (source: unknown, keyword: string) => {
  const normalizedSource = normalizeText(source);
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedSource || !normalizedKeyword) return false;
  return normalizedSource.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedSource);
};

const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map((item) => stringifyValue(item)).filter(Boolean).join('、');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value).trim();
};

const hasValue = (value: unknown) => {
  return Boolean(stringifyValue(value));
};

const buildEntrySearchText = (sectionTitle: string, field: SurveyField, value: unknown) => {
  const optionText = Array.isArray(field.options) ? field.options.join(' ') : '';
  return [
    sectionTitle,
    field.label,
    optionText,
    field.placeholder || '',
    stringifyValue(value),
  ].join(' ');
};

const resolveSurveyTemplate = (templateId: string): SurveyTemplate | null => {
  const templates = getAllSurveyTemplates();
  return templates.find((item) => item.id === templateId) || templates[0] || null;
};

const buildFilledFieldEntries = (surveyForm: SurveyForm): FilledFieldEntry[] => {
  const template = resolveSurveyTemplate(surveyForm.templateId);
  const data = surveyForm?.data && typeof surveyForm.data === 'object' ? surveyForm.data : {};
  const entries: FilledFieldEntry[] = [];
  const seenFieldIds = new Set<string>();

  if (template) {
    (template.sections || []).forEach((section) => {
      (section.fields || []).forEach((field) => {
        const value = (data as Record<string, unknown>)[field.id];
        if (!hasValue(value)) return;
        seenFieldIds.add(field.id);
        entries.push({
          fieldId: field.id,
          sectionTitle: section.title,
          fieldLabel: field.label,
          valueText: stringifyValue(value),
          searchText: buildEntrySearchText(section.title, field, value),
        });
      });
    });
  }

  Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
    if (seenFieldIds.has(key) || !hasValue(value)) return;
    const valueText = stringifyValue(value);
    entries.push({
      fieldId: key,
      sectionTitle: '未映射字段',
      fieldLabel: key,
      valueText,
      searchText: `${key} ${valueText}`,
    });
  });

  return entries;
};

export const getDemandRecognitionRules = () => DEMAND_RULES.map((rule) => ({
  ...rule,
  valueKeywords: [...rule.valueKeywords],
  fieldKeywords: [...rule.fieldKeywords],
}));

export const recognizeSurveyDemands = (surveyForm: SurveyForm): SurveyDemandRecognition[] => {
  const entries = buildFilledFieldEntries(surveyForm);
  const baseText = [
    surveyForm.projectName,
    surveyForm.customerName,
    surveyForm.industry,
    surveyForm.region,
    ...entries.map((entry) => entry.valueText),
  ].join(' ');

  return DEMAND_RULES.map((rule) => {
    const valueEvidence = entries
      .filter((entry) => rule.valueKeywords.some((keyword) => textMatches(entry.valueText, keyword)))
      .map((entry) => `${entry.fieldLabel}: ${entry.valueText}`)
      .slice(0, 4);

    const fieldEvidence = entries
      .filter((entry) => rule.fieldKeywords.some((keyword) => textMatches(entry.fieldLabel, keyword) || textMatches(entry.sectionTitle, keyword)))
      .map((entry) => `${entry.sectionTitle} / ${entry.fieldLabel}`)
      .slice(0, 3);

    const baseEvidence = rule.valueKeywords.some((keyword) => textMatches(baseText, keyword))
      ? [rule.valueKeywords.find((keyword) => textMatches(baseText, keyword)) || '']
      : [];

    const evidence = dedupeStrings([...valueEvidence, ...fieldEvidence, ...baseEvidence]).slice(0, 6);

    return evidence.length > 0
      ? {
          demandCode: rule.code,
          demandName: rule.name,
          surveyId: surveyForm.id,
          customerName: String(surveyForm.customerName || '').trim(),
          evidence,
        }
      : null;
  }).filter(Boolean) as SurveyDemandRecognition[];
};

export const buildCustomerDemandRanking = (surveyForms: SurveyForm[]): CustomerDemandRankingResult => {
  const customerDemandMap = new Map<string, Map<string, { name: string; evidence: string[] }>>();

  (surveyForms || []).forEach((surveyForm) => {
    const customerName = String(surveyForm.customerName || '').trim();
    if (!customerName) return;

    const recognitions = recognizeSurveyDemands(surveyForm);
    if (!recognitions.length) return;

    if (!customerDemandMap.has(customerName)) {
      customerDemandMap.set(customerName, new Map());
    }

    const demandMap = customerDemandMap.get(customerName)!;
    recognitions.forEach((recognition) => {
      const current = demandMap.get(recognition.demandCode);
      if (current) {
        current.evidence = dedupeStrings([...current.evidence, ...recognition.evidence]).slice(0, 6);
        return;
      }
      demandMap.set(recognition.demandCode, {
        name: recognition.demandName,
        evidence: [...recognition.evidence],
      });
    });
  });

  const ranking = DEMAND_RULES.map((rule) => {
    const customers: string[] = [];
    const evidence: string[] = [];

    customerDemandMap.forEach((demandMap, customerName) => {
      const hit = demandMap.get(rule.code);
      if (!hit) return;
      customers.push(customerName);
      evidence.push(...hit.evidence);
    });

    return {
      code: rule.code,
      name: rule.name,
      count: customers.length,
      customers,
      evidence: dedupeStrings(evidence).slice(0, 6),
    };
  })
    .filter((item) => item.count > 0)
    .sort((left, right) => {
      if (left.count !== right.count) return right.count - left.count;
      return left.name.localeCompare(right.name, 'zh-CN');
    });

  return {
    ranking,
    rules: getDemandRecognitionRules(),
  };
};
