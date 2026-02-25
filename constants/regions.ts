
import { RegionDict, RegionLevel, DictStatus } from '../types';

const now = new Date().toISOString();

export const INITIAL_REGIONS: RegionDict[] = [
  // Country
  { regionId: 'cn', regionName: '中国', regionCode: 'CN', regionLevel: RegionLevel.COUNTRY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Regions
  { regionId: 'hd', parentId: 'cn', regionName: '华东地区', regionCode: 'HD', regionLevel: RegionLevel.REGION, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hn', parentId: 'cn', regionName: '华南地区', regionCode: 'HN', regionLevel: RegionLevel.REGION, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hb', parentId: 'cn', regionName: '华北地区', regionCode: 'HB', regionLevel: RegionLevel.REGION, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hz', parentId: 'cn', regionName: '华中地区', regionCode: 'HZ', regionLevel: RegionLevel.REGION, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'xn', parentId: 'cn', regionName: '西南地区', regionCode: 'XN', regionLevel: RegionLevel.REGION, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'xb', parentId: 'cn', regionName: '西北地区', regionCode: 'XB', regionLevel: RegionLevel.REGION, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'db', parentId: 'cn', regionName: '东北地区', regionCode: 'DB', regionLevel: RegionLevel.REGION, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'gat', parentId: 'cn', regionName: '特别行政区', regionCode: 'GAT', regionLevel: RegionLevel.REGION, status: DictStatus.ENABLED, isSystem: true, createTime: now },

  // Provinces - 华东地区
  { regionId: 'sh', parentId: 'hd', regionName: '上海市', regionCode: '310000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'js', parentId: 'hd', regionName: '江苏省', regionCode: '320000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'zj', parentId: 'hd', regionName: '浙江省', regionCode: '330000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'ah', parentId: 'hd', regionName: '安徽省', regionCode: '340000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'fj', parentId: 'hd', regionName: '福建省', regionCode: '350000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'jx', parentId: 'hd', regionName: '江西省', regionCode: '360000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Provinces - 华南地区
  { regionId: 'gd', parentId: 'hn', regionName: '广东省', regionCode: '440000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'gx', parentId: 'hn', regionName: '广西壮族自治区', regionCode: '450000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hi', parentId: 'hn', regionName: '海南省', regionCode: '460000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Provinces - 华北地区
  { regionId: 'bj', parentId: 'hb', regionName: '北京市', regionCode: '110000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'tj', parentId: 'hb', regionName: '天津市', regionCode: '120000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'he', parentId: 'hb', regionName: '河北省', regionCode: '130000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'sx', parentId: 'hb', regionName: '山西省', regionCode: '140000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'nm', parentId: 'hb', regionName: '内蒙古自治区', regionCode: '150000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Provinces - 华中地区
  { regionId: 'henan', parentId: 'hz', regionName: '河南省', regionCode: '410000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hubei', parentId: 'hz', regionName: '湖北省', regionCode: '420000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hunan', parentId: 'hz', regionName: '湖南省', regionCode: '430000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Provinces - 西南地区
  { regionId: 'cq', parentId: 'xn', regionName: '重庆市', regionCode: '500000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'sc', parentId: 'xn', regionName: '四川省', regionCode: '510000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'gz', parentId: 'xn', regionName: '贵州省', regionCode: '520000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'yn', parentId: 'xn', regionName: '云南省', regionCode: '530000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'xz', parentId: 'xn', regionName: '西藏自治区', regionCode: '540000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Provinces - 西北地区
  { regionId: 'shaanxi', parentId: 'xb', regionName: '陕西省', regionCode: '610000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'gs', parentId: 'xb', regionName: '甘肃省', regionCode: '620000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'qh', parentId: 'xb', regionName: '青海省', regionCode: '630000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'nx', parentId: 'xb', regionName: '宁夏回族自治区', regionCode: '640000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'xj', parentId: 'xb', regionName: '新疆维吾尔自治区', regionCode: '650000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Provinces - 东北地区
  { regionId: 'ln', parentId: 'db', regionName: '辽宁省', regionCode: '210000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'jl', parentId: 'db', regionName: '吉林省', regionCode: '220000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hlj', parentId: 'db', regionName: '黑龙江省', regionCode: '230000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Provinces - 特别行政区
  { regionId: 'hk', parentId: 'gat', regionName: '香港特别行政区', regionCode: '810000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'mo', parentId: 'gat', regionName: '澳门特别行政区', regionCode: '820000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },

  // Cities - 华东地区
  { regionId: 'sh_c', parentId: 'sh', regionName: '上海市', regionCode: '310100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'nj', parentId: 'js', regionName: '南京市', regionCode: '320100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'sz_js', parentId: 'js', regionName: '苏州市', regionCode: '320500', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'wx', parentId: 'js', regionName: '无锡市', regionCode: '320200', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'cz', parentId: 'js', regionName: '常州市', regionCode: '320400', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hz_c', parentId: 'zj', regionName: '杭州市', regionCode: '330100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'nb', parentId: 'zj', regionName: '宁波市', regionCode: '330200', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'wz', parentId: 'zj', regionName: '温州市', regionCode: '330300', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hf', parentId: 'ah', regionName: '合肥市', regionCode: '340100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'wh_ah', parentId: 'ah', regionName: '芜湖市', regionCode: '340200', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'fz', parentId: 'fj', regionName: '福州市', regionCode: '350100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'xm', parentId: 'fj', regionName: '厦门市', regionCode: '350200', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'nc', parentId: 'jx', regionName: '南昌市', regionCode: '360100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'jj', parentId: 'jx', regionName: '九江市', regionCode: '360400', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Cities - 华南地区
  { regionId: 'gz_gd', parentId: 'gd', regionName: '广州市', regionCode: '440100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'sz_gd', parentId: 'gd', regionName: '深圳市', regionCode: '440300', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'zh', parentId: 'gd', regionName: '珠海市', regionCode: '440400', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'fs', parentId: 'gd', regionName: '佛山市', regionCode: '440600', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'nn', parentId: 'gx', regionName: '南宁市', regionCode: '450100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'gl', parentId: 'gx', regionName: '桂林市', regionCode: '450300', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'haikou', parentId: 'hi', regionName: '海口市', regionCode: '460100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'sanya', parentId: 'hi', regionName: '三亚市', regionCode: '460200', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Cities - 华北地区
  { regionId: 'bj_c', parentId: 'bj', regionName: '北京市', regionCode: '110100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'tj_c', parentId: 'tj', regionName: '天津市', regionCode: '120100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'sjz', parentId: 'he', regionName: '石家庄市', regionCode: '130100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'ts', parentId: 'he', regionName: '唐山市', regionCode: '130200', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'ty', parentId: 'sx', regionName: '太原市', regionCode: '140100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'bt', parentId: 'sx', regionName: '大同市', regionCode: '140200', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hhht', parentId: 'nm', regionName: '呼和浩特市', regionCode: '150100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'bty', parentId: 'nm', regionName: '包头市', regionCode: '150200', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Cities - 华中地区
  { regionId: 'zz', parentId: 'henan', regionName: '郑州市', regionCode: '410100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'ly', parentId: 'henan', regionName: '洛阳市', regionCode: '410300', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'wh_hb', parentId: 'hubei', regionName: '武汉市', regionCode: '420100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'xy', parentId: 'hubei', regionName: '襄阳市', regionCode: '420600', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'cs', parentId: 'hunan', regionName: '长沙市', regionCode: '430100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'zz_hunan', parentId: 'hunan', regionName: '株洲市', regionCode: '430200', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Cities - 西南地区
  { regionId: 'cq_c', parentId: 'cq', regionName: '重庆市', regionCode: '500100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'cd', parentId: 'sc', regionName: '成都市', regionCode: '510100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'dz', parentId: 'sc', regionName: '德阳市', regionCode: '510600', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'yz', parentId: 'sc', regionName: '绵阳市', regionCode: '510700', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'gy', parentId: 'gz', regionName: '贵阳市', regionCode: '520100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'zy', parentId: 'gz', regionName: '遵义市', regionCode: '520300', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'km', parentId: 'yn', regionName: '昆明市', regionCode: '530100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'lijiang', parentId: 'yn', regionName: '丽江市', regionCode: '530700', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'lasa', parentId: 'xz', regionName: '拉萨市', regionCode: '540100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Cities - 西北地区
  { regionId: 'xa', parentId: 'shaanxi', regionName: '西安市', regionCode: '610100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: '宝鸡', parentId: 'shaanxi', regionName: '宝鸡市', regionCode: '610300', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'lz', parentId: 'gs', regionName: '兰州市', regionCode: '620100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'qh_xa', parentId: 'qh', regionName: '西宁市', regionCode: '630100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'yc', parentId: 'nx', regionName: '银川市', regionCode: '640100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'wlmq', parentId: 'xj', regionName: '乌鲁木齐市', regionCode: '650100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Cities - 东北地区
  { regionId: 'sy', parentId: 'ln', regionName: '沈阳市', regionCode: '210100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'dl', parentId: 'ln', regionName: '大连市', regionCode: '210200', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'cc', parentId: 'jl', regionName: '长春市', regionCode: '220100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'sj', parentId: 'jl', regionName: '吉林市', regionCode: '220200', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hrb', parentId: 'hlj', regionName: '哈尔滨市', regionCode: '230100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'dq', parentId: 'hlj', regionName: '大庆市', regionCode: '230600', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  
  // Cities - 特别行政区
  { regionId: 'hk_c', parentId: 'hk', regionName: '香港', regionCode: '810100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'mo_c', parentId: 'mo', regionName: '澳门', regionCode: '820100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
];

