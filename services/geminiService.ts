import { GoogleGenAI, Type } from '@google/genai';
import { SurveyForm } from '../types';

export interface ReportResult {
  efficiencyScore: number;
  summary: string;
  fullNarrative: string;
  energyStructureAnalysis: string;
  savingPotential: string;
  keyGaps: string[];
  detailedFindings: string[];
  recommendedModules: string[];
  hardwareRecommendations: string[];
  softwareRecommendations: string[];
  consultingRecommendations: string[];
  estimatedCostRange: string;
  roiAnalysis: string;
  nextSteps: string[];
  phasedRoadmap: string[];
  riskMitigations: string[];
  kpiSuggestions: string[];
  investmentBreakdown: string[];
  expectedBenefits: string[];
  operationMechanism: string[];
  dataGovernancePlan: string[];
}

const sanitizeArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
};

const dedupeStrings = (values: string[]) => {
  return Array.from(new Set(values.map((item) => String(item).trim()).filter(Boolean)));
};

const mergeArrayWithFallback = (value: unknown, fallback: string[], minCount: number): string[] => {
  const merged = dedupeStrings([...sanitizeArray(value), ...fallback]);
  if (merged.length >= minCount) {
    return merged;
  }
  return dedupeStrings([...merged, ...fallback]).slice(0, Math.max(minCount, fallback.length));
};

const pickLongText = (value: unknown, fallback: string, minLength: number) => {
  const normalized = String(value || '').trim();
  return normalized.length >= minLength ? normalized : fallback;
};

const sanitizeReport = (report: Partial<ReportResult>, fallback: ReportResult): ReportResult => {
  return {
    efficiencyScore: Number.isFinite(Number(report.efficiencyScore)) ? Number(report.efficiencyScore) : fallback.efficiencyScore,
    summary: pickLongText(report.summary, fallback.summary, 120),
    fullNarrative: pickLongText(report.fullNarrative, fallback.fullNarrative, 280),
    energyStructureAnalysis: pickLongText(report.energyStructureAnalysis, fallback.energyStructureAnalysis, 60),
    savingPotential: pickLongText(report.savingPotential, fallback.savingPotential, 60),
    keyGaps: mergeArrayWithFallback(report.keyGaps, fallback.keyGaps, 4),
    detailedFindings: mergeArrayWithFallback(report.detailedFindings, fallback.detailedFindings, 8),
    recommendedModules: mergeArrayWithFallback(report.recommendedModules, fallback.recommendedModules, 6),
    hardwareRecommendations: mergeArrayWithFallback(report.hardwareRecommendations, fallback.hardwareRecommendations, 5),
    softwareRecommendations: mergeArrayWithFallback(report.softwareRecommendations, fallback.softwareRecommendations, 5),
    consultingRecommendations: mergeArrayWithFallback(report.consultingRecommendations, fallback.consultingRecommendations, 5),
    estimatedCostRange: report.estimatedCostRange || fallback.estimatedCostRange,
    roiAnalysis: pickLongText(report.roiAnalysis, fallback.roiAnalysis, 40),
    nextSteps: mergeArrayWithFallback(report.nextSteps, fallback.nextSteps, 6),
    phasedRoadmap: mergeArrayWithFallback(report.phasedRoadmap, fallback.phasedRoadmap, 6),
    riskMitigations: mergeArrayWithFallback(report.riskMitigations, fallback.riskMitigations, 6),
    kpiSuggestions: mergeArrayWithFallback(report.kpiSuggestions, fallback.kpiSuggestions, 8),
    investmentBreakdown: mergeArrayWithFallback(report.investmentBreakdown, fallback.investmentBreakdown, 6),
    expectedBenefits: mergeArrayWithFallback(report.expectedBenefits, fallback.expectedBenefits, 6),
    operationMechanism: mergeArrayWithFallback(report.operationMechanism, fallback.operationMechanism, 6),
    dataGovernancePlan: mergeArrayWithFallback(report.dataGovernancePlan, fallback.dataGovernancePlan, 6),
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
5) summary 至少 180 字，fullNarrative 至少 600 字。
6) 所有数组字段都给出充分内容，避免空泛表达：detailedFindings≥8、phasedRoadmap≥6、riskMitigations≥6、kpiSuggestions≥8、investmentBreakdown≥6、expectedBenefits≥6、operationMechanism≥6、dataGovernancePlan≥6。
7) nextSteps 需要体现“本周、30天、90天、180天”里程碑。
8) 不要输出额外字段。`;

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
            fullNarrative: { type: Type.STRING },
            energyStructureAnalysis: { type: Type.STRING },
            savingPotential: { type: Type.STRING },
            keyGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            detailedFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedModules: { type: Type.ARRAY, items: { type: Type.STRING } },
            hardwareRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            softwareRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            consultingRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedCostRange: { type: Type.STRING },
            roiAnalysis: { type: Type.STRING },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            phasedRoadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskMitigations: { type: Type.ARRAY, items: { type: Type.STRING } },
            kpiSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            investmentBreakdown: { type: Type.ARRAY, items: { type: Type.STRING } },
            expectedBenefits: { type: Type.ARRAY, items: { type: Type.STRING } },
            operationMechanism: { type: Type.ARRAY, items: { type: Type.STRING } },
            dataGovernancePlan: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'efficiencyScore',
            'summary',
            'fullNarrative',
            'energyStructureAnalysis',
            'savingPotential',
            'keyGaps',
            'detailedFindings',
            'recommendedModules',
            'hardwareRecommendations',
            'softwareRecommendations',
            'consultingRecommendations',
            'estimatedCostRange',
            'roiAnalysis',
            'nextSteps',
            'phasedRoadmap',
            'riskMitigations',
            'kpiSuggestions',
            'investmentBreakdown',
            'expectedBenefits',
            'operationMechanism',
            'dataGovernancePlan',
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
  const customer = form.customerName || '客户方';
  const project = form.projectName || '本项目';
  const industry = form.industry || '目标行业';
  const region = form.region || '目标区域';

  return {
    efficiencyScore: 65,
    summary: `基于对 ${customer}${project} 的调研信息、业务访谈与设备侧数据线索进行综合研判，当前项目在“数据透明度、过程协同、设备健康管理、运营闭环”四个维度存在明显提升空间。${industry} 场景通常同时面临负荷波动、工况切换频繁、人工经验依赖度高的问题，而 ${region} 区域的能源价格与政策导向又会放大管理精细化差异带来的经营结果差距。整体判断：项目具备较好的数字化升级基础，若分阶段推进“计量补齐 + 平台治理 + 组织机制”组合策略，预计可在 6-12 个月内形成可量化的节能降本收益并建立长期优化能力。`,
    fullNarrative: `一、现状总览\n从当前调研资料看，${customer}${project} 在基础计量覆盖、关键设备能效基线、跨部门协同机制方面尚未形成统一标准，导致月度分析偏结果导向，难以及时定位异常原因。\n\n二、核心诊断\n在 ${industry} 典型场景中，能源管理价值不只体现在电费下降，还体现在产能稳定、质量一致性、设备寿命延长与合规风险降低。当前项目最关键的断点在于：缺少“从采集到决策再到执行复盘”的闭环机制。\n\n三、方案方向\n建议通过“数据底座、应用能力、运营机制”三条线并行推进。数据底座解决计量口径、时序质量、主数据统一；应用能力解决告警、分析、优化策略与报表效率；运营机制解决角色职责、流程节奏与绩效绑定。\n\n四、投入与回报逻辑\n投入侧主要由硬件改造、平台实施、集成联调、组织培训构成；回报侧包括直接节能收益、运维效率提升、故障损失减少、碳管理合规价值。项目 ROI 受实施范围和执行强度影响较大，建议先做试点验证后再扩面。\n\n五、落地建议\n以“先试点、后复制；先可视、后优化；先制度、后规模”为原则，优先选择高能耗且可控性强的系统作为首批场景，确保 90 天内形成可观测成果，再推动跨车间、跨区域复制。`,
    energyStructureAnalysis: '当前能源使用结构以电力为主，辅以水、气、蒸汽等介质；关键负荷集中在连续运行与高峰波动设备。由于分项计量粒度不足与设备分层管理缺失，能源流向、损耗点位、峰谷负荷响应特征尚未被充分量化，导致策略制定依赖经验判断。',
    savingPotential: '若按“计量完善 + 运行优化 + 设备改造 + 运营机制”四维联合推进，项目可预期实现 8%~15% 的综合节能空间，其中 3%~5% 可通过精细化运行与告警治理快速兑现，其余收益需要通过设备策略优化和持续运营逐步释放。',
    keyGaps: [
      '缺少实时能耗监测与告警机制，主要依赖人工抄表或离线汇总',
      '关键设备能效基线不清晰，设备运行工况与产量关系未建模',
      '跨部门协同机制不完整，能管、运维、生产间缺少统一节奏',
      '指标体系偏结果统计，缺少过程指标与责任到岗机制',
    ],
    detailedFindings: [
      '计量点位覆盖不完整，无法对重点工序进行分时段能效对标',
      '部分历史数据存在缺失与口径不一致，影响趋势研判可靠性',
      '缺少对异常能耗的自动归因流程，问题发现依赖人工经验',
      '高耗能设备的启停策略、联动策略尚未沉淀为标准规则',
      '峰谷电价策略未与生产计划深度联动，存在优化空间',
      '巡检与维保记录未形成结构化数据，难以支持预测性分析',
      '报表产出链路长，管理层获取关键信息存在时滞',
      '能源目标未分解到部门与班组，执行闭环不足',
    ],
    recommendedModules: ['能源总览看板', '分项计量中心', '异常告警中心', '设备能效分析', '电费优化分析', '经营报表中心', '碳排核算看板'],
    hardwareRecommendations: ['智能电表与多功能仪表', '边缘网关与协议转换设备', '流量/温湿度/压力传感器', '关键设备状态采集模块', '通信网络与安全隔离设备'],
    softwareRecommendations: ['EMS主平台', '规则与告警引擎', '能效分析与对标模型', '移动端巡检与工单协同', '驾驶舱与多角色报表系统'],
    consultingRecommendations: ['能源基线梳理与审计服务', '节能改造路线规划', '指标体系与运营机制设计', '组织赋能培训与复盘机制', '碳管理与合规咨询'],
    estimatedCostRange: '30万 - 120万人民币（视点位规模、系统集成深度、改造范围而定）',
    roiAnalysis: '预计投资回收期 1.2 - 2.8 年。若首批试点覆盖高能耗系统并保障运营执行，通常可在 6-9 个月观察到首轮财务收益拐点。',
    nextSteps: [
      '本周：完成现场点位与设备台账复核，明确首批试点范围与责任人',
      '本周：确认网络、协议、数据安全边界与系统集成清单',
      '30天：完成数据接入、基础看板与告警规则上线，形成第一版日报',
      '30天：建立周例会与问题闭环机制，按清单推进整改',
      '90天：上线能效分析模型与电费优化策略，形成阶段复盘报告',
      '180天：完成多场景复制与制度固化，进入持续优化阶段',
    ],
    phasedRoadmap: [
      '阶段1（0-30天）- 现状梳理：完成点位勘查、数据映射、主数据标准定义与试点范围确认',
      '阶段1（0-30天）- 快速上线：打通关键计量链路，交付总览看板与异常告警能力',
      '阶段2（31-90天）- 深化分析：建立能效对标、负荷分析、费用分析模型并持续校准',
      '阶段2（31-90天）- 机制固化：按周/月形成复盘例会、问题清单、整改闭环',
      '阶段3（91-180天）- 扩面复制：将试点经验复制到更多产线/区域/系统',
      '阶段3（91-180天）- 经营融合：将能效指标纳入经营例会与绩效考核',
    ],
    riskMitigations: [
      '数据质量风险：建立采集校验、缺失补录、异常值识别与审计追踪机制',
      '系统集成风险：采用分阶段联调与灰度发布，关键接口设置回滚策略',
      '组织协同风险：设置项目 PMO 与跨部门例会节奏，明确决策与升级路径',
      '执行持续性风险：将关键 KPI 与岗位职责绑定，建立奖惩与复盘机制',
      '安全合规风险：实施访问控制、日志留痕、网络隔离与敏感数据脱敏',
      '收益兑现风险：先行试点高价值场景，按月评估收益并动态调整策略',
    ],
    kpiSuggestions: [
      '综合能耗强度（kWh/单位产量）同比下降 5%-10%',
      '峰值负荷削减率达到 6%-12%',
      '异常能耗处置闭环时长降低 40% 以上',
      '关键设备有效运行效率提升 8% 以上',
      '能源数据完整率达到 98% 以上',
      '自动报表覆盖率达到 90% 以上',
      '运维人工统计工时减少 30% 以上',
      '碳排放核算时效从月级提升至周级',
    ],
    investmentBreakdown: [
      '计量与采集层投入：仪表、传感器、采集终端与安装调试费用',
      '网络与边缘层投入：网关、交换设备、协议接入与安全隔离建设',
      '平台与应用层投入：软件许可、开发配置、模型与规则建设',
      '系统集成投入：与现有 ERP/MES/BMS/SCADA 的接口联调与验收',
      '运营与服务投入：培训赋能、运维服务、持续优化咨询支持',
      '预备与风险预算：应对点位变更、现场改造与不可预见事项',
    ],
    expectedBenefits: [
      '直接收益：综合电费与能源成本下降，降低单位产值能耗',
      '间接收益：设备故障率下降，减少停机与质量波动损失',
      '管理收益：决策时效提升，经营层对能效状态可实时感知',
      '组织收益：跨部门协作标准化，减少信息传递与沟通成本',
      '合规收益：碳排核算与审计留痕能力提升，降低合规风险',
      '品牌收益：绿色运营能力提升，增强客户与市场认可度',
    ],
    operationMechanism: [
      '建立“日监控、周复盘、月经营”三级运营节奏',
      '形成告警分级处置标准与责任到岗机制',
      '建立能效专题例会机制，聚焦高价值问题闭环',
      '推动生产计划与能源策略协同，强化峰谷调度执行',
      '将节能项目纳入年度经营计划并设置里程碑审查',
      '通过可视化驾驶舱推动管理层持续关注与决策支持',
    ],
    dataGovernancePlan: [
      '统一设备、点位、组织、产线等主数据编码标准',
      '建立采集频率、时间戳、单位口径、缺失补录规范',
      '构建数据质量看板，持续监测完整性、准确性与及时性',
      '建立指标字典和口径手册，确保跨部门一致理解',
      '关键数据设置分级授权与操作审计，保障安全合规',
      '建立模型版本管理与效果评估机制，保障持续优化',
    ],
  };
};
