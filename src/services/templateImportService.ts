import { GoogleGenAI, Type } from '@google/genai';
import JSZip from 'jszip';
import mammoth from 'mammoth/mammoth.browser';
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

const getApiKey = () => {
  return (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
};

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

const cleanText = (value: string) => {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item || '').trim()))).filter((item) => item.length > 0);
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
    if (parts.length) {
      slideTexts.push(parts.join('\n'));
    }
  }
  return cleanText(slideTexts.join('\n\n'));
};

const extractTextFromPdf = async (buffer: ArrayBuffer) => {
  const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  try {
    if (pdfjsLib?.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url,
      ).toString();
    }
  } catch {
    // ignore worker config issues and let library fallback
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
    .slice(0, 500);
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
  if (format === 'pdf') {
    return extractTextFromPdf(buffer);
  }
  if (format === 'docx') {
    return extractTextFromDocx(buffer);
  }
  if (format === 'pptx') {
    return extractTextFromPptx(buffer);
  }
  if (format === 'doc' || format === 'ppt') {
    return extractTextFromBinaryFallback(buffer);
  }
  return cleanText(await new File([buffer], file.name, { type: file.type }).text());
};

const toSafeLines = (text: string) => {
  return cleanText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};

const parseOptionsFromLine = (line: string) => {
  const grouped = line.match(/(?:选项|可选|范围|取值)[：:]\s*([^\n]+)/);
  const source = grouped?.[1] || '';
  if (!source) return [] as string[];
  return toStringList(source.split(/[、,/|，；;]/).map((item) => item.trim()));
};

const inferFieldType = (line: string): SurveyField['type'] => {
  const source = line.toLowerCase();
  if (/是否|有无|是\/否|yes\/no|开关/.test(source)) return 'select';
  if (/数量|金额|能耗|温度|压力|面积|时长|百分比|比例|kwh|kw|万元|元|吨|℃|%/.test(source)) return 'number';
  if (/描述|说明|原因|措施|建议|备注|现状|问题/.test(source)) return 'textarea';
  if (/类型|类别|等级|模式|档位|选项|范围/.test(source)) return 'select';
  return 'text';
};

const toFieldLabel = (line: string, index: number) => {
  const cleaned = line
    .replace(/^[\-*•\d\.\)）\s]+/, '')
    .replace(/^第[一二三四五六七八九十\d]+[项条部分章节、.．)\s]*/, '')
    .replace(/[：:]\s*$/, '')
    .trim();
  return cleaned || `问题${index + 1}`;
};

const toFieldId = (sectionIndex: number, fieldIndex: number) => {
  return `field_${String(sectionIndex + 1).padStart(3, '0')}_${String(fieldIndex + 1).padStart(3, '0')}`;
};

const toHeading = (line: string) => {
  return /^(#\s+|##\s+|###\s+|第[一二三四五六七八九十\d]+[章节部分、.]|[一二三四五六七八九十\d]+[、.．])/.test(line);
};

const chunkByHeadings = (lines: string[]) => {
  const chunks: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;

  lines.forEach((line) => {
    if (toHeading(line)) {
      if (current) chunks.push(current);
      current = {
        title: line.replace(/^#+\s*/, '').trim(),
        lines: [],
      };
      return;
    }
    if (!current) {
      current = { title: '项目概况', lines: [] };
    }
    current.lines.push(line);
  });

  if (current) chunks.push(current);
  return chunks.length ? chunks : [{ title: '项目概况', lines }];
};

const heuristicallyBuildTemplates = (file: File, extractedText: string): ImportedTemplateDraft => {
  const lines = toSafeLines(extractedText);
  const title = lines[0] || file.name.replace(/\.[^.]+$/, '');
  const chunks = chunkByHeadings(lines.slice(0, 400));
  const surveyTemplateId = buildImportedTemplateId('survey');
  const reportTemplateId = buildImportedTemplateId('report');
  const warnings: string[] = [];

  const surveySections: SurveySection[] = chunks.slice(0, 12).map((chunk, sectionIndex) => {
    const candidateLines = chunk.lines
      .filter((line) => line.length >= 4 && line.length <= 80)
      .slice(0, 10);
    const fieldLines = candidateLines.length ? candidateLines : [`${chunk.title}相关信息`, `${chunk.title}当前现状`, `${chunk.title}改进目标`];
    const fields: SurveyField[] = fieldLines.map((line, fieldIndex) => {
      const options = parseOptionsFromLine(line);
      const type = inferFieldType(line);
      return {
        id: toFieldId(sectionIndex, fieldIndex),
        label: toFieldLabel(line, fieldIndex),
        type,
        options: options.length ? options : (type === 'select' ? ['是', '否'] : undefined),
        required: fieldIndex < 2,
        placeholder: `请填写${toFieldLabel(line, fieldIndex)}`,
      };
    });

    return {
      id: `section_${sectionIndex + 1}`,
      title: chunk.title || `章节${sectionIndex + 1}`,
      fields,
    };
  });

  if (!surveySections.length) {
    warnings.push('未能从文档识别出清晰章节，已按通用调研结构生成。');
    surveySections.push({
      id: 'section_1',
      title: '项目基础信息',
      fields: [
        { id: 'field_001_001', label: '项目背景', type: 'textarea', required: true, placeholder: '请描述项目背景' },
        { id: 'field_001_002', label: '核心目标', type: 'textarea', required: true, placeholder: '请描述核心目标' },
      ],
    });
  }

  const reportSections = surveySections.map((section) => section.title);
  const reportContent = [
    `# ${title}报告模板`,
    ...surveySections.map((section) => {
      const linesInSection = [
        `## ${section.title}`,
        ...section.fields.map((field) => `- ${field.label}：{{${field.id}}}`),
      ];
      return linesInSection.join('\n');
    }),
    '',
    '## 自动生成说明',
    '该模板由文档导入自动拆解生成，建议预览后调整字段与章节。',
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
      industry: '通用',
      reportTemplateId,
      sections: surveySections,
      createTime: new Date().toISOString(),
      readonlyContent: lines.slice(0, 120).join('\n'),
    },
    sourceTextPreview: lines.slice(0, 80).join('\n'),
    warnings,
  };
};

const normalizeGeneratedField = (field: any, sectionIndex: number, fieldIndex: number): SurveyField => {
  const label = toFieldLabel(String(field?.label || ''), fieldIndex);
  const type = inferFieldType(`${field?.type || ''} ${label}`);
  const explicitType = String(field?.type || '').trim().toLowerCase();
  const finalType = explicitType
    ? (['text', 'number', 'select', 'multiselect', 'textarea'].includes(explicitType) ? explicitType as SurveyField['type'] : type)
    : type;
  const options = toStringList(field?.options);

  return {
    id: String(field?.id || toFieldId(sectionIndex, fieldIndex)),
    label,
    type: finalType,
    options: options.length ? options : (finalType === 'select' ? ['是', '否'] : undefined),
    required: field?.required !== false,
    placeholder: field?.placeholder ? String(field.placeholder) : `请填写${label}`,
  };
};

const normalizeDraft = (
  file: File,
  raw: any,
  extractedText: string,
  warnings: string[],
): ImportedTemplateDraft => {
  const surveyTemplateId = buildImportedTemplateId('survey');
  const reportTemplateId = buildImportedTemplateId('report');
  const surveySections: SurveySection[] = Array.isArray(raw?.surveyTemplate?.sections)
    ? raw.surveyTemplate.sections.map((section: any, sectionIndex: number) => ({
        id: String(section?.id || `section_${sectionIndex + 1}`),
        title: String(section?.title || `章节${sectionIndex + 1}`).trim() || `章节${sectionIndex + 1}`,
        fields: Array.isArray(section?.fields)
          ? section.fields.map((field: any, fieldIndex: number) => normalizeGeneratedField(field, sectionIndex, fieldIndex))
          : [],
      }))
    : [];

  if (!surveySections.length || surveySections.every((section) => section.fields.length === 0)) {
    warnings.push('智能解析未识别到完整字段，已切换为规则解析。');
    return heuristicallyBuildTemplates(file, extractedText);
  }

  const reportSections = Array.isArray(raw?.reportTemplate?.sections)
    ? raw.reportTemplate.sections.map((item: any) => String(item || '').trim()).filter(Boolean)
    : [];
  const inferredReportSections = reportSections.length ? reportSections : surveySections.map((section) => section.title);
  const generatedContent = String(raw?.reportTemplate?.content || '').trim();
  const content = generatedContent || [
    `# ${raw?.reportTemplate?.name || file.name}报告模板`,
    ...surveySections.map((section) =>
      [
        `## ${section.title}`,
        ...section.fields.map((field) => `- ${field.label}：{{${field.id}}}`),
      ].join('\n')),
  ].join('\n\n');

  return {
    reportTemplate: {
      id: reportTemplateId,
      name: String(raw?.reportTemplate?.name || `${file.name}报告模板`).trim() || `${file.name}报告模板`,
      version: String(raw?.reportTemplate?.version || 'v1.0'),
      description: String(raw?.reportTemplate?.description || `由文档《${file.name}》自动解析生成`).trim() || `由文档《${file.name}》自动解析生成`,
      sections: inferredReportSections,
      content,
      updatedAt: new Date().toISOString(),
      surveyTemplateId,
    },
    surveyTemplate: {
      id: surveyTemplateId,
      name: String(raw?.surveyTemplate?.name || `${file.name}调研模板`).trim() || `${file.name}调研模板`,
      industry: String(raw?.surveyTemplate?.industry || '通用').trim() || '通用',
      reportTemplateId,
      sections: surveySections,
      createTime: new Date().toISOString(),
      readonlyContent: extractedText.slice(0, 5000),
    },
    sourceTextPreview: extractedText.slice(0, 5000),
    warnings,
  };
};

const tryGenerateByAi = async (file: File, extractedText: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  const warnings: string[] = [];
  const maxText = 14000;
  const trimmedText = extractedText.slice(0, maxText);
  if (extractedText.length > maxText) {
    warnings.push('文档内容较长，已截取前 14000 字进行智能拆解。');
  }

  const prompt = `你是能源管理售前模板专家。请根据输入文档内容，拆解出：
1) 报告模板（报告章节+正文占位符）
2) 调研模板（章节+字段）

要求：
- 输出必须是 JSON，不要包含解释文字。
- 字段类型仅允许：text、number、select、multiselect、textarea。
- 报告正文 content 中尽量使用 {{field_id}} 占位符引用调研字段。
- sections/fields 必须结构完整。
- 使用简体中文。`;

  const parts: any[] = [{ text: `${prompt}\n\n文档提取文本：\n${trimmedText || '（无可提取文本）'}` }];

  if (file.size <= MAX_FILE_SIZE_BYTES) {
    const buffer = await readAsArrayBuffer(file);
    const mimeType = file.type || 'application/octet-stream';
    parts.push({
      inlineData: {
        mimeType,
        data: arrayBufferToBase64(buffer),
      },
    });
  } else {
    warnings.push('文件大于 20MB，已忽略原文件二进制，仅基于提取文本解析。');
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
            required: ['name', 'description', 'sections', 'content'],
          },
          surveyTemplate: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
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
                        required: ['label', 'type'],
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
  const parsed = JSON.parse(response.text || '{}');
  return { parsed, warnings };
};

export const generateTemplateDraftFromFile = async (file: File): Promise<ImportedTemplateDraft> => {
  if (!file) {
    throw new Error('未检测到上传文件。');
  }
  if (file.size <= 0) {
    throw new Error('上传文件为空，请重新选择。');
  }

  const format = detectFormat(file);
  if (!format) {
    throw new Error('仅支持 Word、PDF、Markdown、PPT、HTML 格式文件。');
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
    throw new Error('无法解析该文件内容。请尝试上传 docx/pptx/pdf/md/html 文件，或配置 Gemini API Key 后重试。');
  }
  const heuristicDraft = heuristicallyBuildTemplates(file, extractedText);
  return {
    ...heuristicDraft,
    warnings: [...warnings, ...heuristicDraft.warnings],
  };
};
