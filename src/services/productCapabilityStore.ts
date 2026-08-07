import { ProductCapability, ProductType, SurveyForm } from '../../types';

const STORAGE_KEY = 'ems_product_capabilities';

const DEFAULT_PRODUCT_CAPABILITIES: ProductCapability[] = [
  {
    id: '1',
    name: '能效分析平台',
    type: ProductType.SOFTWARE,
    industries: ['制造业', '园区'],
    scenarios: ['能耗分析', '能效诊断'],
    description: '提供看板分析、异常告警与能效诊断的核心软件平台。',
    createTime: new Date().toISOString(),
  },
  {
    id: '2',
    name: '边缘采集网关',
    type: ProductType.HARDWARE,
    industries: ['制造业', '商业地产'],
    scenarios: ['数据采集', '协议转换'],
    description: '支持常见工业协议接入与边缘侧数据汇聚。',
    createTime: new Date().toISOString(),
  },
  {
    id: '3',
    name: '节能改造实施服务',
    type: ProductType.RETROFIT,
    industries: ['园区', '制造业'],
    scenarios: ['系统升级', '节能改造'],
    description: '面向现场的节能改造交付与实施服务包。',
    createTime: new Date().toISOString(),
  },
];

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const dedupeStrings = (values: string[]) => {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
};

const normalizeType = (value: unknown): ProductType => {
  const raw = String(value || '').trim();
  if (raw === ProductType.SOFTWARE) return ProductType.SOFTWARE;
  if (raw === ProductType.HARDWARE) return ProductType.HARDWARE;
  if (raw === ProductType.CONSULTING) return ProductType.CONSULTING;
  if (raw === ProductType.RETROFIT) return ProductType.RETROFIT;
  return ProductType.SOFTWARE;
};

const normalizeCapability = (item: any, index: number): ProductCapability => {
  return {
    id: String(item?.id || `pc-${index + 1}`),
    name: String(item?.name || '').trim() || `未命名能力${index + 1}`,
    type: normalizeType(item?.type),
    industries: dedupeStrings(Array.isArray(item?.industries) ? item.industries : []),
    scenarios: dedupeStrings(Array.isArray(item?.scenarios) ? item.scenarios : []),
    description: String(item?.description || '').trim(),
    createTime: String(item?.createTime || item?.create_time || new Date().toISOString()),
  };
};

const parseStoredCapabilities = (raw: string | null): ProductCapability[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, index) => normalizeCapability(item, index));
  } catch {
    return [];
  }
};

const cloneDefaultCapabilities = () => {
  return DEFAULT_PRODUCT_CAPABILITIES.map((item) => ({ ...item, industries: [...item.industries], scenarios: [...item.scenarios] }));
};

export const getProductCapabilities = (): ProductCapability[] => {
  if (!canUseStorage()) return cloneDefaultCapabilities();
  const stored = parseStoredCapabilities(window.localStorage.getItem(STORAGE_KEY));
  return stored.length ? stored : cloneDefaultCapabilities();
};

export const saveProductCapabilities = (capabilities: ProductCapability[]) => {
  if (!canUseStorage()) return;
  const normalized = (capabilities || []).map((item, index) => normalizeCapability(item, index));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
};

export type ProductCapabilityMatch = ProductCapability & {
  matched: boolean;
  score: number;
  reasons: string[];
};

const includesEither = (source: string, target: string) => {
  return source.includes(target) || target.includes(source);
};

export const matchProductCapabilities = (
  surveyForm: SurveyForm,
  capabilities: ProductCapability[] = getProductCapabilities(),
): ProductCapabilityMatch[] => {
  const projectText = [
    surveyForm.projectName,
    surveyForm.customerName,
    surveyForm.industry,
    surveyForm.region,
    JSON.stringify(surveyForm.data || {}),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const industry = String(surveyForm.industry || '').trim();

  const scored = capabilities.map((capability) => {
    let score = 0;
    const reasons: string[] = [];

    if (industry && capability.industries.some((item) => includesEither(item, industry))) {
      score += 3;
      reasons.push(`行业匹配：${industry}`);
    }

    const hitScenarios = capability.scenarios.filter((item) => projectText.includes(item.toLowerCase()));
    if (hitScenarios.length) {
      score += hitScenarios.length * 2;
      reasons.push(`场景匹配：${hitScenarios.join('、')}`);
    }

    if (projectText.includes(capability.name.toLowerCase())) {
      score += 2;
      reasons.push(`名称命中：${capability.name}`);
    }

    if (capability.description && projectText.includes(capability.description.slice(0, 8).toLowerCase())) {
      score += 1;
      reasons.push('描述关键词命中');
    }

    return {
      ...capability,
      matched: score > 0,
      score,
      reasons: reasons.length ? reasons : ['待补充项目行业/场景信息以完成匹配'],
    };
  });

  return scored.sort((a, b) => {
    if (a.matched !== b.matched) return a.matched ? -1 : 1;
    if (a.score !== b.score) return b.score - a.score;
    return a.name.localeCompare(b.name, 'zh-CN');
  });
};
