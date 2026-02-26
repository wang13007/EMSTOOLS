import { SurveyTemplate } from '../types';

export const EMS_PRESET_TEMPLATE: SurveyTemplate = {
  "id": "tpl-ems-presales-001",
  "name": "EMS\u552e\u524d\u8c03\u7814\u6807\u51c6\u6a21\u677f",
  "industry": "\u901a\u7528",
  "createTime": "2026-02-26",
  "sections": [
    {
      "id": "section_01",
      "title": "\u4f01\u4e1a&\u9879\u76ee\u57fa\u672c\u4fe1\u606f",
      "fields": [
        {
          "id": "field_001_1",
          "label": "\u4f01\u4e1a\u540d\u79f0",
          "type": "text",
          "required": true
        },
        {
          "id": "field_002_2",
          "label": "\u9879\u76ee\u540d\u79f0",
          "type": "text",
          "required": true
        },
        {
          "id": "field_003_3",
          "label": "\u9879\u76ee\u5730\u533a",
          "type": "select",
          "required": true,
          "options": [
            "\u7701-\u5e02-\u533a\uff0c\u5728\u6570\u636e\u5b57\u5178\u4e2d\u7ef4\u62a4"
          ]
        },
        {
          "id": "field_004_4",
          "label": "\u8be6\u7ec6\u5730\u5740",
          "type": "text",
          "required": true
        },
        {
          "id": "field_005_5",
          "label": "\u9879\u76ee\u7c7b\u578b",
          "type": "select",
          "required": true,
          "options": [
            "\u5de5\u4e1a\u56ed\u533a",
            "\u5355\u4f53\u5de5\u5382",
            "\u5199\u5b57\u697c",
            "\u5546\u4e1a\u7efc\u5408\u4f53",
            "\u5546\u573a",
            "\u9152\u5e97",
            "\u533b\u9662",
            "\u5b66\u6821",
            "\u6570\u636e\u4e2d\u5fc3",
            "\u7269\u6d41\u56ed\u533a",
            "\u516c\u5171\u5efa\u7b51",
            "\u5176\u4ed6"
          ]
        },
        {
          "id": "field_006_6",
          "label": "\u6240\u5c5e\u884c\u4e1a",
          "type": "select",
          "required": true,
          "options": [
            "\u7535\u5b50",
            "\u673a\u68b0",
            "\u6c7d\u8f66",
            "\u5316\u5de5",
            "\u533b\u836f",
            "\u98df\u54c1",
            "\u80fd\u6e90",
            "\u5546\u4e1a\u5730\u4ea7",
            "\u516c\u5efa",
            "IT",
            "\u5176\u4ed6"
          ]
        },
        {
          "id": "field_007_7",
          "label": "\u5efa\u7b51\u9762\u79ef",
          "type": "number",
          "required": false
        },
        {
          "id": "field_008_8",
          "label": "\u8054\u7cfb\u4eba",
          "type": "text",
          "required": true
        },
        {
          "id": "field_009_9",
          "label": "\u8054\u7cfb\u7535\u8bdd",
          "type": "text",
          "required": true
        },
        {
          "id": "field_010_10",
          "label": "\u8054\u7cfb\u90ae\u7bb1",
          "type": "text",
          "required": false
        },
        {
          "id": "field_011_11",
          "label": "\u9879\u76ee\u9884\u7b97",
          "type": "select",
          "required": true,
          "options": [
            "<50\u4e07",
            "50\u2013100\u4e07",
            "100\u2013200\u4e07",
            "200\u2013500\u4e07",
            "500\u20131000\u4e07",
            ">1000\u4e07",
            "\u6682\u672a\u786e\u5b9a"
          ]
        },
        {
          "id": "field_012_12",
          "label": "\u671f\u671b\u4e0a\u7ebf\u65f6\u95f4",
          "type": "select",
          "required": true,
          "options": [
            "1\u20133\u4e2a\u6708",
            "3\u20136\u4e2a\u6708",
            ">6\u4e2a\u6708",
            "\u4e0d\u786e\u5b9a"
          ]
        },
        {
          "id": "field_013_13",
          "label": "\u9879\u76ee\u4e3b\u8981\u76ee\u6807",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u964d\u672c",
            "\u7cbe\u7ec6\u5316\u7ba1\u7406",
            "\u5206\u9879\u8ba1\u91cf",
            "\u8fd0\u7ef4\u4f18\u5316",
            "\u8282\u80fd\u6539\u9020",
            "\u78b3\u6392\u653e",
            "\u5408\u89c4",
            "\u5bf9\u5916\u62a5\u8868"
          ]
        }
      ]
    },
    {
      "id": "section_02",
      "title": "\u7528\u80fd\u603b\u4f53\u60c5\u51b5",
      "fields": [
        {
          "id": "field_014_14",
          "label": "\u4f7f\u7528\u7684\u80fd\u6e90\u7c7b\u578b",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u7535\u529b",
            "\u5929\u7136\u6c14",
            "\u84b8\u6c7d",
            "\u67f4\u6cb9",
            "\u70ed\u6c34",
            "\u51b7\u91cf",
            "\u538b\u7f29\u7a7a\u6c14",
            "\u5149\u4f0f",
            "\u50a8\u80fd",
            "\u5176\u4ed6"
          ]
        },
        {
          "id": "field_015_15",
          "label": "\u91cd\u70b9\u7528\u80fd\u7cfb\u7edf/\u8bbe\u5907",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u4e2d\u592e\u7a7a\u8c03",
            "\u51b7\u7ad9",
            "\u9505\u7089",
            "\u84b8\u6c7d\u7cfb\u7edf",
            "\u538b\u7f29\u7a7a\u6c14\u7cfb\u7edf",
            "\u9ad8\u8017\u80fd\u751f\u4ea7\u8bbe\u5907",
            "\u5176\u4ed6"
          ]
        }
      ]
    },
    {
      "id": "section_03",
      "title": "\u80fd\u6e90\u7c7b\u578b-\u7535\u529b",
      "fields": [
        {
          "id": "field_016_15",
          "label": "\u5e74\u603b\u7528\u7535\u91cf\uff08kWh\uff09",
          "type": "number",
          "required": true
        },
        {
          "id": "field_017_16",
          "label": "\u5e74\u603b\u7528\u7535\u8d39\u7528\uff08\u4e07\u5143\uff09",
          "type": "number",
          "required": true
        },
        {
          "id": "field_018_17",
          "label": "\u6570\u636e\u91c7\u96c6\u65b9\u5f0f",
          "type": "select",
          "required": true,
          "options": [
            "EMS\u76f4\u8fde",
            "\u7b2c\u4e09\u65b9\u7cfb\u7edf\u5bf9\u63a5",
            "\u4eba\u5de5\u6284\u8868"
          ]
        },
        {
          "id": "field_019_18",
          "label": "\u4e3b\u8981\u8868\u5177\u7c7b\u578b",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u673a\u68b0\u8868",
            "\u667a\u80fd\u7535\u8868",
            "\u591a\u529f\u80fd\u7535\u8868"
          ]
        },
        {
          "id": "field_020_19",
          "label": "\u8868\u8ba1\u901a\u8baf\u534f\u8bae",
          "type": "multiselect",
          "required": true,
          "options": [
            "Modbus RTU",
            "Modbus TCP",
            "DL/T645",
            "BACnet",
            "\u5176\u4ed6"
          ]
        },
        {
          "id": "field_021_20",
          "label": "\u6570\u636e\u91c7\u96c6\u9891\u7387",
          "type": "select",
          "required": true,
          "options": [
            "\u5b9e\u65f6(<1min)",
            "5min",
            "15min",
            "30min",
            "60min",
            "\u5929"
          ]
        },
        {
          "id": "field_022_21",
          "label": "\u7535\u529b\u8ba1\u91cf\u5c42\u7ea7",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u603b\u8868",
            "\u53d8\u538b\u5668",
            "\u9988\u7ebf",
            "\u697c\u680b",
            "\u697c\u5c42",
            "\u79df\u6237",
            "\u7cfb\u7edf\u7ea7/\u8bbe\u5907\u7ea7"
          ]
        },
        {
          "id": "field_023_22",
          "label": "\u662f\u5426\u533a\u5206\u5cf0\u5e73\u8c37",
          "type": "select",
          "required": true,
          "options": [
            "\u662f",
            "\u5426"
          ]
        },
        {
          "id": "field_024_23",
          "label": "\u662f\u5426\u5b58\u5728\u81ea\u53d1\u7535",
          "type": "select",
          "required": true,
          "options": [
            "\u65e0",
            "\u5149\u4f0f",
            "\u67f4\u6cb9\u53d1\u7535",
            "\u5176\u4ed6"
          ]
        },
        {
          "id": "field_025_24",
          "label": "\u662f\u5426\u5b58\u5728\u624b\u5de5\u6284\u8868",
          "type": "select",
          "required": true,
          "options": [
            "\u5168\u90e8\u624b\u5de5",
            "\u90e8\u5206\u624b\u5de5",
            "\u5168\u81ea\u52a8",
            "\u4e0d\u6e05\u695a"
          ]
        },
        {
          "id": "field_026_25",
          "label": "\u624b\u5de5\u6284\u8868\u9891\u7387",
          "type": "select",
          "required": true,
          "options": [
            "\u5b9e\u65f6",
            "\u65e5",
            "\u5468",
            "\u6708",
            "\u4e0d\u56fa\u5b9a"
          ]
        },
        {
          "id": "field_027_26",
          "label": "\u5386\u53f2\u6570\u636e\u5e74\u9650",
          "type": "select",
          "required": true,
          "options": [
            "\u22653\u5e74",
            "1\u20133\u5e74",
            "<1\u5e74",
            "\u6ca1\u6709",
            "\u4e0d\u6e05\u695a"
          ]
        },
        {
          "id": "field_028_27",
          "label": "\u662f\u5426\u53ef\u5bfc\u51fa\u5386\u53f2\u6570\u636e",
          "type": "select",
          "required": true,
          "options": [
            "\u662f",
            "\u5426",
            "\u4e0d\u6e05\u695a"
          ]
        },
        {
          "id": "field_029_28",
          "label": "\u662f\u5426\u6709\u7535\u529b\u7cfb\u7edf\u63a5\u7ebf\u56fe",
          "type": "select",
          "required": true,
          "options": [
            "\u662f",
            "\u5426",
            "\u4e0d\u6e05\u695a"
          ]
        },
        {
          "id": "field_030_29",
          "label": "\u6838\u5fc3\u529f\u80fd\u8bc9\u6c42",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u80fd\u8017\u5206\u9879",
            "\u8d1f\u8377\u5206\u6790",
            "\u7535\u8d39\u5206\u6790",
            "\u5f02\u5e38\u7528\u7535",
            "\u5bf9\u6807\u5206\u6790",
            "\u8282\u80fd\u8bc4\u4f30"
          ]
        }
      ]
    },
    {
      "id": "section_04",
      "title": "\u80fd\u6e90\u7c7b\u578b-\u7535\u529b-\u5149\u4f0f",
      "fields": [
        {
          "id": "field_031_30",
          "label": "\u662f\u5426\u5df2\u6295\u8fd0",
          "type": "select",
          "required": true,
          "options": [
            "\u662f",
            "\u5426"
          ]
        },
        {
          "id": "field_032_32",
          "label": "\u5149\u4f0f\u7ad9\u70b9\u6570\u91cf",
          "type": "text",
          "required": true
        },
        {
          "id": "field_033_31",
          "label": "\u603b\u88c5\u673a\u5bb9\u91cf\uff08kWp\uff09",
          "type": "number",
          "required": true,
          "options": [
            "\u6570\u503c"
          ]
        },
        {
          "id": "field_034_32",
          "label": "\u6570\u636e\u91c7\u96c6\u65b9\u5f0f",
          "type": "select",
          "required": true,
          "options": [
            "\u9006\u53d8\u5668\u76f4\u8fde",
            "\u7b2c\u4e09\u65b9\u5e73\u53f0",
            "\u4eba\u5de5"
          ]
        },
        {
          "id": "field_035_33",
          "label": "\u6570\u636e\u91c7\u96c6\u9891\u7387",
          "type": "select",
          "required": true,
          "options": [
            "\u5b9e\u65f6",
            "5min",
            "15min",
            "\u65e5"
          ]
        },
        {
          "id": "field_036_34",
          "label": "\u662f\u5426\u91c7\u96c6\u8f90\u7167\u5ea6",
          "type": "select",
          "required": true,
          "options": [
            "\u662f",
            "\u5426"
          ]
        },
        {
          "id": "field_037_37",
          "label": "\u5149\u4f0f\u53d1\u7535\u4f7f\u7528",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u81ea\u7528\u3001\u5e76\u7f51"
          ]
        },
        {
          "id": "field_038_35",
          "label": "\u6838\u5fc3\u529f\u80fd\u8bc9\u6c42",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u53d1\u7535\u91cf",
            "\u81ea\u7528\u7387",
            "\u6d88\u7eb3\u7387",
            "\u53d1\u7535\u6548\u7387",
            "\u51cf\u78b3\u91cf"
          ]
        }
      ]
    },
    {
      "id": "section_06",
      "title": "\u80fd\u6e90\u7c7b\u578b-\u6c34",
      "fields": [
        {
          "id": "field_039_37",
          "label": "\u5e74\u603b\u7528\u6c34\u91cf\uff08\u5428\uff09",
          "type": "number",
          "required": true
        },
        {
          "id": "field_040_38",
          "label": "\u5e74\u603b\u7528\u6c34\u8d39\u7528\uff08\u4e07\u5143\uff09",
          "type": "number",
          "required": true
        },
        {
          "id": "field_041_39",
          "label": "\u6570\u636e\u91c7\u96c6\u65b9\u5f0f",
          "type": "select",
          "required": true,
          "options": [
            "EMS\u76f4\u8fde",
            "\u7b2c\u4e09\u65b9\u7cfb\u7edf\u5bf9\u63a5",
            "\u4eba\u5de5\u6284\u8868"
          ]
        },
        {
          "id": "field_042_40",
          "label": "\u4e3b\u8981\u8868\u5177\u7c7b\u578b",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u667a\u80fd\u6c34\u8868",
            "\u673a\u68b0\u6c34\u8868"
          ]
        },
        {
          "id": "field_043_41",
          "label": "\u8868\u8ba1\u901a\u8baf\u534f\u8bae",
          "type": "multiselect",
          "required": true,
          "options": [
            "Modbus RTU",
            "Modbus TCP",
            "DL/T645",
            "BACnet",
            "\u5176\u4ed6"
          ]
        },
        {
          "id": "field_044_42",
          "label": "\u6570\u636e\u91c7\u96c6\u9891\u7387",
          "type": "select",
          "required": true,
          "options": [
            "\u5b9e\u65f6(<1min)",
            "5min",
            "15min",
            "30min",
            "60min",
            "\u5929"
          ]
        },
        {
          "id": "field_045_43",
          "label": "\u6c34\u8868\u8986\u76d6\u5c42\u7ea7",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u603b\u8868",
            "\u697c\u680b",
            "\u529f\u80fd\u533a",
            "\u8bbe\u5907"
          ]
        },
        {
          "id": "field_046_44",
          "label": "\u662f\u5426\u533a\u5206\u7528\u6c34\u7c7b\u578b",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u751f\u6d3b\u7528\u6c34",
            "\u5de5\u827a\u7528\u6c34",
            "\u51b7\u5374\u7528\u6c34",
            "\u7eff\u5316"
          ]
        },
        {
          "id": "field_047_45",
          "label": "\u6838\u5fc3\u529f\u80fd\u8bc9\u6c42",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u7528\u6c34\u5206\u6790",
            "\u6f0f\u635f\u5206\u6790",
            "\u9884\u7b97\u7ba1\u7406"
          ]
        }
      ]
    },
    {
      "id": "section_07",
      "title": "\u80fd\u6e90\u7c7b\u578b-\u5929\u7136\u6c14",
      "fields": [
        {
          "id": "field_048_46",
          "label": "\u5e74\u603b\u7528\u5929\u7136\u6c14\uff08m\u00b3\uff09",
          "type": "number",
          "required": true
        },
        {
          "id": "field_049_47",
          "label": "\u5e74\u603b\u7528\u5929\u7136\u6c14\u8d39\u7528\uff08\u4e07\u5143\uff09",
          "type": "number",
          "required": true
        },
        {
          "id": "field_050_48",
          "label": "\u6570\u636e\u91c7\u96c6\u65b9\u5f0f",
          "type": "select",
          "required": true,
          "options": [
            "EMS\u76f4\u8fde",
            "\u7b2c\u4e09\u65b9\u7cfb\u7edf\u5bf9\u63a5",
            "\u4eba\u5de5\u6284\u8868"
          ]
        },
        {
          "id": "field_051_49",
          "label": "\u4e3b\u8981\u8868\u5177\u7c7b\u578b",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u667a\u80fd\u6c14\u8868",
            "\u673a\u68b0\u6c14\u8868"
          ]
        },
        {
          "id": "field_052_50",
          "label": "\u8868\u8ba1\u901a\u8baf\u534f\u8bae",
          "type": "multiselect",
          "required": true,
          "options": [
            "Modbus RTU",
            "Modbus TCP",
            "DL/T645",
            "BACnet",
            "\u5176\u4ed6"
          ]
        },
        {
          "id": "field_053_51",
          "label": "\u6570\u636e\u91c7\u96c6\u9891\u7387",
          "type": "select",
          "required": true,
          "options": [
            "\u5b9e\u65f6(<1min)",
            "5min",
            "15min",
            "30min",
            "60min",
            "\u5929"
          ]
        },
        {
          "id": "field_054_52",
          "label": "\u7528\u6c14\u4e3b\u8981\u7528\u9014",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u9505\u7089",
            "\u98df\u5802",
            "\u5de5\u827a",
            "\u5176\u4ed6"
          ]
        },
        {
          "id": "field_055_53",
          "label": "\u662f\u5426\u533a\u5206\u7528\u6c34\u7c7b\u578b",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u751f\u6d3b\u7528\u6c34",
            "\u5de5\u827a\u7528\u6c34",
            "\u51b7\u5374\u7528\u6c34",
            "\u7eff\u5316"
          ]
        },
        {
          "id": "field_056_54",
          "label": "\u6838\u5fc3\u529f\u80fd\u8bc9\u6c42",
          "type": "textarea",
          "required": true
        }
      ]
    },
    {
      "id": "section_08",
      "title": "\u80fd\u6e90\u7c7b\u578b-\u84b8\u6c7d",
      "fields": [
        {
          "id": "field_057_55",
          "label": "\u5e74\u603b\u7528\u84b8\u6c7d\uff08m\u00b3\uff09",
          "type": "number",
          "required": true
        },
        {
          "id": "field_058_56",
          "label": "\u5e74\u603b\u7528\u84b8\u6c7d\u8d39\u7528\uff08\u4e07\u5143\uff09",
          "type": "number",
          "required": true
        },
        {
          "id": "field_059_57",
          "label": "\u6570\u636e\u91c7\u96c6\u65b9\u5f0f",
          "type": "select",
          "required": true,
          "options": [
            "EMS\u76f4\u8fde",
            "\u7b2c\u4e09\u65b9\u7cfb\u7edf\u5bf9\u63a5",
            "\u4eba\u5de5\u6284\u8868"
          ]
        },
        {
          "id": "field_060_58",
          "label": "\u4e3b\u8981\u8868\u5177\u7c7b\u578b",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u667a\u80fd\u6c14\u8868",
            "\u673a\u68b0\u6c14\u8868"
          ]
        },
        {
          "id": "field_061_59",
          "label": "\u8868\u8ba1\u901a\u8baf\u534f\u8bae",
          "type": "multiselect",
          "required": true,
          "options": [
            "Modbus RTU",
            "Modbus TCP",
            "DL/T645",
            "BACnet",
            "\u5176\u4ed6"
          ]
        },
        {
          "id": "field_062_60",
          "label": "\u6570\u636e\u91c7\u96c6\u9891\u7387",
          "type": "select",
          "required": true,
          "options": [
            "\u5b9e\u65f6(<1min)",
            "5min",
            "15min",
            "30min",
            "60min",
            "\u5929"
          ]
        },
        {
          "id": "field_063_61",
          "label": "\u7528\u6c14\u4e3b\u8981\u7528\u9014",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u9505\u7089",
            "\u98df\u5802",
            "\u5de5\u827a",
            "\u5176\u4ed6"
          ]
        },
        {
          "id": "field_064_62",
          "label": "\u662f\u5426\u533a\u5206\u7528\u6c34\u7c7b\u578b",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u751f\u6d3b\u7528\u6c34",
            "\u5de5\u827a\u7528\u6c34",
            "\u51b7\u5374\u7528\u6c34",
            "\u7eff\u5316"
          ]
        },
        {
          "id": "field_065_63",
          "label": "\u6838\u5fc3\u529f\u80fd\u8bc9\u6c42",
          "type": "textarea",
          "required": true
        }
      ]
    },
    {
      "id": "section_12",
      "title": "\u8fd0\u884c\u4e0e\u7ba1\u7406\u6a21\u5f0f",
      "fields": [
        {
          "id": "field_066_71",
          "label": "\u662f\u5426\u6709\u80fd\u6e90\u7ba1\u7406\u4eba\u5458",
          "type": "select",
          "required": true,
          "options": [
            "\u4e13\u804c",
            "\u517c\u804c",
            "\u6ca1\u6709"
          ]
        },
        {
          "id": "field_067_72",
          "label": "\u662f\u5426\u8bbe\u5b9a\u80fd\u8017KPI",
          "type": "select",
          "required": true,
          "options": [
            "\u662f",
            "\u5426"
          ]
        },
        {
          "id": "field_068_73",
          "label": "\u80fd\u6e90\u7528\u91cf\u5206\u6790\u9891\u7387",
          "type": "select",
          "required": true,
          "options": [
            "\u5b9e\u65f6",
            "\u65e5",
            "\u5468",
            "\u6708",
            "\u4e0d\u5b9a\u671f",
            "\u4ece\u4e0d"
          ]
        },
        {
          "id": "field_069_74",
          "label": "\u662f\u5426\u5b9a\u671f\u8f93\u51fa\u62a5\u8868",
          "type": "select",
          "required": true,
          "options": [
            "\u662f",
            "\u5426"
          ]
        },
        {
          "id": "field_070_75",
          "label": "\u5f53\u524d\u4e3b\u8981\u7ba1\u7406\u75db\u70b9",
          "type": "multiselect",
          "required": true,
          "options": [
            "\u770b\u4e0d\u6e05",
            "\u4e0d\u51c6",
            "\u4e0d\u53ca\u65f6",
            "\u96be\u5b9a\u4f4d\u6d6a\u8d39",
            "\u96be\u5bf9\u6807",
            "\u65e0\u8003\u6838",
            "\u62a5\u8868\u6210\u672c\u9ad8"
          ]
        }
      ]
    },
    {
      "id": "section_13",
      "title": "\u78b3\u7ba1\u7406",
      "fields": [
        {
          "id": "field_071_76",
          "label": "\u662f\u5426\u505a\u8fc7\u78b3\u76d8\u67e5",
          "type": "select",
          "required": true,
          "options": [
            "\u5b9a\u671f",
            "\u505a\u8fc7\u4e00\u6b21",
            "\u8ba1\u5212\u4e2d",
            "\u6ca1\u6709"
          ]
        },
        {
          "id": "field_072_77",
          "label": "\u662f\u5426\u6709\u78b3\u51cf\u6392\u76ee\u6807",
          "type": "select",
          "required": true,
          "options": [
            "\u660e\u786e\u76ee\u6807",
            "\u6709\u65b9\u5411\u65e0\u6307\u6807",
            "\u6ca1\u6709"
          ]
        },
        {
          "id": "field_073_78",
          "label": "\u8986\u76d6\u6392\u653e\u8303\u56f4",
          "type": "multiselect",
          "required": true,
          "options": [
            "Scope1",
            "Scope2",
            "Scope3",
            "\u4e0d\u660e\u786e"
          ]
        },
        {
          "id": "field_074_79",
          "label": "\u662f\u5426\u9700\u8981\u78b3\u6392\u653e\u62a5\u8868",
          "type": "select",
          "required": true,
          "options": [
            "\u662f",
            "\u5426"
          ]
        },
        {
          "id": "field_075_80",
          "label": "\u662f\u5426\u8003\u8651\u78b3\u4ea4\u6613",
          "type": "select",
          "required": false,
          "options": [
            "\u5df2\u53c2\u4e0e",
            "\u8ba1\u5212\u53c2\u4e0e",
            "\u4e0d\u8003\u8651"
          ]
        }
      ]
    },
    {
      "id": "section_14",
      "title": "IT\u5efa\u8bbe",
      "fields": [
        {
          "id": "field_076_81",
          "label": "\u73b0\u6709\u7cfb\u7edf",
          "type": "select",
          "required": true,
          "options": [
            "EMS",
            "BMS",
            "EMS+BMS",
            "SCADA",
            "\u65e0"
          ]
        },
        {
          "id": "field_077_82",
          "label": "\u662f\u5426\u652f\u6301\u7b2c\u4e09\u65b9\u63a5\u53e3",
          "type": "select",
          "required": true,
          "options": [
            "\u6807\u51c6\u63a5\u53e3",
            "\u5b9a\u5236\u63a5\u53e3",
            "\u4e0d\u652f\u6301"
          ]
        },
        {
          "id": "field_078_83",
          "label": "\u662f\u5426\u5141\u8bb8\u4e91\u90e8\u7f72",
          "type": "select",
          "required": true,
          "options": [
            "\u516c\u6709\u4e91",
            "\u79c1\u6709\u4e91",
            "\u672c\u5730\u90e8\u7f72",
            "\u4e0d\u5141\u8bb8"
          ]
        },
        {
          "id": "field_079_84",
          "label": "\u662f\u5426\u6709IT\u5bf9\u63a5\u4eba",
          "type": "select",
          "required": true,
          "options": [
            "\u662f",
            "\u5426"
          ]
        }
      ]
    }
  ]
} as SurveyTemplate;

export const SURVEY_TEMPLATES: SurveyTemplate[] = [EMS_PRESET_TEMPLATE];
