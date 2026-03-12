import { REPORT_TEMPLATES } from '../constants/reportTemplatePreset';
import { SURVEY_TEMPLATES } from '../constants/surveyTemplatePreset';
import { SurveyForm } from '../types';
import { getReportTemplateNameById, getSurveyTemplateNameById } from '../src/services/templateNameStore';
import { ReportResult } from './geminiService';
import { getProductCapabilities, matchProductCapabilities, ProductCapabilityMatch } from '../src/services/productCapabilityStore';

export type PreSalesContactInfo = {
  id?: string;
  name: string;
  username?: string;
  phone?: string;
  email?: string;
};

export type TemplatePlaceholder = {
  key: string;
  value: string;
};

export type TemplateChartDataItem = {
  name: string;
  value: number;
};

export type TemplateChartBlock = {
  id: string;
  title: string;
  type: 'pie' | 'bar';
  data: TemplateChartDataItem[];
  summary: string;
};

export type TemplateReportSection = {
  title: string;
  content: string;
};

export type TemplateReportResult = {
  templateId: string;
  templateName: string;
  surveyTemplateId: string;
  surveyTemplateName: string;
  renderedContent: string;
  placeholders: TemplatePlaceholder[];
  sections: TemplateReportSection[];
  charts: TemplateChartBlock[];
};

export type ReportBundle = {
  surveyId: string;
  generatedAt: string;
  aiReport: ReportResult;
  templateReport: TemplateReportResult;
  capabilityMatches: ProductCapabilityMatch[];
  capabilityRecommendations: CapabilityRecommendationItem[];
  preSalesContact: PreSalesContactInfo;
};

const PLACEHOLDER_REGEX = /{{\s*([\w.-]+)\s*}}/g;

type RecommendationSource = 'software' | 'hardware' | 'consulting' | 'module';

export type CapabilityRecommendationItem = {
  capabilityId: string;
  capabilityName: string;
  capabilityType: ProductCapabilityMatch['type'];
  matched: boolean;
  score: number;
  reasons: string[];
  recommendationSource: RecommendationSource;
  recommendations: string[];
  actionSuggestion: string;
};

const toDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '未填写';
  if (Array.isArray(value)) return value.map((item) => String(item)).join('、') || '未填写';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const toNumber = (value: unknown) => {
  const normalized = String(value ?? '').replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildValueMap = (surveyForm: SurveyForm) => {
  const rawData = surveyForm?.data && typeof surveyForm.data === 'object' ? surveyForm.data : {};

  return {
    ...rawData,
    survey_name: surveyForm.name,
    project_name: surveyForm.projectName,
    client_name: surveyForm.customerName,
    industry: surveyForm.industry,
    region: surveyForm.region,
    create_time: surveyForm.createTime,
  } as Record<string, unknown>;
};

const dedupeStrings = (values: string[]) => {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
};

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase();

const sanitizeToken = (value: string) => normalizeText(value).replace(/[，。；、,:：()（）[\]{}"'`~!@#$%^&*+\-_=<>?/\\\s]/g, '');

const splitDescriptionKeywords = (value: string) => {
  return value
    .split(/[，。；、,:：()（）[\]{}"'`~!@#$%^&*+\-_=<>?/\\\s]+/)
    .map((item) => sanitizeToken(item))
    .filter((item) => item.length >= 2);
};

const getCapabilityKeywords = (capability: ProductCapabilityMatch) => {
  return dedupeStrings([
    sanitizeToken(capability.name),
    ...capability.scenarios.map((item) => sanitizeToken(item)),
    ...capability.industries.map((item) => sanitizeToken(item)),
    ...splitDescriptionKeywords(capability.description || ''),
  ]).filter(Boolean);
};

const buildRecommendationPool = (aiReport: ReportResult, capability: ProductCapabilityMatch): Array<{ source: RecommendationSource; text: string }> => {
  const software = dedupeStrings([...(aiReport.softwareRecommendations || []), ...(aiReport.recommendedModules || [])]);
  const hardware = dedupeStrings(aiReport.hardwareRecommendations || []);
  const consulting = dedupeStrings(aiReport.consultingRecommendations || []);
  const moduleOnly = dedupeStrings(aiReport.recommendedModules || []);

  if (capability.type === '软件') {
    return software.map((text) => ({ source: 'software' as const, text }));
  }
  if (capability.type === '硬件') {
    return hardware.map((text) => ({ source: 'hardware' as const, text }));
  }
  if (capability.type === '咨询') {
    return consulting.map((text) => ({ source: 'consulting' as const, text }));
  }
  return dedupeStrings([...consulting, ...hardware, ...moduleOnly]).map((text) => ({ source: 'module' as const, text }));
};

const scoreRecommendation = (
  capability: ProductCapabilityMatch,
  recommendation: string,
  keywords: string[],
) => {
  const recommendationText = normalizeText(recommendation);
  const recommendationToken = sanitizeToken(recommendationText);
  let score = 0;

  if (!recommendationText) {
    return score;
  }

  if (recommendationToken.includes(sanitizeToken(capability.name))) {
    score += 4;
  }
  if (keywords.some((item) => item && recommendationToken.includes(item))) {
    score += 2;
  }
  if (capability.reasons.some((reason) => recommendationText.includes(normalizeText(reason)))) {
    score += 1;
  }

  return score;
};

export const buildCapabilityRecommendations = (
  capabilityMatches: ProductCapabilityMatch[],
  aiReport: ReportResult,
): CapabilityRecommendationItem[] => {
  return capabilityMatches.map((capability) => {
    const keywords = getCapabilityKeywords(capability);
    const ranked = buildRecommendationPool(aiReport, capability)
      .map((item, idx) => ({
        ...item,
        score: scoreRecommendation(capability, item.text, keywords),
        idx,
      }))
      .sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return a.idx - b.idx;
      });

    const positiveHits = ranked.filter((item) => item.score > 0).map((item) => item.text);
    const fallback = capability.matched ? ranked.map((item) => item.text).slice(0, 2) : [];
    const recommendations = dedupeStrings([...positiveHits, ...fallback]).slice(0, 3);
    const recommendationSource = ranked.find((item) => item.score > 0)?.source || ranked[0]?.source || 'module';

    return {
      capabilityId: capability.id,
      capabilityName: capability.name,
      capabilityType: capability.type,
      matched: capability.matched,
      score: capability.score,
      reasons: capability.reasons,
      recommendationSource,
      recommendations,
      actionSuggestion: capability.matched
        ? (recommendations.length
          ? `建议优先落地：${recommendations[0]}`
          : `建议优先推进能力“${capability.name}”建设。`)
        : `当前与能力“${capability.name}”匹配度不足，建议补充业务场景后再定实施范围。`,
    };
  });
};

const enrichAiReportWithCapabilities = (
  aiReport: ReportResult,
  capabilityMatches: ProductCapabilityMatch[],
): ReportResult => {
  const matched = capabilityMatches.filter((item) => item.matched);
  const software = matched.filter((item) => item.type === '软件').map((item) => item.name);
  const hardware = matched.filter((item) => item.type === '硬件').map((item) => item.name);
  const consulting = matched.filter((item) => item.type === '咨询').map((item) => item.name);
  const retrofit = matched.filter((item) => item.type === '改造施工').map((item) => item.name);

  return {
    ...aiReport,
    recommendedModules: dedupeStrings([...aiReport.recommendedModules, ...matched.map((item) => item.name)]),
    softwareRecommendations: dedupeStrings([...aiReport.softwareRecommendations, ...software]),
    hardwareRecommendations: dedupeStrings([...aiReport.hardwareRecommendations, ...hardware]),
    consultingRecommendations: dedupeStrings([
      ...aiReport.consultingRecommendations,
      ...consulting,
      ...retrofit.map((name) => `改造施工：${name}`),
    ]),
  };
};

const renderTemplateContent = (content: string, valueMap: Record<string, unknown>) => {
  const placeholderKeys = new Set<string>();
  let matched: RegExpExecArray | null;

  while ((matched = PLACEHOLDER_REGEX.exec(content)) !== null) {
    placeholderKeys.add(matched[1]);
  }
  PLACEHOLDER_REGEX.lastIndex = 0;

  const placeholders: TemplatePlaceholder[] = Array.from(placeholderKeys).map((key) => ({
    key,
    value: toDisplayValue(valueMap[key]),
  }));

  const renderedContent = content.replace(PLACEHOLDER_REGEX, (_, key: string) => {
    if (!(key in valueMap)) return '【字段未配置】';
    return toDisplayValue(valueMap[key]);
  });

  return { renderedContent, placeholders };
};

const buildTemplateSections = (
  surveyForm: SurveyForm,
  aiReport?: ReportResult,
  capabilityMatches: ProductCapabilityMatch[] = [],
): TemplateReportSection[] => {
  const capabilityRecommendations = aiReport
    ? buildCapabilityRecommendations(capabilityMatches, aiReport)
    : [];
  const summary = aiReport?.summary || '基于调研模板字段，系统已完成项目现状梳理。';
  const diagnosis = [
    aiReport?.energyStructureAnalysis,
    aiReport?.savingPotential,
    aiReport?.roiAnalysis,
  ]
    .filter(Boolean)
    .join('\n');

  const gaps = aiReport?.keyGaps?.length ? aiReport.keyGaps.map((item) => `关键差距：${item}`).join('\n') : '暂无关键差距数据。';
  const actions = aiReport?.nextSteps?.length
    ? aiReport.nextSteps.map((item, idx) => `步骤${idx + 1}：${item}`).join('\n')
    : '步骤1：完善基础数据采集\n步骤2：完成实施方案评审';
  const recommendations = [
    `软件建议：${aiReport?.softwareRecommendations?.join('；') || '未提供'}`,
    `硬件建议：${aiReport?.hardwareRecommendations?.join('；') || '未提供'}`,
    `咨询建议：${aiReport?.consultingRecommendations?.join('；') || '未提供'}`,
  ].join('\n');
  const capabilityMatchSummary = capabilityMatches.length
    ? [
        `匹配结果：${capabilityMatches.filter((item) => item.matched).length}/${capabilityMatches.length} 已匹配`,
        ...capabilityMatches.map((item, idx) => {
          const reasonText = item.reasons.length ? item.reasons.join('；') : '无补充说明';
          return `第${idx + 1}项：${item.name}（${item.type}），状态：${item.matched ? '已匹配' : '待匹配'}。依据：${reasonText}`;
        }),
      ].join('\n')
    : '暂无产品能力数据。';
  const capabilityRecommendationSummary = capabilityRecommendations.length
    ? [
        '能力建议映射：',
        ...capabilityRecommendations.map((item, idx) => {
          const recommendations = item.recommendations.length ? item.recommendations.join('；') : '暂无直接建议';
          return `第${idx + 1}项：${item.capabilityName}（${item.capabilityType}），建议：${recommendations}。行动：${item.actionSuggestion}`;
        }),
      ].join('\n')
    : '能力建议映射：暂无可映射建议。';

  return [
    {
      title: '项目总体结论',
      content: `项目：${surveyForm.projectName || '-'}\n客户：${surveyForm.customerName || '-'}\n行业：${surveyForm.industry || '-'}\n\n${summary}`,
    },
    {
      title: '诊断分析',
      content: diagnosis || '暂无诊断分析内容。',
    },
    {
      title: '关键问题',
      content: gaps,
    },
    {
      title: '方案建议',
      content: recommendations,
    },
    {
      title: '产品能力匹配',
      content: `${capabilityMatchSummary}\n${capabilityRecommendationSummary}`,
    },
    {
      title: '实施路径',
      content: actions,
    },
  ];
};

const buildTemplateCharts = (
  surveyForm: SurveyForm,
  aiReport?: ReportResult,
  capabilityMatches: ProductCapabilityMatch[] = [],
): TemplateChartBlock[] => {
  const rawData = surveyForm?.data && typeof surveyForm.data === 'object' ? surveyForm.data : {};
  const efficiencyScore = aiReport?.efficiencyScore ?? 0;
  const softwareCount = aiReport?.softwareRecommendations?.length ?? 0;
  const hardwareCount = aiReport?.hardwareRecommendations?.length ?? 0;
  const consultingCount = aiReport?.consultingRecommendations?.length ?? 0;
  const matchedCount = capabilityMatches.filter((item) => item.matched).length;
  const unmatchedCount = Math.max(0, capabilityMatches.length - matchedCount);
  const annualPower = toNumber((rawData as any).field_016_16 || (rawData as any).annual_power_kwh);
  const annualCost = toNumber((rawData as any).field_017_17 || (rawData as any).annual_cost_wanyuan);

  return [
    {
      id: 'efficiency-score',
      title: '能效成熟度占比',
      type: 'pie',
      data: [
        { name: '成熟度', value: Math.max(0, Math.min(100, efficiencyScore)) },
        { name: '提升空间', value: Math.max(0, 100 - Math.max(0, Math.min(100, efficiencyScore))) },
      ],
      summary: `当前能效成熟度评分为 ${efficiencyScore}%`,
    },
    {
      id: 'recommendation-distribution',
      title: '建议项分布',
      type: 'bar',
      data: [
        { name: '软件建议', value: softwareCount },
        { name: '硬件建议', value: hardwareCount },
        { name: '咨询建议', value: consultingCount },
      ],
      summary: `共形成 ${softwareCount + hardwareCount + consultingCount} 条建议项`,
    },
    {
      id: 'energy-baseline',
      title: '基线能耗/费用',
      type: 'bar',
      data: [
        { name: '年总用电量（千瓦时）', value: annualPower },
        { name: '年总电费(万元)', value: annualCost },
      ],
      summary: annualPower || annualCost ? '图表展示当前项目基线能耗与费用规模' : '模板字段未提供能耗与费用数据，图表值为0',
    },
    {
      id: 'capability-match',
      title: '产品能力匹配统计',
      type: 'bar',
      data: [
        { name: '已匹配', value: matchedCount },
        { name: '待匹配', value: unmatchedCount },
      ],
      summary: capabilityMatches.length ? `已完成 ${matchedCount}/${capabilityMatches.length} 项能力匹配` : '暂无产品能力可匹配',
    },
  ];
};

const composeTemplateReportContent = (
  _renderedTemplate: string,
  sections: TemplateReportSection[],
  charts: TemplateChartBlock[],
) => {
  const sectionContent = sections
    .map((section) => `${section.title}\n${section.content}`)
    .join('\n\n');

  const chartContent = charts
    .map((chart) => {
      const points = chart.data
        .map((point, idx) => `数据${idx + 1}：${point.name}，数值 ${point.value}`)
        .join('\n');
      return `${chart.title}\n${chart.summary}\n${points}`;
    })
    .join('\n\n');

  return [
    '自动生成分析正文',
    sectionContent,
    '',
    '图表信息',
    chartContent,
  ].join('\n');
};

const buildFallbackTemplateReport = (
  surveyForm: SurveyForm,
  aiReport?: ReportResult,
  capabilityMatches: ProductCapabilityMatch[] = [],
): TemplateReportResult => {
  const surveyTemplate = SURVEY_TEMPLATES.find((item) => item.id === surveyForm.templateId) || SURVEY_TEMPLATES[0];
  const content = `模板输出报告（回退）

项目名称：{{project_name}}
客户名称：{{client_name}}
行业：{{industry}}
区域：{{region}}

调研原始数据：
{{survey_data}}`;
  const valueMap = {
    ...buildValueMap(surveyForm),
    survey_data: surveyForm.data,
  };
  const rendered = renderTemplateContent(content, valueMap);
  const sections = buildTemplateSections(surveyForm, aiReport, capabilityMatches);
  const charts = buildTemplateCharts(surveyForm, aiReport, capabilityMatches);

  return {
    templateId: 'fallback-template',
    templateName: '模板输出报告（回退）',
    surveyTemplateId: surveyTemplate?.id || 'unknown',
    surveyTemplateName: getSurveyTemplateNameById(surveyTemplate?.id || 'unknown', surveyTemplate?.name || '未知调研模板'),
    renderedContent: composeTemplateReportContent(rendered.renderedContent, sections, charts),
    placeholders: rendered.placeholders,
    sections,
    charts,
  };
};

export const generateTemplateReport = (
  surveyForm: SurveyForm,
  aiReport?: ReportResult,
  capabilityMatchesInput?: ProductCapabilityMatch[],
): TemplateReportResult => {
  const surveyTemplate = SURVEY_TEMPLATES.find((item) => item.id === surveyForm.templateId) || SURVEY_TEMPLATES[0];
  const reportTemplate = surveyTemplate?.reportTemplateId
    ? REPORT_TEMPLATES.find((item) => item.id === surveyTemplate.reportTemplateId)
    : REPORT_TEMPLATES.find((item) => item.surveyTemplateId === surveyTemplate?.id);
  const capabilityMatches = capabilityMatchesInput || matchProductCapabilities(surveyForm, getProductCapabilities());

  if (!surveyTemplate || !reportTemplate) {
    return buildFallbackTemplateReport(surveyForm, aiReport, capabilityMatches);
  }

  const rendered = renderTemplateContent(reportTemplate.content, buildValueMap(surveyForm));
  const sections = buildTemplateSections(surveyForm, aiReport, capabilityMatches);
  const charts = buildTemplateCharts(surveyForm, aiReport, capabilityMatches);

  return {
    templateId: reportTemplate.id,
    templateName: getReportTemplateNameById(reportTemplate.id, reportTemplate.name),
    surveyTemplateId: surveyTemplate.id,
    surveyTemplateName: getSurveyTemplateNameById(surveyTemplate.id, surveyTemplate.name),
    renderedContent: composeTemplateReportContent(rendered.renderedContent, sections, charts),
    placeholders: rendered.placeholders,
    sections,
    charts,
  };
};

export const buildReportBundle = (
  surveyForm: SurveyForm,
  aiReport: ReportResult,
  preSalesContact: PreSalesContactInfo,
): ReportBundle => {
  const capabilityMatches = matchProductCapabilities(surveyForm, getProductCapabilities());
  const enrichedAiReport = enrichAiReportWithCapabilities(aiReport, capabilityMatches);
  const capabilityRecommendations = buildCapabilityRecommendations(capabilityMatches, enrichedAiReport);
  return {
    surveyId: surveyForm.id,
    generatedAt: new Date().toISOString(),
    aiReport: enrichedAiReport,
    templateReport: generateTemplateReport(surveyForm, enrichedAiReport, capabilityMatches),
    capabilityMatches,
    capabilityRecommendations,
    preSalesContact,
  };
};
