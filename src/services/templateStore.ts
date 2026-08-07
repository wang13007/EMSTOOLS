import { REPORT_TEMPLATES } from '../../constants/reportTemplatePreset';
import { SURVEY_TEMPLATES } from '../../constants/surveyTemplatePreset';
import { ReportTemplate, SurveyField, SurveySection, SurveyTemplate } from '../../types';
import { templateService } from './supabaseService';

const IMPORTED_SURVEY_TEMPLATES_KEY = 'ems_imported_survey_templates';
const IMPORTED_REPORT_TEMPLATES_KEY = 'ems_imported_report_templates';
export const TEMPLATE_STORE_EVENT = 'ems_template_store_updated';

const TEMPLATE_PAIR_SCHEMA = 'ems_template_pair_v1';
const TEMPLATE_PAIR_ROW_PREFIX = '__ems_imported_pair__';

const PRESET_SURVEY_TEMPLATE_IDS = new Set(SURVEY_TEMPLATES.map((item) => item.id));
const PRESET_REPORT_TEMPLATE_IDS = new Set(REPORT_TEMPLATES.map((item) => item.id));

type ImportedTemplatePair = {
  surveyTemplate: SurveyTemplate;
  reportTemplate: ReportTemplate;
};

type DeleteImportedTemplateResult = {
  deleted: boolean;
  deletedSurveyTemplate: SurveyTemplate | null;
  deletedReportTemplate: ReportTemplate | null;
};

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
    // ignore localStorage errors
  }
};

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item || '').trim()))).filter((item) => item.length > 0);
};

const normalizeFieldType = (value: unknown): SurveyField['type'] => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'text';
  if (raw === 'number' || raw.includes('number')) return 'number';
  if (raw === 'select') return 'select';
  if (raw === 'multiselect') return 'multiselect';
  if (raw === 'textarea') return 'textarea';
  return 'text';
};

const normalizeSurveyField = (field: any, sectionIndex: number, fieldIndex: number): SurveyField => {
  const options = toStringList(field?.options);
  return {
    id: String(field?.id || `field_${sectionIndex + 1}_${fieldIndex + 1}`),
    label: String(field?.label || `Question ${fieldIndex + 1}`).trim() || `Question ${fieldIndex + 1}`,
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
    title: String(section?.title || `Section ${sectionIndex + 1}`).trim() || `Section ${sectionIndex + 1}`,
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
    id: String(template?.id || `survey_import_${Date.now()}`),
    name: String(template?.name || 'Imported Survey Template').trim() || 'Imported Survey Template',
    description: String(template?.description || '').trim() || undefined,
    industry: String(template?.industry || 'General').trim() || 'General',
    reportTemplateId: template?.reportTemplateId ? String(template.reportTemplateId) : undefined,
    sections,
    createTime: String(template?.createTime || template?.create_time || new Date().toISOString()),
    readonlyContent: template?.readonlyContent ? String(template.readonlyContent) : undefined,
  };
};

const normalizeReportTemplate = (template: any): ReportTemplate => {
  return {
    id: String(template?.id || `report_import_${Date.now()}`),
    name: String(template?.name || 'Imported Report Template').trim() || 'Imported Report Template',
    version: String(template?.version || 'v1.0'),
    description: String(template?.description || '').trim(),
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

const sanitizeRowNameChunk = (value: string) => String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);

const hashText = (value: string) => {
  let hash = 0;
  const source = String(value || '');
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
};

const buildPairRowName = (surveyTemplateId: string) => {
  const id = String(surveyTemplateId || '').trim();
  if (!id) return '';
  return `${TEMPLATE_PAIR_ROW_PREFIX}${sanitizeRowNameChunk(id)}_${hashText(id)}`.slice(0, 100);
};

const buildPairPayload = (pair: ImportedTemplatePair) => {
  return {
    _meta: {
      schema: TEMPLATE_PAIR_SCHEMA,
      source: 'imported',
      surveyTemplateId: pair.surveyTemplate.id,
      reportTemplateId: pair.reportTemplate.id,
      updatedAt: new Date().toISOString(),
    },
    surveyTemplate: pair.surveyTemplate,
    reportTemplate: pair.reportTemplate,
  };
};

const parsePairFromTemplateRow = (row: any): ImportedTemplatePair | null => {
  const sections = row?.sections;
  if (!sections || typeof sections !== 'object' || Array.isArray(sections)) return null;
  const meta = sections?._meta;
  if (!meta || meta.schema !== TEMPLATE_PAIR_SCHEMA || meta.source !== 'imported') return null;

  const surveyTemplate = normalizeSurveyTemplate(sections?.surveyTemplate || {});
  const reportTemplate = normalizeReportTemplate(sections?.reportTemplate || {});

  if (!surveyTemplate.id || !reportTemplate.id) return null;

  return {
    surveyTemplate: {
      ...surveyTemplate,
      reportTemplateId: reportTemplate.id,
    },
    reportTemplate: {
      ...reportTemplate,
      surveyTemplateId: surveyTemplate.id,
    },
  };
};

const savePairToLocalCache = (pair: ImportedTemplatePair) => {
  const surveyTemplate = normalizeSurveyTemplate(pair.surveyTemplate);
  const reportTemplate = normalizeReportTemplate(pair.reportTemplate);

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

const removePairFromLocalCache = (params: {
  reportTemplateId?: string | null;
  surveyTemplateId?: string | null;
}): DeleteImportedTemplateResult => {
  const targetReportId = String(params.reportTemplateId || '').trim();
  const targetSurveyId = String(params.surveyTemplateId || '').trim();

  const importedReports = readImportedReportTemplates();
  const importedSurveys = readImportedSurveyTemplates();

  let reportTemplate = targetReportId
    ? importedReports.find((item) => item.id === targetReportId) || null
    : null;
  let surveyTemplate = targetSurveyId
    ? importedSurveys.find((item) => item.id === targetSurveyId) || null
    : null;

  if (!surveyTemplate && reportTemplate?.surveyTemplateId) {
    surveyTemplate = importedSurveys.find((item) => item.id === reportTemplate!.surveyTemplateId) || null;
  }
  if (!reportTemplate && surveyTemplate?.reportTemplateId) {
    reportTemplate = importedReports.find((item) => item.id === surveyTemplate!.reportTemplateId) || null;
  }

  if (!reportTemplate && !surveyTemplate) {
    return { deleted: false, deletedSurveyTemplate: null, deletedReportTemplate: null };
  }

  const reportIdsToRemove = new Set(
    [reportTemplate?.id, surveyTemplate?.reportTemplateId]
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  );
  const surveyIdsToRemove = new Set(
    [surveyTemplate?.id, reportTemplate?.surveyTemplateId]
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  );

  const nextReports = importedReports.filter((item) => !reportIdsToRemove.has(item.id));
  const nextSurveys = importedSurveys.filter((item) => !surveyIdsToRemove.has(item.id));

  writeArray(IMPORTED_REPORT_TEMPLATES_KEY, nextReports);
  writeArray(IMPORTED_SURVEY_TEMPLATES_KEY, nextSurveys);
  dispatchTemplateStoreEvent();

  return {
    deleted: true,
    deletedSurveyTemplate: surveyTemplate,
    deletedReportTemplate: reportTemplate,
  };
};

const getLocalImportedPairs = (): ImportedTemplatePair[] => {
  const surveyMap = new Map(readImportedSurveyTemplates().map((item) => [item.id, item]));
  const reportMap = new Map(readImportedReportTemplates().map((item) => [item.id, item]));

  const pairs: ImportedTemplatePair[] = [];
  surveyMap.forEach((surveyTemplate) => {
    const reportTemplate = surveyTemplate.reportTemplateId
      ? reportMap.get(surveyTemplate.reportTemplateId)
      : undefined;
    if (!reportTemplate) return;
    pairs.push({ surveyTemplate, reportTemplate });
  });

  return pairs;
};

const resolvePairFromLocalCache = (params: {
  reportTemplateId?: string | null;
  surveyTemplateId?: string | null;
}): ImportedTemplatePair | null => {
  const targetReportId = String(params.reportTemplateId || '').trim();
  const targetSurveyId = String(params.surveyTemplateId || '').trim();

  const reports = readImportedReportTemplates();
  const surveys = readImportedSurveyTemplates();

  let reportTemplate = targetReportId
    ? reports.find((item) => item.id === targetReportId) || null
    : null;
  let surveyTemplate = targetSurveyId
    ? surveys.find((item) => item.id === targetSurveyId) || null
    : null;

  if (!surveyTemplate && reportTemplate?.surveyTemplateId) {
    surveyTemplate = surveys.find((item) => item.id === reportTemplate!.surveyTemplateId) || null;
  }
  if (!reportTemplate && surveyTemplate?.reportTemplateId) {
    reportTemplate = reports.find((item) => item.id === surveyTemplate!.reportTemplateId) || null;
  }

  if (!surveyTemplate || !reportTemplate) return null;
  return { surveyTemplate, reportTemplate };
};

const persistPairToDatabase = async (pair: ImportedTemplatePair) => {
  const rowName = buildPairRowName(pair.surveyTemplate.id);
  if (!rowName) {
    throw new Error('Failed to generate template row key');
  }

  await templateService.upsertTemplateRowByName({
    name: rowName,
    industry: pair.surveyTemplate.industry || 'General',
    sections: buildPairPayload(pair),
  });
};

export const readImportedSurveyTemplates = () => {
  return sortSurveyTemplates(readArray<any>(IMPORTED_SURVEY_TEMPLATES_KEY).map(normalizeSurveyTemplate));
};

export const readImportedReportTemplates = () => {
  return sortReportTemplates(readArray<any>(IMPORTED_REPORT_TEMPLATES_KEY).map(normalizeReportTemplate));
};

export const isPresetSurveyTemplate = (templateId: string) => PRESET_SURVEY_TEMPLATE_IDS.has(String(templateId || ''));

export const isPresetReportTemplate = (templateId: string) => PRESET_REPORT_TEMPLATE_IDS.has(String(templateId || ''));

export const isImportedSurveyTemplate = (templateId: string) => {
  const targetId = String(templateId || '').trim();
  return readImportedSurveyTemplates().some((item) => item.id === targetId);
};

export const isImportedReportTemplate = (templateId: string) => {
  const targetId = String(templateId || '').trim();
  return readImportedReportTemplates().some((item) => item.id === targetId);
};

export const syncImportedTemplatesFromDatabase = async () => {
  try {
    const rows = await templateService.getTemplates();
    const remotePairs = (rows || []).map(parsePairFromTemplateRow).filter(Boolean) as ImportedTemplatePair[];

    let resolvedPairs = remotePairs;

    if (resolvedPairs.length === 0) {
      const localPairs = getLocalImportedPairs();
      if (localPairs.length > 0) {
        for (const pair of localPairs) {
          await persistPairToDatabase(pair);
        }
        resolvedPairs = localPairs;
      }
    }

    const remoteSurveyTemplates = sortSurveyTemplates(resolvedPairs.map((pair) => pair.surveyTemplate));
    const remoteReportTemplates = sortReportTemplates(resolvedPairs.map((pair) => pair.reportTemplate));

    writeArray(IMPORTED_SURVEY_TEMPLATES_KEY, remoteSurveyTemplates);
    writeArray(IMPORTED_REPORT_TEMPLATES_KEY, remoteReportTemplates);
    dispatchTemplateStoreEvent();

    return {
      surveyTemplates: remoteSurveyTemplates,
      reportTemplates: remoteReportTemplates,
    };
  } catch (error) {
    console.error('Failed to sync templates from database:', error);
    return {
      surveyTemplates: readImportedSurveyTemplates(),
      reportTemplates: readImportedReportTemplates(),
    };
  }
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

export const saveImportedTemplatePair = async (surveyTemplateInput: SurveyTemplate, reportTemplateInput: ReportTemplate) => {
  const surveyTemplate = normalizeSurveyTemplate(surveyTemplateInput);
  const reportTemplate = normalizeReportTemplate(reportTemplateInput);

  if (!surveyTemplate.name.trim() || !reportTemplate.name.trim()) {
    throw new Error('Template names are required');
  }

  const normalizedPair: ImportedTemplatePair = {
    surveyTemplate: {
      ...surveyTemplate,
      reportTemplateId: reportTemplate.id,
      createTime: surveyTemplate.createTime || new Date().toISOString(),
    },
    reportTemplate: {
      ...reportTemplate,
      surveyTemplateId: surveyTemplate.id,
      updatedAt: reportTemplate.updatedAt || new Date().toISOString(),
    },
  };

  await persistPairToDatabase(normalizedPair);
  return savePairToLocalCache(normalizedPair);
};

export const deleteImportedTemplatePair = async (params: {
  reportTemplateId?: string | null;
  surveyTemplateId?: string | null;
}): Promise<DeleteImportedTemplateResult> => {
  await syncImportedTemplatesFromDatabase();
  const resolvedPair = resolvePairFromLocalCache(params);
  if (!resolvedPair) {
    return { deleted: false, deletedSurveyTemplate: null, deletedReportTemplate: null };
  }

  const rowName = buildPairRowName(resolvedPair.surveyTemplate.id);
  if (!rowName) {
    return { deleted: false, deletedSurveyTemplate: null, deletedReportTemplate: null };
  }

  const deletedInDb = await templateService.deleteTemplateRowByName(rowName);
  if (!deletedInDb) {
    await syncImportedTemplatesFromDatabase();
    return { deleted: false, deletedSurveyTemplate: null, deletedReportTemplate: null };
  }

  return removePairFromLocalCache(params);
};

export const deleteImportedTemplatePairByReportId = async (reportTemplateId: string) => {
  return deleteImportedTemplatePair({ reportTemplateId });
};

export const deleteImportedTemplatePairBySurveyId = async (surveyTemplateId: string) => {
  return deleteImportedTemplatePair({ surveyTemplateId });
};
