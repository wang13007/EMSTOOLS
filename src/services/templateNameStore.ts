import { ReportTemplate, SurveyTemplate } from '../../types';

const SURVEY_TEMPLATE_NAME_KEY = 'ems_survey_template_name_overrides';
const REPORT_TEMPLATE_NAME_KEY = 'ems_report_template_name_overrides';
const REPORT_TEMPLATE_DESCRIPTION_KEY = 'ems_report_template_description_overrides';

type NameMap = Record<string, string>;

const canUseLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const readNameMap = (key: string): NameMap => {
  if (!canUseLocalStorage()) return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeNameMap = (key: string, map: NameMap) => {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // ignore write errors
  }
};

const sanitizeName = (name: string) => name.trim();

export const getSurveyTemplateNameById = (id: string, fallback: string) => {
  const map = readNameMap(SURVEY_TEMPLATE_NAME_KEY);
  return map[id] || fallback;
};

export const getReportTemplateNameById = (id: string, fallback: string) => {
  const map = readNameMap(REPORT_TEMPLATE_NAME_KEY);
  return map[id] || fallback;
};

export const getReportTemplateDescriptionById = (id: string, fallback: string) => {
  const map = readNameMap(REPORT_TEMPLATE_DESCRIPTION_KEY);
  return map[id] || fallback;
};

export const setSurveyTemplateNameById = (id: string, name: string) => {
  const map = readNameMap(SURVEY_TEMPLATE_NAME_KEY);
  const normalized = sanitizeName(name);
  if (normalized) {
    map[id] = normalized;
  } else {
    delete map[id];
  }
  writeNameMap(SURVEY_TEMPLATE_NAME_KEY, map);
};

export const setReportTemplateNameById = (id: string, name: string) => {
  const map = readNameMap(REPORT_TEMPLATE_NAME_KEY);
  const normalized = sanitizeName(name);
  if (normalized) {
    map[id] = normalized;
  } else {
    delete map[id];
  }
  writeNameMap(REPORT_TEMPLATE_NAME_KEY, map);
};

export const setReportTemplateDescriptionById = (id: string, description: string) => {
  const map = readNameMap(REPORT_TEMPLATE_DESCRIPTION_KEY);
  const normalized = sanitizeName(description);
  if (normalized) {
    map[id] = normalized;
  } else {
    delete map[id];
  }
  writeNameMap(REPORT_TEMPLATE_DESCRIPTION_KEY, map);
};

export const applySurveyTemplateNameOverrides = (templates: SurveyTemplate[]) => {
  return templates.map((item) => ({
    ...item,
    name: getSurveyTemplateNameById(item.id, item.name),
  }));
};

export const applyReportTemplateNameOverrides = (templates: ReportTemplate[]) => {
  return templates.map((item) => ({
    ...item,
    name: getReportTemplateNameById(item.id, item.name),
    description: getReportTemplateDescriptionById(item.id, item.description),
  }));
};
