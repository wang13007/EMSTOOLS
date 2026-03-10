import { REPORT_TEMPLATES } from '../constants/reportTemplatePreset';
import { SURVEY_TEMPLATES } from '../constants/surveyTemplatePreset';
import { SurveyForm } from '../types';
import { getReportTemplateNameById, getSurveyTemplateNameById } from '../src/services/templateNameStore';
import { ReportResult } from './geminiService';

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
  preSalesContact: PreSalesContactInfo;
};

const PLACEHOLDER_REGEX = /{{\s*([\w.-]+)\s*}}/g;

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
    if (!(key in valueMap)) return `【未配置字段:${key}】`;
    return toDisplayValue(valueMap[key]);
  });

  return { renderedContent, placeholders };
};

const buildTemplateSections = (surveyForm: SurveyForm, aiReport?: ReportResult): TemplateReportSection[] => {
  const summary = aiReport?.summary || '基于调研模板字段，系统已完成项目现状梳理。';
  const diagnosis = [
    aiReport?.energyStructureAnalysis,
    aiReport?.savingPotential,
    aiReport?.roiAnalysis,
  ]
    .filter(Boolean)
    .join('\n');

  const gaps = aiReport?.keyGaps?.length ? aiReport.keyGaps.map((item) => `- ${item}`).join('\n') : '- 暂无关键差距数据';
  const actions = aiReport?.nextSteps?.length ? aiReport.nextSteps.map((item, idx) => `${idx + 1}. ${item}`).join('\n') : '1. 完善基础数据采集\n2. 完成实施方案评审';
  const recommendations = [
    `软件建议：${aiReport?.softwareRecommendations?.join('；') || '未提供'}`,
    `硬件建议：${aiReport?.hardwareRecommendations?.join('；') || '未提供'}`,
    `咨询建议：${aiReport?.consultingRecommendations?.join('；') || '未提供'}`,
  ].join('\n');

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
      title: '实施路径',
      content: actions,
    },
  ];
};

const buildTemplateCharts = (surveyForm: SurveyForm, aiReport?: ReportResult): TemplateChartBlock[] => {
  const rawData = surveyForm?.data && typeof surveyForm.data === 'object' ? surveyForm.data : {};
  const efficiencyScore = aiReport?.efficiencyScore ?? 0;
  const softwareCount = aiReport?.softwareRecommendations?.length ?? 0;
  const hardwareCount = aiReport?.hardwareRecommendations?.length ?? 0;
  const consultingCount = aiReport?.consultingRecommendations?.length ?? 0;
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
        { name: '年总用电量(kWh)', value: annualPower },
        { name: '年总电费(万元)', value: annualCost },
      ],
      summary: annualPower || annualCost ? '图表展示当前项目基线能耗与费用规模' : '模板字段未提供能耗与费用数据，图表值为0',
    },
  ];
};

const composeTemplateReportContent = (
  renderedTemplate: string,
  sections: TemplateReportSection[],
  charts: TemplateChartBlock[],
) => {
  const sectionContent = sections
    .map((section) => `### ${section.title}\n${section.content}`)
    .join('\n\n');

  const chartContent = charts
    .map((chart) => {
      const points = chart.data.map((point) => `- ${point.name}: ${point.value}`).join('\n');
      return `### ${chart.title}\n${chart.summary}\n${points}`;
    })
    .join('\n\n');

  return [
    renderedTemplate,
    '',
    '## 自动生成分析正文',
    sectionContent,
    '',
    '## 图表信息',
    chartContent,
  ].join('\n');
};

const buildFallbackTemplateReport = (surveyForm: SurveyForm, aiReport?: ReportResult): TemplateReportResult => {
  const surveyTemplate = SURVEY_TEMPLATES.find((item) => item.id === surveyForm.templateId) || SURVEY_TEMPLATES[0];
  const content = `# 模板输出报告（回退）

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
  const sections = buildTemplateSections(surveyForm, aiReport);
  const charts = buildTemplateCharts(surveyForm, aiReport);

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

export const generateTemplateReport = (surveyForm: SurveyForm, aiReport?: ReportResult): TemplateReportResult => {
  const surveyTemplate = SURVEY_TEMPLATES.find((item) => item.id === surveyForm.templateId) || SURVEY_TEMPLATES[0];
  const reportTemplate = surveyTemplate?.reportTemplateId
    ? REPORT_TEMPLATES.find((item) => item.id === surveyTemplate.reportTemplateId)
    : REPORT_TEMPLATES.find((item) => item.surveyTemplateId === surveyTemplate?.id);

  if (!surveyTemplate || !reportTemplate) {
    return buildFallbackTemplateReport(surveyForm, aiReport);
  }

  const rendered = renderTemplateContent(reportTemplate.content, buildValueMap(surveyForm));
  const sections = buildTemplateSections(surveyForm, aiReport);
  const charts = buildTemplateCharts(surveyForm, aiReport);

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
  return {
    surveyId: surveyForm.id,
    generatedAt: new Date().toISOString(),
    aiReport,
    templateReport: generateTemplateReport(surveyForm, aiReport),
    preSalesContact,
  };
};
