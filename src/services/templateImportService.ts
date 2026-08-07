import { GoogleGenAI, Type } from '@google/genai';
import JSZip from 'jszip';
import { ReportTemplate, SurveyField, SurveySection, SurveyTemplate } from '../../types';
import { buildImportedTemplateId } from './templateStore';

export type ImportedTemplateDraft = {
  reportTemplate: ReportTemplate;
  surveyTemplate: SurveyTemplate;
  sourceTextPreview: string;
  warnings: string[];
};

type SupportedFormat = 'pdf' | 'docx' | 'doc' | 'pptx' | 'ppt' | 'md' | 'html' | 'txt';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_PREVIEW_TEXT = 5000;
const MAX_AI_TEXT = 16000;

const getApiKey = () => (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();

const getFileExtension = (name: string) => {
  const idx = name.lastIndexOf('.');
  if (idx === -1) return '';
  return name.slice(idx + 1).toLowerCase();
};

const detectFormat = (file: File): SupportedFormat | null => {
  const ext = getFileExtension(file.name);
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'doc') return 'doc';
  if (ext === 'pptx') return 'pptx';
  if (ext === 'ppt') return 'ppt';
  if (ext === 'md' || ext === 'markdown') return 'md';
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'txt') return 'txt';
  return null;
};

const readAsArrayBuffer = async (file: File) => file.arrayBuffer();

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item || '').trim()))).filter(Boolean);
};

const cleanText = (value: string) => {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const parseHtmlToText = (html: string) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return cleanText(doc.body?.innerText || doc.body?.textContent || '');
  } catch {
    return cleanText(html.replace(/<[^>]+>/g, ' '));
  }
};

const extractTextFromPptx = async (buffer: ArrayBuffer) => {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((fileName) => /^ppt\/slides\/slide\d+\.xml$/i.test(fileName))
    .sort((a, b) => {
      const aNo = Number((a.match(/slide(\d+)\.xml/i) || [])[1] || 0);
      const bNo = Number((b.match(/slide(\d+)\.xml/i) || [])[1] || 0);
      return aNo - bNo;
    });

  const slideTexts: string[] = [];
  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async('text');
    const parts = Array.from(xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/gi)).map((match) => match[1]);
    if (parts.length) slideTexts.push(parts.join('\n'));
  }
  return cleanText(slideTexts.join('\n\n'));
};

const extractTextFromPdf = async (buffer: ArrayBuffer) => {
  const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  try {
    if (pdfjsLib?.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
    }
  } catch {
    // use library fallback
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items || [])
      .map((item: any) => String(item?.str || '').trim())
      .filter(Boolean)
      .join(' ');
    if (text) pages.push(text);
  }

  return cleanText(pages.join('\n\n'));
};

const extractTextFromDocx = async (buffer: ArrayBuffer) => {
  const mammoth = (await import('mammoth/mammoth.browser')).default;
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return cleanText(result.value || '');
};

const extractTextFromBinaryFallback = (buffer: ArrayBuffer) => {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const raw = decoder.decode(buffer);
  const normalized = raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/[ ]{2,}/g, ' ');

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /[\u4e00-\u9fa5a-zA-Z0-9]/.test(line))
    .slice(0, 700);

  return cleanText(lines.join('\n'));
};

const extractTextByFormat = async (file: File, format: SupportedFormat) => {
  if (format === 'md' || format === 'txt') {
    return cleanText(await file.text());
  }
  if (format === 'html') {
    return parseHtmlToText(await file.text());
  }

  const buffer = await readAsArrayBuffer(file);
  if (format === 'pdf') return extractTextFromPdf(buffer);
  if (format === 'docx') return extractTextFromDocx(buffer);
  if (format === 'pptx') return extractTextFromPptx(buffer);
  if (format === 'doc' || format === 'ppt') return extractTextFromBinaryFallback(buffer);

  return cleanText(await new File([buffer], file.name, { type: file.type }).text());
};

const toSafeLines = (text: string) => {
  return cleanText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};

const stripLinePrefix = (line: string) => {
  return String(line || '')
    .replace(/^[\-*•\d\.、)）\s]+/, '')
    .replace(/^第[一二三四五六七八九十\d]+[章节部分条项、.．)）\s]*/, '')
    .trim();
};

const splitLineToQuestionCandidates = (line: string) => {
  const stripped = stripLinePrefix(line);
  if (!stripped) return [] as string[];

  const normalized = stripped.replace(/[：:]\s*$/, '').trim();
  if (!normalized) return [];

  const splitByPunc = normalized
    .split(/[；;。\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);

  if (splitByPunc.length === 0) return [normalized];
  if (splitByPunc.length === 1) return splitByPunc;

  return splitByPunc.filter((item) => item.length >= 2 && item.length <= 120);
};

const parseOptionsFromLine = (line: string) => {
  const source = String(line || '');
  const direct = source.match(/(?:选项|可选项|可选范围|候选值|取值范围)\s*[：:]\s*([^\n]+)/i)?.[1];
  const bracket = source.match(/[\[【（(]([^\]】）)]{3,120})[\]】）)]/)?.[1];
  const raw = direct || bracket || '';
  if (!raw) return [] as string[];

  return Array.from(new Set(raw.split(/[、,，;；|\/]/g).map((item) => item.trim()).filter(Boolean)));
};

const inferFieldType = (line: string): SurveyField['type'] => {
  const source = String(line || '').toLowerCase();

  if (/(可多选|多选|可选择多个|勾选多项|可复选|multi-select|multiselect)/.test(source)) return 'multiselect';
  if (/(是否|有无|单选|请选择|下拉|类别|类型|等级|状态|优先级|档位|范围)/.test(source)) return 'select';
  if (/(数量|金额|成本|费用|单价|温度|压力|面积|时长|百分比|占比|kwh|kw|万元|元|kg|吨|m2|㎡|%)/.test(source)) return 'number';
  if (/(描述|说明|原因|措施|建议|备注|现状|问题|方案|背景|目标|计划|分析)/.test(source)) return 'textarea';

  return 'text';
};

const buildDefaultOptions = (label: string, type: SurveyField['type']) => {
  if (type !== 'select' && type !== 'multiselect') return undefined;

  const source = String(label || '').toLowerCase();
  if (/(是否|有无|启用|开关|符合)/.test(source)) return ['是', '否'];
  if (/(等级|级别|评分|评估|优先级)/.test(source)) return ['高', '中', '低'];
  if (/(状态|进度)/.test(source)) return ['未开始', '进行中', '已完成'];
  if (/(周期|频率)/.test(source)) return ['每日', '每周', '每月', '每年'];

  return ['选项A', '选项B'];
};

const toFieldLabel = (line: string, index: number) => {
  const cleaned = stripLinePrefix(line)
    .replace(/[：:]\s*$/, '')
    .trim();
  return cleaned || `问题${index + 1}`;
};

const toFieldId = (sectionIndex: number, fieldIndex: number) =>
  `field_${String(sectionIndex + 1).padStart(3, '0')}_${String(fieldIndex + 1).padStart(3, '0')}`;

const isHeading = (line: string) =>
  /^(#\s+|##\s+|###\s+|第[一二三四五六七八九十\d]+[章节部分]|[一二三四五六七八九十\d]+[、.．])/.test(line);

const chunkByHeadings = (lines: string[]) => {
  const chunks: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;

  lines.forEach((line) => {
    if (isHeading(line)) {
      if (current) chunks.push(current);
      current = { title: line.replace(/^#+\s*/, '').trim(), lines: [] };
      return;
    }

    if (!current) current = { title: '项目概况', lines: [] };
    current.lines.push(line);
  });

  if (current) chunks.push(current);
  return chunks.length ? chunks : [{ title: '项目概况', lines }];
};

const buildDetailedFallbackFields = (sectionTitle: string, sectionIndex: number): SurveyField[] => {
  const lower = String(sectionTitle || '').toLowerCase();
  const seeds: Array<{ label: string; type: SurveyField['type']; required?: boolean }> = [];

  if (/(企业|项目|基础|概况|背景)/.test(lower)) {
    seeds.push(
      { label: '企业/项目名称', type: 'text', required: true },
      { label: '所属行业', type: 'select', required: true },
      { label: '所在区域', type: 'select', required: true },
      { label: '项目背景说明', type: 'textarea', required: true },
      { label: '项目联系人', type: 'text' },
    );
  } else if (/(目标|预算|计划|里程碑)/.test(lower)) {
    seeds.push(
      { label: '项目目标描述', type: 'textarea', required: true },
      { label: '预算金额(万元)', type: 'number', required: true },
      { label: '上线周期', type: 'select', required: true },
      { label: '优先级', type: 'select' },
      { label: '约束条件说明', type: 'textarea' },
    );
  } else if (/(能源|能耗|用能|设备|系统)/.test(lower)) {
    seeds.push(
      { label: '能源类型', type: 'multiselect', required: true },
      { label: '年度总能耗(kWh)', type: 'number', required: true },
      { label: '年度总费用(万元)', type: 'number', required: true },
      { label: '关键设备清单', type: 'textarea', required: true },
      { label: '数据采集方式', type: 'select' },
    );
  } else if (/(问题|痛点|风险|挑战)/.test(lower)) {
    seeds.push(
      { label: '关键问题描述', type: 'textarea', required: true },
      { label: '影响范围', type: 'select', required: true },
      { label: '风险等级', type: 'select', required: true },
      { label: '当前处理状态', type: 'select' },
      { label: '改进建议', type: 'textarea' },
    );
  } else {
    seeds.push(
      { label: `${sectionTitle}现状描述`, type: 'textarea', required: true },
      { label: `${sectionTitle}关键指标`, type: 'number' },
      { label: `${sectionTitle}类型`, type: 'select' },
      { label: `${sectionTitle}是否已落地`, type: 'select' },
      { label: `${sectionTitle}补充说明`, type: 'textarea' },
    );
  }

  return seeds.map((seed, index) => ({
    id: toFieldId(sectionIndex, index),
    label: seed.label,
    type: seed.type,
    required: seed.required ?? index < 2,
    options: buildDefaultOptions(seed.label, seed.type),
    placeholder: `请填写${seed.label}`,
  }));
};

const heuristicallyBuildTemplates = (file: File, extractedText: string): ImportedTemplateDraft => {
  const lines = toSafeLines(extractedText);
  const title = lines[0] || file.name.replace(/\.[^.]+$/, '');
  const chunks = chunkByHeadings(lines.slice(0, 700));
  const surveyTemplateId = buildImportedTemplateId('survey');
  const reportTemplateId = buildImportedTemplateId('report');
  const warnings: string[] = [];

  const surveySections: SurveySection[] = chunks.slice(0, 15).map((chunk, sectionIndex) => {
    const lineCandidates = chunk.lines.filter((line) => line.length >= 4 && line.length <= 160).slice(0, 40);
    const questionCandidates = Array.from(
      new Set(
        lineCandidates
          .flatMap((line) => splitLineToQuestionCandidates(line))
          .map((item) => item.trim())
          .filter((item) => item.length >= 2 && item.length <= 90)
      )
    ).slice(0, 16);

    const fields: SurveyField[] = questionCandidates.map((candidate, fieldIndex) => {
      const label = toFieldLabel(candidate, fieldIndex);
      const type = inferFieldType(candidate);
      const parsedOptions = parseOptionsFromLine(candidate);

      return {
        id: toFieldId(sectionIndex, fieldIndex),
        label,
        type,
        options: parsedOptions.length ? parsedOptions : buildDefaultOptions(label, type),
        required: fieldIndex < 3,
        placeholder: `请填写${label}`,
      };
    });

    return {
      id: `section_${sectionIndex + 1}`,
      title: chunk.title || `章节${sectionIndex + 1}`,
      fields: fields.length ? fields : buildDetailedFallbackFields(chunk.title, sectionIndex),
    };
  });

  if (!surveySections.length) {
    warnings.push('未能识别清晰章节，已按通用详细结构自动生成模板。');
    surveySections.push({
      id: 'section_1',
      title: '项目基础信息',
      fields: buildDetailedFallbackFields('项目基础信息', 0),
    });
  }

  const reportSections = surveySections.map((section) => section.title);
  const reportContent = [
    `# ${title}报告模板`,
    ...surveySections.map((section) =>
      [
        `## ${section.title}`,
        ...section.fields.map((field) => `- ${field.label}：{{${field.id}}}`),
      ].join('\n')
    ),
    '',
    '## 自动生成说明',
    '该模板由文档导入自动拆解生成，建议预览并确认后再保存。',
  ].join('\n\n');

  return {
    reportTemplate: {
      id: reportTemplateId,
      name: `${title}报告模板`,
      version: 'v1.0',
      description: `由文档《${file.name}》自动解析生成`,
      sections: reportSections,
      content: reportContent,
      updatedAt: new Date().toISOString(),
      surveyTemplateId,
    },
    surveyTemplate: {
      id: surveyTemplateId,
      name: `${title}调研模板`,
      description: `由文档《${file.name}》自动解析生成的调研模板`,
      industry: '通用',
      reportTemplateId,
      sections: surveySections,
      createTime: new Date().toISOString(),
      readonlyContent: lines.slice(0, 160).join('\n'),
    },
    sourceTextPreview: lines.slice(0, 120).join('\n'),
    warnings,
  };
};

const normalizeFieldType = (value: unknown, fallbackLine: string): SurveyField['type'] => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'text') return 'text';
  if (raw === 'number') return 'number';
  if (raw === 'select') return 'select';
  if (raw === 'multiselect') return 'multiselect';
  if (raw === 'textarea') return 'textarea';
  return inferFieldType(fallbackLine);
};

const normalizeGeneratedField = (field: any, sectionIndex: number, fieldIndex: number): SurveyField => {
  const label = toFieldLabel(String(field?.label || ''), fieldIndex);
  const mergedLine = `${field?.type || ''} ${label}`.trim();
  const type = normalizeFieldType(field?.type, mergedLine);
  const options = toStringList(field?.options);

  return {
    id: String(field?.id || toFieldId(sectionIndex, fieldIndex)),
    label,
    type,
    options: options.length ? options : buildDefaultOptions(label, type),
    required: field?.required !== false,
    placeholder: field?.placeholder ? String(field.placeholder) : `请填写${label}`,
    visibleWhen:
      field?.visibleWhen && field.visibleWhen.fieldId
        ? {
            fieldId: String(field.visibleWhen.fieldId),
            values: toStringList(field.visibleWhen.values),
          }
        : undefined,
  };
};

const buildAutoReportContent = (name: string, sections: SurveySection[]) => {
  return [
    `# ${name}`,
    ...sections.map((section) =>
      [
        `## ${section.title}`,
        ...section.fields.map((field) => `- ${field.label}：{{${field.id}}}`),
      ].join('\n')
    ),
  ].join('\n\n');
};

const normalizeDraft = (file: File, raw: any, extractedText: string, warnings: string[]): ImportedTemplateDraft => {
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const surveyTemplateId = buildImportedTemplateId('survey');
  const reportTemplateId = buildImportedTemplateId('report');

  const surveySections: SurveySection[] = Array.isArray(raw?.surveyTemplate?.sections)
    ? raw.surveyTemplate.sections.map((section: any, sectionIndex: number) => {
        const title = String(section?.title || `章节${sectionIndex + 1}`).trim() || `章节${sectionIndex + 1}`;
        const normalizedFields: SurveyField[] = Array.isArray(section?.fields)
          ? section.fields
              .map((field: any, fieldIndex: number) => normalizeGeneratedField(field, sectionIndex, fieldIndex))
              .filter((field: SurveyField) => Boolean(field.label))
          : [];

        return {
          id: String(section?.id || `section_${sectionIndex + 1}`),
          title,
          fields: normalizedFields.length ? normalizedFields : buildDetailedFallbackFields(title, sectionIndex),
        };
      })
    : [];

  if (!surveySections.length || surveySections.every((section) => section.fields.length === 0)) {
    warnings.push('AI未识别到完整字段，已回退为规则拆解。');
    return heuristicallyBuildTemplates(file, extractedText);
  }

  const reportSections = Array.isArray(raw?.reportTemplate?.sections)
    ? raw.reportTemplate.sections.map((item: any) => String(item || '').trim()).filter(Boolean)
    : [];

  const reportName = String(raw?.reportTemplate?.name || `${baseName}报告模板`).trim() || `${baseName}报告模板`;
  const surveyName = String(raw?.surveyTemplate?.name || `${baseName}调研模板`).trim() || `${baseName}调研模板`;

  const generatedContent = String(raw?.reportTemplate?.content || '').trim();
  const content = generatedContent || buildAutoReportContent(reportName, surveySections);

  const reportDescription = String(raw?.reportTemplate?.description || `由文档《${file.name}》自动解析生成`).trim();
  const surveyDescription = String(raw?.surveyTemplate?.description || '').trim();

  return {
    reportTemplate: {
      id: reportTemplateId,
      name: reportName,
      version: String(raw?.reportTemplate?.version || 'v1.0'),
      description: reportDescription,
      sections: reportSections.length ? reportSections : surveySections.map((section) => section.title),
      content,
      updatedAt: new Date().toISOString(),
      surveyTemplateId,
    },
    surveyTemplate: {
      id: surveyTemplateId,
      name: surveyName,
      description: surveyDescription || undefined,
      industry: String(raw?.surveyTemplate?.industry || '通用').trim() || '通用',
      reportTemplateId,
      sections: surveySections,
      createTime: new Date().toISOString(),
      readonlyContent: extractedText.slice(0, MAX_PREVIEW_TEXT),
    },
    sourceTextPreview: extractedText.slice(0, MAX_PREVIEW_TEXT),
    warnings,
  };
};

const parseJsonSafely = (text: string) => {
  const raw = String(text || '').trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    const fenced = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    try {
      return JSON.parse(fenced);
    } catch {
      return null;
    }
  }
};

const tryGenerateByAi = async (file: File, extractedText: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const warnings: string[] = [];
  const trimmedText = extractedText.slice(0, MAX_AI_TEXT);

  if (extractedText.length > MAX_AI_TEXT) {
    warnings.push(`文档内容较长，已截取前 ${MAX_AI_TEXT} 字进行智能拆解。`);
  }

  const prompt = `你是能源管理售前模板专家。请根据输入文档内容，输出严格 JSON，拆解为：
1) reportTemplate（报告模板）
2) surveyTemplate（调研模板）

强约束：
- 每个字段必须包含：label、type、required。
- type 只能是：text、number、select、multiselect、textarea。
- 当 type=select 或 multiselect 时，必须尽量给出 options（至少2项）。
- 字段要拆得细致明确，不要把多个问题合并为一个字段。
- 报告 content 中尽量使用 {{field_id}} 占位符引用调研字段。
- 必须输出 reportTemplate.name 与 surveyTemplate.name。
- description 可选，但建议提供。`;

  const parts: any[] = [{ text: `${prompt}\n\n文档提取文本：\n${trimmedText || '（无可提取文本）'}` }];

  if (file.size <= MAX_FILE_SIZE_BYTES) {
    const buffer = await readAsArrayBuffer(file);
    parts.push({
      inlineData: {
        mimeType: file.type || 'application/octet-stream',
        data: arrayBufferToBase64(buffer),
      },
    });
  } else {
    warnings.push('文件大于 20MB，已跳过原始二进制，仅基于提取文本拆解。');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: parts,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reportTemplate: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              version: { type: Type.STRING },
              description: { type: Type.STRING },
              sections: { type: Type.ARRAY, items: { type: Type.STRING } },
              content: { type: Type.STRING },
            },
            required: ['name', 'sections', 'content'],
          },
          surveyTemplate: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              industry: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    fields: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          label: { type: Type.STRING },
                          type: { type: Type.STRING },
                          required: { type: Type.BOOLEAN },
                          placeholder: { type: Type.STRING },
                          options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['label', 'type', 'required'],
                      },
                    },
                  },
                  required: ['title', 'fields'],
                },
              },
            },
            required: ['name', 'sections'],
          },
        },
        required: ['reportTemplate', 'surveyTemplate'],
      },
    },
  });

  const parsed = parseJsonSafely(response.text || '');
  if (!parsed) {
    throw new Error('AI返回内容不是有效JSON');
  }

  return { parsed, warnings };
};

export const generateTemplateDraftFromFile = async (file: File): Promise<ImportedTemplateDraft> => {
  if (!file) throw new Error('未检测到上传文件。');
  if (file.size <= 0) throw new Error('上传文件为空，请重新选择。');

  const format = detectFormat(file);
  if (!format) {
    throw new Error('仅支持 Word、PDF、Markdown、PPT、HTML、TXT 格式文件。');
  }

  let extractedText = '';
  const warnings: string[] = [];

  try {
    extractedText = await extractTextByFormat(file, format);
  } catch (error) {
    warnings.push(`文档文本提取失败：${error instanceof Error ? error.message : '未知错误'}`);
  }

  try {
    const aiResult = await tryGenerateByAi(file, extractedText);
    if (aiResult?.parsed) {
      return normalizeDraft(file, aiResult.parsed, extractedText, [...warnings, ...aiResult.warnings]);
    }
  } catch (error) {
    warnings.push(`智能拆解失败，已回退为规则解析：${error instanceof Error ? error.message : '未知错误'}`);
  }

  if (!extractedText) {
    throw new Error('无法解析该文件内容。请尝试上传 docx/pptx/pdf/md/html/txt 文件，或配置 Gemini API Key 后重试。');
  }

  const heuristicDraft = heuristicallyBuildTemplates(file, extractedText);
  return {
    ...heuristicDraft,
    warnings: [...warnings, ...heuristicDraft.warnings],
  };
};
