
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

  // Provinces (Subset for brevity in code, but I will include the main ones)
  { regionId: 'sh', parentId: 'hd', regionName: '上海市', regionCode: '310000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'js', parentId: 'hd', regionName: '江苏省', regionCode: '320000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'zj', parentId: 'hd', regionName: '浙江省', regionCode: '330000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'gd', parentId: 'hn', regionName: '广东省', regionCode: '440000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'bj', parentId: 'hb', regionName: '北京市', regionCode: '110000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'tj', parentId: 'hb', regionName: '天津市', regionCode: '120000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'cq', parentId: 'xn', regionName: '重庆市', regionCode: '500000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'sc', parentId: 'xn', regionName: '四川省', regionCode: '510000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hk', parentId: 'gat', regionName: '香港特别行政区', regionCode: '810000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'mo', parentId: 'gat', regionName: '澳门特别行政区', regionCode: '820000', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: now },

  // Cities (Subset)
  { regionId: 'sh_c', parentId: 'sh', regionName: '上海市', regionCode: '310100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'nj', parentId: 'js', regionName: '南京市', regionCode: '320100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'sz', parentId: 'js', regionName: '苏州市', regionCode: '320500', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'hz_c', parentId: 'zj', regionName: '杭州市', regionCode: '330100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'gz', parentId: 'gd', regionName: '广州市', regionCode: '440100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'sz_gd', parentId: 'gd', regionName: '深圳市', regionCode: '440300', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'bj_c', parentId: 'bj', regionName: '北京市', regionCode: '110100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
  { regionId: 'cd', parentId: 'sc', regionName: '成都市', regionCode: '510100', regionLevel: RegionLevel.CITY, status: DictStatus.ENABLED, isSystem: true, createTime: now },
];
