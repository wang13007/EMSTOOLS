import { REPORT_TEMPLATES } from '../../constants/reportTemplatePreset';
import { SURVEY_TEMPLATES } from '../../constants/surveyTemplatePreset';
import { ReportTemplate, SurveyField, SurveySection, SurveyTemplate } from '../../types';

const IMPORTED_SURVEY_TEMPLATES_KEY = 'ems_imported_survey_templates';
const IMPORTED_REPORT_TEMPLATES_KEY = 'ems_imported_report_templates';
export const TEMPLATE_STORE_EVENT = 'ems_template_store_updated';

const canUseLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const readArray = <T,>(key: string): T[] => {
  if (!canUseLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeArray = (key: string, value: any[]) => {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value || []));
  } catch {
    // ignore localStorage write failures
  }
};

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item || '').trim()))).filter((item) => item.length > 0);
};

const normalizeFieldType = (value: unknown): SurveyField['type'] => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'number' || raw.includes('数字') || raw.includes('数值')) return 'number';
  if (raw === 'select' || raw.includes('单选') || raw.includes('下拉')) return 'select';
  if (raw === 'multiselect' || raw.includes('多选')) return 'multiselect';
  if (raw === 'textarea' || raw.includes('长文本') || raw.includes('描述') || raw.includes('说明')) return 'textarea';
  return 'text';
};

const normalizeSurveyField = (field: any, sectionIndex: number, fieldIndex: number): SurveyField => {
  const options = toStringList(field?.options);
  return {
    id: String(field?.id || `field_${sectionIndex + 1}_${fieldIndex + 1}`),
    label: String(field?.label || `问题${fieldIndex + 1}`).trim() || `问题${fieldIndex + 1}`,
    type: normalizeFieldType(field?.type),
    options: options.length ? options : undefined,
    required: Boolean(field?.required),
    placeholder: field?.placeholder ? String(field.placeholder) : undefined,
    visibleWhen: field?.visibleWhen && field.visibleWhen.fieldId
      ? {
          fieldId: String(field.visibleWhen.fieldId),
          values: toStringList(field.visibleWhen.values),
        }
      : undefined,
  };
};

const normalizeSurveySection = (section: any, sectionIndex: number): SurveySection => {
  const fields = Array.isArray(section?.fields)
    ? section.fields.map((field: any, fieldIndex: number) => normalizeSurveyField(field, sectionIndex, fieldIndex))
    : [];
  return {
    id: String(section?.id || `section_${sectionIndex + 1}`),
    title: String(section?.title || `调研章节${sectionIndex + 1}`).trim() || `调研章节${sectionIndex + 1}`,
    fields,
    visibleWhen: section?.visibleWhen && section.visibleWhen.fieldId
      ? {
          fieldId: String(section.visibleWhen.fieldId),
          values: toStringList(section.visibleWhen.values),
        }
      : undefined,
  };
};

const normalizeSurveyTemplate = (template: any): SurveyTemplate => {
  const sections = Array.isArray(template?.sections)
    ? template.sections.map((section: any, index: number) => normalizeSurveySection(section, index))
    : [];
  return {
    id: String(template?.id || `tpl_import_${Date.now()}`),
    name: String(template?.name || '导入调研模板').trim() || '导入调研模板',
    industry: String(template?.industry || '通用').trim() || '通用',
    reportTemplateId: template?.reportTemplateId ? String(template.reportTemplateId) : undefined,
    sections,
    createTime: String(template?.createTime || template?.create_time || new Date().toISOString()),
    readonlyContent: template?.readonlyContent ? String(template.readonlyContent) : undefined,
  };
};

const normalizeReportTemplate = (template: any): ReportTemplate => {
  return {
    id: String(template?.id || `report_import_${Date.now()}`),
    name: String(template?.name || '导入报告模板').trim() || '导入报告模板',
    version: String(template?.version || 'v1.0'),
    description: String(template?.description || '由文档导入自动生成'),
    sections: Array.isArray(template?.sections)
      ? Array.from(new Set(template.sections.map((item: any) => String(item || '').trim()).filter(Boolean)))
      : [],
    content: String(template?.content || '').trim(),
    updatedAt: String(template?.updatedAt || template?.update_time || new Date().toISOString()),
    surveyTemplateId: String(template?.surveyTemplateId || ''),
  };
};

const sortSurveyTemplates = (templates: SurveyTemplate[]) => {
  return [...templates].sort((a, b) => new Date(b.createTime || 0).getTime() - new Date(a.createTime || 0).getTime());
};

const sortReportTemplates = (templates: ReportTemplate[]) => {
  return [...templates].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
};

const dispatchTemplateStoreEvent = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(TEMPLATE_STORE_EVENT));
};

export const readImportedSurveyTemplates = () => {
  return sortSurveyTemplates(readArray<any>(IMPORTED_SURVEY_TEMPLATES_KEY).map(normalizeSurveyTemplate));
};

export const readImportedReportTemplates = () => {
  return sortReportTemplates(readArray<any>(IMPORTED_REPORT_TEMPLATES_KEY).map(normalizeReportTemplate));
};

export const getAllSurveyTemplates = (): SurveyTemplate[] => {
  const imported = readImportedSurveyTemplates();
  const presetMap = new Map(SURVEY_TEMPLATES.map((item) => [item.id, item]));
  imported.forEach((item) => presetMap.set(item.id, item));
  const merged = Array.from(presetMap.values());
  const importedIds = new Set(imported.map((item) => item.id));
  const importedPart = sortSurveyTemplates(merged.filter((item) => importedIds.has(item.id)));
  const presetPart = merged.filter((item) => !importedIds.has(item.id));
  return [...importedPart, ...presetPart];
};

export const getAllReportTemplates = (): ReportTemplate[] => {
  const imported = readImportedReportTemplates();
  const presetMap = new Map(REPORT_TEMPLATES.map((item) => [item.id, item]));
  imported.forEach((item) => presetMap.set(item.id, item));
  const merged = Array.from(presetMap.values());
  const importedIds = new Set(imported.map((item) => item.id));
  const importedPart = sortReportTemplates(merged.filter((item) => importedIds.has(item.id)));
  const presetPart = merged.filter((item) => !importedIds.has(item.id));
  return [...importedPart, ...presetPart];
};

export const buildImportedTemplateId = (prefix: 'report' | 'survey') => {
  const stamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_import_${stamp}_${random}`;
};

export const saveImportedTemplatePair = (surveyTemplateInput: SurveyTemplate, reportTemplateInput: ReportTemplate) => {
  const surveyTemplate = normalizeSurveyTemplate(surveyTemplateInput);
  const reportTemplate = normalizeReportTemplate(reportTemplateInput);

  const normalizedSurvey = {
    ...surveyTemplate,
    reportTemplateId: reportTemplate.id,
    createTime: surveyTemplate.createTime || new Date().toISOString(),
  };
  const normalizedReport = {
    ...reportTemplate,
    surveyTemplateId: surveyTemplate.id,
    updatedAt: reportTemplate.updatedAt || new Date().toISOString(),
  };

  const importedSurveys = readImportedSurveyTemplates().filter((item) => item.id !== normalizedSurvey.id);
  importedSurveys.unshift(normalizedSurvey);
  writeArray(IMPORTED_SURVEY_TEMPLATES_KEY, importedSurveys);

  const importedReports = readImportedReportTemplates().filter((item) => item.id !== normalizedReport.id);
  importedReports.unshift(normalizedReport);
  writeArray(IMPORTED_REPORT_TEMPLATES_KEY, importedReports);

  dispatchTemplateStoreEvent();
  return {
    surveyTemplate: normalizedSurvey,
    reportTemplate: normalizedReport,
  };
};
