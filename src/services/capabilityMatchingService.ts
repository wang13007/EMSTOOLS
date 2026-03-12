import { ProductCapability, ReportTemplate, SurveyField, SurveyForm, SurveyTemplate } from '../../types';
import { getProductCapabilities } from './productCapabilityStore';
import { getAllReportTemplates, getAllSurveyTemplates } from './templateStore';

export type CapabilityMatchLevel = 'high' | 'medium' | 'low' | 'none';

export type CapabilityMatchingRuleDefinition = {
  code: string;
  name: string;
  scoreText: string;
  description: string;
};

export type CapabilityRuleDetail = {
  code: string;
  name: string;
  score: number;
  evidence: string[];
  description: string;
};

export type RecognizedTemplateCapabilityTag = {
  capabilityId: string;
  capabilityName: string;
  score: number;
  evidence: string[];
};

export type CapabilityMatchingContext = {
  surveyTemplateId: string;
  surveyTemplateName: string;
  reportTemplateId: string;
  reportTemplateName: string;
  recognizedTemplateTags: RecognizedTemplateCapabilityTag[];
  matchingRules: CapabilityMatchingRuleDefinition[];
  thresholds: {
    templateTag: number;
    minMatch: number;
    medium: number;
    high: number;
  };
};

export type CapabilityMatchResult = ProductCapability & {
  matched: boolean;
  score: number;
  reasons: string[];
  matchLevel: CapabilityMatchLevel;
  ruleDetails: CapabilityRuleDetail[];
  templateTags: string[];
  templateTagScore: number;
  templateFieldHits: string[];
  surveyScenarioHits: string[];
  templateScenarioHits: string[];
  keywordHits: string[];
  matchedFunctions: string[];
  evidence: string[];
};

type TemplateTarget = {
  label: string;
  searchText: string;
};

type ResolvedTemplateContext = {
  surveyTemplate: SurveyTemplate | null;
  reportTemplate: ReportTemplate | null;
  templateSearchText: string;
  fieldTargets: TemplateTarget[];
};

const SCORE_THRESHOLD = {
  templateTag: 18,
  minMatch: 20,
  medium: 35,
  high: 60,
} as const;

const RULES: CapabilityMatchingRuleDefinition[] = [
  {
    code: 'industry_match',
    name: '行业匹配',
    scoreText: '+30',
    description: '问卷行业与能力适用行业存在同义、包含或完全一致命中。',
  },
  {
    code: 'survey_scenario_hit',
    name: '已填场景命中',
    scoreText: '+15/项，上限 30',
    description: '用户已填写的业务诉求、设备系统、现状描述中命中能力场景关键词。',
  },
  {
    code: 'template_scenario_hit',
    name: '模板场景命中',
    scoreText: '+10/项，上限 20',
    description: '调研模板或报告模板中的章节、字段、选项命中能力场景关键词。',
  },
  {
    code: 'capability_name_in_survey',
    name: '能力名称命中问卷',
    scoreText: '+20',
    description: '能力名称直接命中项目名称、客户描述或已填问卷数据。',
  },
  {
    code: 'capability_name_in_template',
    name: '能力名称命中模板',
    scoreText: '+12',
    description: '能力名称直接命中调研模板名称、报告模板名称、章节或正文。',
  },
  {
    code: 'template_field_hit',
    name: '模板字段语义命中',
    scoreText: '+6/项，上限 18',
    description: '模板字段标题、章节标题或选项文本与能力关键词发生语义命中。',
  },
  {
    code: 'description_keyword_hit',
    name: '描述关键词命中',
    scoreText: '+4/项，上限 16',
    description: '能力描述中的关键短语在问卷或模板文本中被命中。',
  },
  {
    code: 'template_tag_bonus',
    name: '模板标签加分',
    scoreText: '+10',
    description: '模板侧累计得分达到 18 分及以上，识别为模板能力标签并追加加分。',
  },
];

const DESCRIPTION_STOP_WORDS = new Set([
  '支持',
  '提供',
  '用于',
  '实现',
  '方案',
  '平台',
  '系统',
  '能力',
  '服务',
  '建设',
  '管理',
  '优化',
  '分析',
  '相关',
  '应用',
  '场景',
  '项目',
  '模块',
  '数据',
  '业务',
  '功能',
  '企业',
  '客户',
]);

const dedupeStrings = (values: string[]) => {
  return Array.from(new Set(values.map((item) => String(item || '').trim()).filter(Boolean)));
};

const normalizeText = (value: unknown) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\u4e00-\u9fa5a-z0-9]/gi, '');
};

const textMatches = (source: unknown, target: unknown) => {
  const left = normalizeText(source);
  const right = normalizeText(target);
  if (!left || !right) return false;
  return left.includes(right) || right.includes(left);
};

const flattenValue = (value: unknown): string[] => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenValue(item));
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((item) => flattenValue(item));
  }
  const normalized = String(value).trim();
  return normalized ? [normalized] : [];
};

const sanitizeToken = (value: string) => normalizeText(value);

const splitDescriptionKeywords = (value: string) => {
  const normalized = String(value || '').trim();
  if (!normalized) return [];
  return dedupeStrings(
    normalized
      .split(/[，。；、：:（）()【】[\]{}"'`~!@#$%^&*+\-_=<>?/\\\s]+/)
      .map((item) => sanitizeToken(item))
      .filter((item) => item.length >= 2 && item.length <= 20 && !DESCRIPTION_STOP_WORDS.has(item))
  );
};

const getCapabilityDescriptionKeywords = (capability: ProductCapability) => {
  return splitDescriptionKeywords(capability.description || '');
};

const getCapabilityKeywords = (capability: ProductCapability) => {
  return dedupeStrings([
    sanitizeToken(capability.name),
    ...capability.scenarios.map((item) => sanitizeToken(item)),
    ...getCapabilityDescriptionKeywords(capability),
  ]).filter((item) => item.length >= 2);
};

const buildFieldSearchText = (sectionTitle: string, field: SurveyField) => {
  return [
    sectionTitle,
    field.label,
    ...(field.options || []),
    field.placeholder || '',
  ].join(' ');
};

const resolveTemplateContext = (surveyForm: SurveyForm): ResolvedTemplateContext => {
  const surveyTemplates = getAllSurveyTemplates();
  const reportTemplates = getAllReportTemplates();

  const surveyTemplate = surveyTemplates.find((item) => item.id === surveyForm.templateId) || surveyTemplates[0] || null;
  const reportTemplate = surveyTemplate?.reportTemplateId
    ? reportTemplates.find((item) => item.id === surveyTemplate.reportTemplateId) || null
    : reportTemplates.find((item) => item.surveyTemplateId === surveyTemplate?.id) || null;

  const fieldTargets: TemplateTarget[] = [];

  if (surveyTemplate) {
    fieldTargets.push({
      label: `调研模板: ${surveyTemplate.name}`,
      searchText: [surveyTemplate.name, surveyTemplate.description || '', surveyTemplate.readonlyContent || ''].join(' '),
    });

    (surveyTemplate.sections || []).forEach((section) => {
      fieldTargets.push({
        label: `调研章节: ${section.title}`,
        searchText: section.title,
      });

      (section.fields || []).forEach((field) => {
        fieldTargets.push({
          label: `调研字段: ${section.title} / ${field.label}`,
          searchText: buildFieldSearchText(section.title, field),
        });
      });
    });
  }

  if (reportTemplate) {
    fieldTargets.push({
      label: `报告模板: ${reportTemplate.name}`,
      searchText: [reportTemplate.name, reportTemplate.description || '', reportTemplate.content || ''].join(' '),
    });

    (reportTemplate.sections || []).forEach((sectionTitle) => {
      fieldTargets.push({
        label: `报告章节: ${sectionTitle}`,
        searchText: sectionTitle,
      });
    });
  }

  const templateSearchText = fieldTargets.map((item) => item.searchText).join(' ');

  return {
    surveyTemplate,
    reportTemplate,
    templateSearchText,
    fieldTargets,
  };
};

const getMatchLevel = (score: number): CapabilityMatchLevel => {
  if (score >= SCORE_THRESHOLD.high) return 'high';
  if (score >= SCORE_THRESHOLD.medium) return 'medium';
  if (score >= SCORE_THRESHOLD.minMatch) return 'low';
  return 'none';
};

const addRule = (
  details: CapabilityRuleDetail[],
  reasons: string[],
  rule: CapabilityMatchingRuleDefinition,
  score: number,
  evidence: string[],
) => {
  const normalizedEvidence = dedupeStrings(evidence).slice(0, 6);
  if (!score || !normalizedEvidence.length) return 0;

  details.push({
    code: rule.code,
    name: rule.name,
    score,
    evidence: normalizedEvidence,
    description: rule.description,
  });
  reasons.push(`${rule.name} +${score}：${normalizedEvidence.join('、')}`);
  return score;
};

export const buildCapabilityMatchPackage = (
  surveyForm: SurveyForm,
  capabilities: ProductCapability[] = getProductCapabilities(),
): {
  context: CapabilityMatchingContext;
  matches: CapabilityMatchResult[];
} => {
  const templateContext = resolveTemplateContext(surveyForm);
  const surveySearchText = [
    surveyForm.projectName,
    surveyForm.customerName,
    surveyForm.industry,
    surveyForm.region,
    ...flattenValue(surveyForm.data || {}),
  ].join(' ');
  const templateSearchText = templateContext.templateSearchText;
  const combinedSearchText = `${surveySearchText} ${templateSearchText}`.trim();
  const industry = String(surveyForm.industry || '').trim();

  const matches = (capabilities || []).map((capability) => {
    let totalScore = 0;
    const reasons: string[] = [];
    const ruleDetails: CapabilityRuleDetail[] = [];
    const keywords = getCapabilityKeywords(capability);
    const descriptionKeywords = getCapabilityDescriptionKeywords(capability);

    const industryHits = capability.industries.filter((item) => textMatches(item, industry));
    totalScore += addRule(ruleDetails, reasons, RULES[0], industryHits.length ? 30 : 0, industryHits.length ? [industry, ...industryHits] : []);

    const surveyScenarioHits = capability.scenarios.filter((item) => textMatches(surveySearchText, item));
    totalScore += addRule(
      ruleDetails,
      reasons,
      RULES[1],
      Math.min(30, surveyScenarioHits.length * 15),
      surveyScenarioHits,
    );

    const templateScenarioHits = capability.scenarios.filter((item) => textMatches(templateSearchText, item));
    totalScore += addRule(
      ruleDetails,
      reasons,
      RULES[2],
      Math.min(20, templateScenarioHits.length * 10),
      templateScenarioHits,
    );

    totalScore += addRule(
      ruleDetails,
      reasons,
      RULES[3],
      textMatches(surveySearchText, capability.name) ? 20 : 0,
      textMatches(surveySearchText, capability.name) ? [capability.name] : [],
    );

    totalScore += addRule(
      ruleDetails,
      reasons,
      RULES[4],
      textMatches(templateSearchText, capability.name) ? 12 : 0,
      textMatches(templateSearchText, capability.name) ? [capability.name] : [],
    );

    const templateFieldHits = templateContext.fieldTargets
      .filter((target) => keywords.some((keyword) => textMatches(target.searchText, keyword)))
      .map((target) => target.label)
      .slice(0, 6);
    totalScore += addRule(
      ruleDetails,
      reasons,
      RULES[5],
      Math.min(18, templateFieldHits.length * 6),
      templateFieldHits,
    );

    const keywordHits = descriptionKeywords.filter((keyword) => textMatches(combinedSearchText, keyword)).slice(0, 6);
    totalScore += addRule(
      ruleDetails,
      reasons,
      RULES[6],
      Math.min(16, keywordHits.length * 4),
      keywordHits,
    );

    const templateKeywordHits = descriptionKeywords.filter((keyword) => textMatches(templateSearchText, keyword)).slice(0, 6);
    const templateTagScore =
      Math.min(20, templateScenarioHits.length * 10)
      + (textMatches(templateSearchText, capability.name) ? 12 : 0)
      + Math.min(18, templateFieldHits.length * 6)
      + Math.min(8, templateKeywordHits.length * 4);

    const templateTags = templateTagScore >= SCORE_THRESHOLD.templateTag ? [capability.name] : [];
    totalScore += addRule(
      ruleDetails,
      reasons,
      RULES[7],
      templateTags.length ? 10 : 0,
      templateTags.length ? [...templateFieldHits.slice(0, 2), ...templateScenarioHits.slice(0, 2), capability.name] : [],
    );

    const matchedFunctions = dedupeStrings([
      ...surveyScenarioHits,
      ...templateScenarioHits,
      ...templateFieldHits.map((item) => item.replace(/^.*?:\s*/, '').trim()),
      ...keywordHits,
    ]).slice(0, 8);

    const evidence = dedupeStrings(ruleDetails.flatMap((item) => item.evidence)).slice(0, 12);
    const matchLevel = getMatchLevel(totalScore);

    return {
      ...capability,
      matched: totalScore >= SCORE_THRESHOLD.minMatch,
      score: totalScore,
      reasons: reasons.length ? reasons : ['未命中明确规则，建议补充行业、场景或模板字段描述后重新计算。'],
      matchLevel,
      ruleDetails,
      templateTags,
      templateTagScore,
      templateFieldHits,
      surveyScenarioHits,
      templateScenarioHits,
      keywordHits,
      matchedFunctions,
      evidence,
    };
  });

  const sortedMatches = matches.sort((left, right) => {
    if (left.matched !== right.matched) return left.matched ? -1 : 1;
    if (left.score !== right.score) return right.score - left.score;
    return left.name.localeCompare(right.name, 'zh-CN');
  });

  const context: CapabilityMatchingContext = {
    surveyTemplateId: templateContext.surveyTemplate?.id || 'unknown-survey-template',
    surveyTemplateName: templateContext.surveyTemplate?.name || '未识别调研模板',
    reportTemplateId: templateContext.reportTemplate?.id || 'unknown-report-template',
    reportTemplateName: templateContext.reportTemplate?.name || '未识别报告模板',
    recognizedTemplateTags: sortedMatches
      .filter((item) => item.templateTags.length > 0)
      .map((item) => ({
        capabilityId: item.id,
        capabilityName: item.name,
        score: item.templateTagScore,
        evidence: dedupeStrings([...item.templateFieldHits, ...item.templateScenarioHits, ...item.keywordHits]).slice(0, 6),
      })),
    matchingRules: RULES,
    thresholds: {
      templateTag: SCORE_THRESHOLD.templateTag,
      minMatch: SCORE_THRESHOLD.minMatch,
      medium: SCORE_THRESHOLD.medium,
      high: SCORE_THRESHOLD.high,
    },
  };

  return {
    context,
    matches: sortedMatches,
  };
};
