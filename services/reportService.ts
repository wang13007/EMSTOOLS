import { REPORT_TEMPLATES } from '../constants/reportTemplatePreset';
import { SURVEY_TEMPLATES } from '../constants/surveyTemplatePreset';
import { SurveyForm } from '../types';
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

export type TemplateReportResult = {
  templateId: string;
  templateName: string;
  surveyTemplateId: string;
  surveyTemplateName: string;
  renderedContent: string;
  placeholders: TemplatePlaceholder[];
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

const buildFallbackTemplateReport = (surveyForm: SurveyForm): TemplateReportResult => {
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

  return {
    templateId: 'fallback-template',
    templateName: '模板输出报告（回退）',
    surveyTemplateId: surveyTemplate?.id || 'unknown',
    surveyTemplateName: surveyTemplate?.name || '未知调研模板',
    renderedContent: rendered.renderedContent,
    placeholders: rendered.placeholders,
  };
};

export const generateTemplateReport = (surveyForm: SurveyForm): TemplateReportResult => {
  const surveyTemplate = SURVEY_TEMPLATES.find((item) => item.id === surveyForm.templateId) || SURVEY_TEMPLATES[0];
  const reportTemplate = surveyTemplate?.reportTemplateId
    ? REPORT_TEMPLATES.find((item) => item.id === surveyTemplate.reportTemplateId)
    : REPORT_TEMPLATES.find((item) => item.surveyTemplateId === surveyTemplate?.id);

  if (!surveyTemplate || !reportTemplate) {
    return buildFallbackTemplateReport(surveyForm);
  }

  const rendered = renderTemplateContent(reportTemplate.content, buildValueMap(surveyForm));
  return {
    templateId: reportTemplate.id,
    templateName: reportTemplate.name,
    surveyTemplateId: surveyTemplate.id,
    surveyTemplateName: surveyTemplate.name,
    renderedContent: rendered.renderedContent,
    placeholders: rendered.placeholders,
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
    templateReport: generateTemplateReport(surveyForm),
    preSalesContact,
  };
};
