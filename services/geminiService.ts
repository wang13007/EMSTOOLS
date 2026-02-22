
import { GoogleGenAI, Type } from "@google/genai";
import { SurveyForm } from "../types";

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

export const generateEnergyReport = async (surveyForm: SurveyForm): Promise<ReportResult> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set, using fallback report.");
    return getFallbackReport(surveyForm);
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `作为一名资深的能源管理系统 (EMS) 专家，请分析以下名为 "${surveyForm.projectName}" 的售前调研数据。
  该项目属于 "${surveyForm.industry}" 行业，位于 "${surveyForm.region}"。
  
  调研数据（JSON 格式）：
  ${JSON.stringify(surveyForm.data, null, 2)}
  
  请生成一份专业的能源评估报告和综合解决方案建议。
  要求：
  1. JSON 格式输出。
  2. 所有内容必须使用简体中文。
  3. 评估必须具有行业针对性（例如：制造业关注生产设备和空压机，商业综合体关注暖通和照明）。
  4. 给出具体的硬件、软件和咨询建议。
  
  输出字段说明：
  - efficiencyScore: 0-100 的数字，反映当前的能效管理成熟度。
  - summary: 调研发现的总体总结。
  - energyStructureAnalysis: 对客户能源结构的专业分析。
  - savingPotential: 节能潜力评估（如：预计可节能 10-15%）。
  - keyGaps: 识别出的关键差距或痛点。
  - recommendedModules: 建议的 EMS 功能模块。
  - hardwareRecommendations: 具体的硬件改造或新增建议（如：智能电表、网关）。
  - softwareRecommendations: 具体的软件功能建议（如：能效看板、负荷预测）。
  - consultingRecommendations: 咨询服务建议（如：能源审计、碳中和规划）。
  - estimatedCostRange: 预计投资规模。
  - roiAnalysis: 投资回报率 (ROI) 的初步估算。
  - nextSteps: 后续实施行动计划。`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
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
            "efficiencyScore", "summary", "energyStructureAnalysis", "savingPotential", 
            "keyGaps", "recommendedModules", "hardwareRecommendations", 
            "softwareRecommendations", "consultingRecommendations", 
            "estimatedCostRange", "roiAnalysis", "nextSteps"
          ]
        }
      }
    });

    return JSON.parse(response.text || '{}') as ReportResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return getFallbackReport(surveyForm);
  }
};

const getFallbackReport = (form: SurveyForm): ReportResult => {
  return {
    efficiencyScore: 65,
    summary: `针对 ${form.customerName} 的 ${form.projectName} 项目，初步调研显示其在 ${form.industry} 领域具有典型的能效提升空间。`,
    energyStructureAnalysis: "能源结构较为单一，主要依赖市电，缺乏可再生能源利用。计量体系尚不完善，存在数据孤岛。",
    savingPotential: "预计通过 EMS 系统优化和重点设备改造，可实现 8% - 12% 的综合节能率。",
    keyGaps: [
      "缺乏实时能耗监测手段，依赖人工抄表",
      "重点耗能设备（如暖通、空压机）缺乏精细化控制",
      "能源管理制度不健全，缺乏数据驱动的决策机制"
    ],
    recommendedModules: ["能耗实时监测", "能效看板", "异常告警", "自动报表"],
    hardwareRecommendations: ["智能多功能电表", "边缘计算网关", "温湿度传感器"],
    softwareRecommendations: ["EMS 基础平台", "能效分析引擎", "移动端运维助手"],
    consultingRecommendations: ["能源审计服务", "节能诊断报告"],
    estimatedCostRange: "20万 - 50万人民币",
    roiAnalysis: "预计投资回收期为 1.5 - 2.5 年。",
    nextSteps: [
      "现场详细点位勘察",
      "确定通讯协议及网关部署方案",
      "提交详细技术方案及报价"
    ]
  };
};
