import { SurveyTemplate } from '../types';

const ENERGY_FIELD_ID = 'field_014_14';

export const EMS_PRESET_TEMPLATE: SurveyTemplate = {
  "id": "tpl-ems-presales-001",
  "name": "EMS售前调研标准模板",
  "industry": "通用",
  "createTime": "2026-02-26",
  "sections": [
    {
      "id": "section_01",
      "title": "企业&项目基本信息",
      "fields": [
        {
          "id": "field_001_1",
          "label": "企业名称",
          "type": "text",
          "required": true
        },
        {
          "id": "field_002_2",
          "label": "项目名称",
          "type": "text",
          "required": true
        },
        {
          "id": "field_003_3",
          "label": "项目地区",
          "type": "select",
          "required": true,
          "options": [
            "省-市-区，在数据字典中维护"
          ]
        },
        {
          "id": "field_004_4",
          "label": "详细地址",
          "type": "text",
          "required": true
        },
        {
          "id": "field_005_5",
          "label": "项目类型",
          "type": "select",
          "required": true,
          "options": [
            "工业园区",
            "单体工厂",
            "写字楼",
            "商业综合体",
            "商场",
            "酒店",
            "医院",
            "学校",
            "数据中心",
            "物流园区",
            "公共建筑",
            "其他"
          ]
        },
        {
          "id": "field_006_6",
          "label": "所属行业",
          "type": "select",
          "required": true,
          "options": [
            "电子",
            "机械",
            "汽车",
            "化工",
            "医药",
            "食品",
            "能源",
            "商业地产",
            "建筑",
            "IT",
            "其他"
          ]
        },
        {
          "id": "field_007_7",
          "label": "建筑面积",
          "type": "number",
          "required": false
        },
        {
          "id": "field_008_8",
          "label": "联系人",
          "type": "text",
          "required": true
        },
        {
          "id": "field_009_9",
          "label": "联系电话",
          "type": "text",
          "required": true
        },
        {
          "id": "field_010_10",
          "label": "联系邮箱",
          "type": "text",
          "required": false
        },
        {
          "id": "field_011_11",
          "label": "项目预算",
          "type": "select",
          "required": true,
          "options": [
            "<50万",
            "50-100万",
            "100-200万",
            "200-500万",
            "500-1000万",
            ">1000万",
            "尚未确定"
          ]
        },
        {
          "id": "field_012_12",
          "label": "期望上线时间",
          "type": "select",
          "required": true,
          "options": [
            "1-3个月",
            "3-6个月",
            ">6个月",
            "不确定"
          ]
        },
        {
          "id": "field_013_13",
          "label": "项目主要目标",
          "type": "multiselect",
          "required": true,
          "options": [
            "降本",
            "精细化管理",
            "分项计量",
            "运维优化",
            "节能改造",
            "碳排放",
            "合规",
            "对外报告"
          ]
        }
      ]
    },
    {
      "id": "section_02",
      "title": "用能总体情况",
      "fields": [
        {
          "id": ENERGY_FIELD_ID,
          "label": "使用的能源类型",
          "type": "multiselect",
          "required": true,
          "options": [
            "电力",
            "天然气",
            "蒸汽",
            "煤炭",
            "热水",
            "冷量",
            "压缩空气",
            "光伏",
            "储能",
            "其他"
          ]
        },
        {
          "id": "field_015_15",
          "label": "重点用能系统/设备",
          "type": "multiselect",
          "required": true,
          "options": [
            "中央空调",
            "冷站",
            "锅炉",
            "蒸汽系统",
            "压缩空气系统",
            "高耗能生产设备",
            "其他"
          ]
        }
      ]
    },
    {
      "id": "section_03",
      "title": "能源类型-电力",
      "visibleWhen": {
        "fieldId": ENERGY_FIELD_ID,
        "values": ["电力"]
      },
      "fields": [
        {
          "id": "field_016_15",
          "label": "年总用电量（kWh）",
          "type": "number",
          "required": true
        },
        {
          "id": "field_017_16",
          "label": "年总用电费用（万元）",
          "type": "number",
          "required": true
        },
        {
          "id": "field_018_17",
          "label": "数据采集方式",
          "type": "select",
          "required": true,
          "options": [
            "EMS直连",
            "第三方系统对接",
            "人工抄表"
          ]
        },
        {
          "id": "field_019_18",
          "label": "主要表具类型",
          "type": "multiselect",
          "required": true,
          "options": [
            "机械表",
            "智能电表",
            "多功能电表"
          ]
        },
        {
          "id": "field_020_19",
          "label": "表计通讯协议",
          "type": "multiselect",
          "required": true,
          "options": [
            "Modbus RTU",
            "Modbus TCP",
            "DL/T645",
            "BACnet",
            "其他"
          ]
        },
        {
          "id": "field_021_20",
          "label": "数据采集频率",
          "type": "select",
          "required": true,
          "options": [
            "实时(<1min)",
            "5min",
            "15min",
            "30min",
            "60min",
            "天"
          ]
        },
        {
          "id": "field_022_21",
          "label": "电力计量层级",
          "type": "multiselect",
          "required": true,
          "options": [
            "总表",
            "变压器",
            "馈线",
            "楼栋",
            "楼层",
            "租户",
            "系统级/设备级"
          ]
        },
        {
          "id": "field_023_22",
          "label": "是否区分峰平谷",
          "type": "select",
          "required": true,
          "options": [
            "是",
            "否"
          ]
        },
        {
          "id": "field_024_23",
          "label": "是否存在自发",
          "type": "select",
          "required": true,
          "options": [
            "无",
            "光伏",
            "燃油发电",
            "其他"
          ]
        },
        {
          "id": "field_025_24",
          "label": "是否存在手工抄表",
          "type": "select",
          "required": true,
          "options": [
            "全部手工",
            "部分手工",
            "全自动",
            "不清楚"
          ]
        },
        {
          "id": "field_026_25",
          "label": "手工抄表频率",
          "type": "select",
          "required": true,
          "options": [
            "实时",
            "日",
            "周",
            "月",
            "不固定"
          ]
        },
        {
          "id": "field_027_26",
          "label": "历史数据年限",
          "type": "select",
          "required": true,
          "options": [
            "≥3年",
            "1-3年",
            "<1年",
            "没有",
            "不清楚"
          ]
        },
        {
          "id": "field_028_27",
          "label": "是否可导出历史数据",
          "type": "select",
          "required": true,
          "options": [
            "是",
            "否",
            "不清楚"
          ]
        },
        {
          "id": "field_029_28",
          "label": "是否有电力系统接线图",
          "type": "select",
          "required": true,
          "options": [
            "是",
            "否",
            "不清楚"
          ]
        },
        {
          "id": "field_030_29",
          "label": "核心功能诉求",
          "type": "multiselect",
          "required": true,
          "options": [
            "能耗分项",
            "负荷分析",
            "电费分析",
            "异常用电",
            "对标分析",
            "节能评估"
          ]
        }
      ]
    },
    {
      "id": "section_04",
      "title": "能源类型-光伏",
      "visibleWhen": {
        "fieldId": ENERGY_FIELD_ID,
        "values": ["光伏"]
      },
      "fields": [
        {
          "id": "field_031_30",
          "label": "是否已投产",
          "type": "select",
          "required": true,
          "options": [
            "是",
            "否"
          ]
        },
        {
          "id": "field_032_32",
          "label": "光伏站点数量",
          "type": "text",
          "required": true
        },
        {
          "id": "field_033_31",
          "label": "总装机容量（kWp）",
          "type": "number",
          "required": true
        },
        {
          "id": "field_034_32",
          "label": "数据采集方式",
          "type": "select",
          "required": true,
          "options": [
            "逆变器直连",
            "第三方平台",
            "人工"
          ]
        },
        {
          "id": "field_035_33",
          "label": "数据采集频率",
          "type": "select",
          "required": true,
          "options": [
            "实时",
            "5min",
            "15min",
            "日"
          ]
        },
        {
          "id": "field_036_34",
          "label": "是否采集辐照度",
          "type": "select",
          "required": true,
          "options": [
            "是",
            "否"
          ]
        },
        {
          "id": "field_037_37",
          "label": "光伏发电使用",
          "type": "multiselect",
          "required": true,
          "options": [
            "自用、并网"
          ]
        },
        {
          "id": "field_038_35",
          "label": "核心功能诉求",
          "type": "multiselect",
          "required": true,
          "options": [
            "发电量",
            "自用率",
            "消纳率",
            "发电效率",
            "减排量"
          ]
        }
      ]
    },
    {
      "id": "section_06",
      "title": "能源类型-水/热水",
      "visibleWhen": {
        "fieldId": ENERGY_FIELD_ID,
        "values": ["热水"]
      },
      "fields": [
        {
          "id": "field_039_37",
          "label": "年总用水量（吨）",
          "type": "number",
          "required": true
        },
        {
          "id": "field_040_38",
          "label": "年总用水费用（万元）",
          "type": "number",
          "required": true
        },
        {
          "id": "field_041_39",
          "label": "数据采集方式",
          "type": "select",
          "required": true,
          "options": [
            "EMS直连",
            "第三方系统对接",
            "人工抄表"
          ]
        },
        {
          "id": "field_042_40",
          "label": "主要表具类型",
          "type": "multiselect",
          "required": true,
          "options": [
            "智能水表",
            "机械水表"
          ]
        },
        {
          "id": "field_043_41",
          "label": "表计通讯协议",
          "type": "multiselect",
          "required": true,
          "options": [
            "Modbus RTU",
            "Modbus TCP",
            "DL/T645",
            "BACnet",
            "其他"
          ]
        },
        {
          "id": "field_044_42",
          "label": "数据采集频率",
          "type": "select",
          "required": true,
          "options": [
            "实时(<1min)",
            "5min",
            "15min",
            "30min",
            "60min",
            "天"
          ]
        },
        {
          "id": "field_045_43",
          "label": "水表覆盖层级",
          "type": "multiselect",
          "required": true,
          "options": [
            "总表",
            "楼栋",
            "功能区",
            "设备"
          ]
        },
        {
          "id": "field_046_44",
          "label": "是否区分用水类型",
          "type": "multiselect",
          "required": true,
          "options": [
            "生活用水",
            "工艺用水",
            "冷凝用水",
            "绿化"
          ]
        },
        {
          "id": "field_047_45",
          "label": "核心功能诉求",
          "type": "multiselect",
          "required": true,
          "options": [
            "用水分析",
            "漏损分析",
            "预算管理"
          ]
        }
      ]
    },
    {
      "id": "section_07",
      "title": "能源类型-天然气",
      "visibleWhen": {
        "fieldId": ENERGY_FIELD_ID,
        "values": ["天然气"]
      },
      "fields": [
        {
          "id": "field_048_46",
          "label": "年总用天然气（m³）",
          "type": "number",
          "required": true
        },
        {
          "id": "field_049_47",
          "label": "年总用天然气费用（万元）",
          "type": "number",
          "required": true
        },
        {
          "id": "field_050_48",
          "label": "数据采集方式",
          "type": "select",
          "required": true,
          "options": [
            "EMS直连",
            "第三方系统对接",
            "人工抄表"
          ]
        },
        {
          "id": "field_051_49",
          "label": "主要表具类型",
          "type": "multiselect",
          "required": true,
          "options": [
            "智能气表",
            "机械气表"
          ]
        },
        {
          "id": "field_052_50",
          "label": "表计通讯协议",
          "type": "multiselect",
          "required": true,
          "options": [
            "Modbus RTU",
            "Modbus TCP",
            "DL/T645",
            "BACnet",
            "其他"
          ]
        },
        {
          "id": "field_053_51",
          "label": "数据采集频率",
          "type": "select",
          "required": true,
          "options": [
            "实时(<1min)",
            "5min",
            "15min",
            "30min",
            "60min",
            "天"
          ]
        },
        {
          "id": "field_054_52",
          "label": "用气主要用途",
          "type": "multiselect",
          "required": true,
          "options": [
            "锅炉",
            "食堂",
            "工艺",
            "其他"
          ]
        },
        {
          "id": "field_055_53",
          "label": "是否区分用水类型",
          "type": "multiselect",
          "required": true,
          "options": [
            "生活用水",
            "工艺用水",
            "冷凝用水",
            "绿化"
          ]
        },
        {
          "id": "field_056_54",
          "label": "核心功能诉求",
          "type": "textarea",
          "required": true
        }
      ]
    },
    {
      "id": "section_08",
      "title": "能源类型-蒸汽",
      "visibleWhen": {
        "fieldId": ENERGY_FIELD_ID,
        "values": ["蒸汽"]
      },
      "fields": [
        {
          "id": "field_057_55",
          "label": "年总用蒸汽（m³）",
          "type": "number",
          "required": true
        },
        {
          "id": "field_058_56",
          "label": "年总用蒸汽费用（万元）",
          "type": "number",
          "required": true
        },
        {
          "id": "field_059_57",
          "label": "数据采集方式",
          "type": "select",
          "required": true,
          "options": [
            "EMS直连",
            "第三方系统对接",
            "人工抄表"
          ]
        },
        {
          "id": "field_060_58",
          "label": "主要表具类型",
          "type": "multiselect",
          "required": true,
          "options": [
            "智能气表",
            "机械气表"
          ]
        },
        {
          "id": "field_061_59",
          "label": "表计通讯协议",
          "type": "multiselect",
          "required": true,
          "options": [
            "Modbus RTU",
            "Modbus TCP",
            "DL/T645",
            "BACnet",
            "其他"
          ]
        },
        {
          "id": "field_062_60",
          "label": "数据采集频率",
          "type": "select",
          "required": true,
          "options": [
            "实时(<1min)",
            "5min",
            "15min",
            "30min",
            "60min",
            "天"
          ]
        },
        {
          "id": "field_063_61",
          "label": "用气主要用途",
          "type": "multiselect",
          "required": true,
          "options": [
            "锅炉",
            "食堂",
            "工艺",
            "其他"
          ]
        },
        {
          "id": "field_064_62",
          "label": "是否区分用水类型",
          "type": "multiselect",
          "required": true,
          "options": [
            "生活用水",
            "工艺用水",
            "冷凝用水",
            "绿化"
          ]
        },
        {
          "id": "field_065_63",
          "label": "核心功能诉求",
          "type": "textarea",
          "required": true
        }
      ]
    },
    {
      "id": "section_12",
      "title": "运行与管理模式",
      "fields": [
        {
          "id": "field_066_71",
          "label": "是否有能源管理人员",
          "type": "select",
          "required": true,
          "options": [
            "专职",
            "兼职",
            "没有"
          ]
        },
        {
          "id": "field_067_72",
          "label": "是否设定能耗KPI",
          "type": "select",
          "required": true,
          "options": [
            "是",
            "否"
          ]
        },
        {
          "id": "field_068_73",
          "label": "能源用量分析频率",
          "type": "select",
          "required": true,
          "options": [
            "实时",
            "日",
            "周",
            "月",
            "不定期",
            "从不"
          ]
        },
        {
          "id": "field_069_74",
          "label": "是否定期输出报告",
          "type": "select",
          "required": true,
          "options": [
            "是",
            "否"
          ]
        },
        {
          "id": "field_070_75",
          "label": "当前主要管理痛点",
          "type": "multiselect",
          "required": true,
          "options": [
            "看不清",
            "不准",
            "不及时",
            "难定位浪废",
            "难对标",
            "无考核",
            "报表成本高"
          ]
        }
      ]
    },
    {
      "id": "section_13",
      "title": "碳管理",
      "fields": [
        {
          "id": "field_071_76",
          "label": "是否做过碳盘查",
          "type": "select",
          "required": true,
          "options": [
            "定期",
            "做过一次",
            "计划中",
            "没有"
          ]
        },
        {
          "id": "field_072_77",
          "label": "是否有碳减排目标",
          "type": "select",
          "required": true,
          "options": [
            "明确目标",
            "有方向无指标",
            "没有"
          ]
        },
        {
          "id": "field_073_78",
          "label": "覆盖排放范围",
          "type": "multiselect",
          "required": true,
          "options": [
            "Scope1",
            "Scope2",
            "Scope3",
            "不明确"
          ]
        },
        {
          "id": "field_074_79",
          "label": "是否需要碳排放报告",
          "type": "select",
          "required": true,
          "options": [
            "是",
            "否"
          ]
        },
        {
          "id": "field_075_80",
          "label": "是否考虑碳交易",
          "type": "select",
          "required": false,
          "options": [
            "已参与",
            "计划参与",
            "不考虑"
          ]
        }
      ]
    },
    {
      "id": "section_14",
      "title": "IT建设",
      "fields": [
        {
          "id": "field_076_81",
          "label": "现有系统",
          "type": "select",
          "required": true,
          "options": [
            "EMS",
            "BMS",
            "EMS+BMS",
            "SCADA",
            "无"
          ]
        },
        {
          "id": "field_077_82",
          "label": "是否支持第三方接口",
          "type": "select",
          "required": true,
          "options": [
            "标准接口",
            "定制接口",
            "不支持"
          ]
        },
        {
          "id": "field_078_83",
          "label": "是否允许云部署",
          "type": "select",
          "required": true,
          "options": [
            "公有云",
            "私有云",
            "本地部署",
            "不允许"
          ]
        },
        {
          "id": "field_079_84",
          "label": "是否有IT对接人",
          "type": "select",
          "required": true,
          "options": [
            "是",
            "否"
          ]
        }
      ]
    }
  ]
} as SurveyTemplate;

export const SURVEY_TEMPLATES: SurveyTemplate[] = [EMS_PRESET_TEMPLATE];
