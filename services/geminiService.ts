import { GoogleGenAI, Type } from '@google/genai';
import { SurveyForm } from '../types';

export interface ReportResult {
  efficiencyScore: number;
  summary: string;
  energyStructureAnalysis: string;
  savingPotential: string;
  keyGaps: string[];
  recommendedModules: string[];
  hardwareRecommendations: string[];
  softwareRecommendations: string[];
  consultingRecommendations: string[];
  estimatedCostRange: string;
  roiAnalysis: string;
  nextSteps: string[];
}

const sanitizeArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
};

const sanitizeReport = (report: Partial<ReportResult>, fallback: ReportResult): ReportResult => {
  return {
    efficiencyScore: Number.isFinite(Number(report.efficiencyScore)) ? Number(report.efficiencyScore) : fallback.efficiencyScore,
    summary: report.summary || fallback.summary,
    energyStructureAnalysis: report.energyStructureAnalysis || fallback.energyStructureAnalysis,
    savingPotential: report.savingPotential || fallback.savingPotential,
    keyGaps: sanitizeArray(report.keyGaps).length ? sanitizeArray(report.keyGaps) : fallback.keyGaps,
    recommendedModules: sanitizeArray(report.recommendedModules).length ? sanitizeArray(report.recommendedModules) : fallback.recommendedModules,
    hardwareRecommendations: sanitizeArray(report.hardwareRecommendations).length ? sanitizeArray(report.hardwareRecommendations) : fallback.hardwareRecommendations,
    softwareRecommendations: sanitizeArray(report.softwareRecommendations).length ? sanitizeArray(report.softwareRecommendations) : fallback.softwareRecommendations,
    consultingRecommendations: sanitizeArray(report.consultingRecommendations).length ? sanitizeArray(report.consultingRecommendations) : fallback.consultingRecommendations,
    estimatedCostRange: report.estimatedCostRange || fallback.estimatedCostRange,
    roiAnalysis: report.roiAnalysis || fallback.roiAnalysis,
    nextSteps: sanitizeArray(report.nextSteps).length ? sanitizeArray(report.nextSteps) : fallback.nextSteps,
  };
};

export const generateEnergyReport = async (surveyForm: SurveyForm): Promise<ReportResult> => {
  const fallback = getFallbackReport(surveyForm);
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set, using fallback report.');
    return fallback;
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `你是一名资深能源管理系统(EMS)顾问。请针对以下售前调研数据输出结构化评估结论。

项目名称: ${surveyForm.projectName}
客户名称: ${surveyForm.customerName}
所属行业: ${surveyForm.industry}
所属区域: ${surveyForm.region}

调研数据(JSON):
${JSON.stringify(surveyForm.data || {}, null, 2)}

输出要求:
1) 必须输出 JSON。
2) 使用简体中文，结论可执行。
3) 体现行业针对性。
4) 给出软件、硬件、咨询建议与ROI初步估算。
5) 不要输出额外字段。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            efficiencyScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            energyStructureAnalysis: { type: Type.STRING },
            savingPotential: { type: Type.STRING },
            keyGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedModules: { type: Type.ARRAY, items: { type: Type.STRING } },
            hardwareRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            softwareRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            consultingRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedCostRange: { type: Type.STRING },
            roiAnalysis: { type: Type.STRING },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'efficiencyScore',
            'summary',
            'energyStructureAnalysis',
            'savingPotential',
            'keyGaps',
            'recommendedModules',
            'hardwareRecommendations',
            'softwareRecommendations',
            'consultingRecommendations',
            'estimatedCostRange',
            'roiAnalysis',
            'nextSteps',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}') as Partial<ReportResult>;
    return sanitizeReport(parsed, fallback);
  } catch (error) {
    console.error('Gemini API Error:', error);
    return fallback;
  }
};

const getFallbackReport = (form: SurveyForm): ReportResult => {
  return {
    efficiencyScore: 65,
    summary: `针对 ${form.customerName} 的 ${form.projectName} 项目，初步调研显示其在 ${form.industry} 领域存在较为明确的能效优化空间。`,
    energyStructureAnalysis: '当前以电力消耗为主，分项计量与实时监测能力不足，关键设备运行数据存在断层。',
    savingPotential: '预计通过平台建设与关键设备优化，可实现约 8% - 12% 的综合节能率。',
    keyGaps: [
      '缺少实时能耗监测与告警机制，主要依赖人工抄表',
      '重点用能设备缺少精细化控制策略',
      '能源管理制度与数据驱动分析能力有待完善',
    ],
    recommendedModules: ['能耗实时监测', '能效看板', '异常告警', '自动报表'],
    hardwareRecommendations: ['智能电表', '边缘网关', '温湿度/流量类传感器'],
    softwareRecommendations: ['EMS基础平台', '能效分析引擎', '移动端运维工具'],
    consultingRecommendations: ['能源审计服务', '节能诊断报告', '碳管理路径规划'],
    estimatedCostRange: '20万 - 50万人民币',
    roiAnalysis: '预计投资回收期 1.5 - 2.5 年。',
    nextSteps: ['现场点位复核', '通讯协议与网关方案确认', '输出详细实施方案与报价'],
  };
};
