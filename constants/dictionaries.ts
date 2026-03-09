import { DictItem, DictStatus, DictType } from '../types';

const now = () => new Date().toISOString();

export const INITIAL_DICT_TYPES: DictType[] = [
  { typeId: '1', typeName: '行业类型', typeCode: 'industry', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { typeId: '2', typeName: '区域信息', typeCode: 'region', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { typeId: '3', typeName: '能力类型', typeCode: 'capability_type', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { typeId: '4', typeName: '场景分类', typeCode: 'scenario', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { typeId: '5', typeName: '表单状态', typeCode: 'form_status', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { typeId: '6', typeName: '用户状态', typeCode: 'user_status', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
];

export const INITIAL_DICT_ITEMS: DictItem[] = [
  { itemId: '1', typeId: '1', itemLabel: '制造业', itemValue: 'manufacturing', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { itemId: '2', typeId: '1', itemLabel: '商业地产', itemValue: 'commercial_real_estate', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { itemId: '3', typeId: '1', itemLabel: '园区', itemValue: 'campus', status: DictStatus.ENABLED, creator: 'System', createTime: now() },

  { itemId: '4', typeId: '3', itemLabel: '软件', itemValue: 'software', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { itemId: '5', typeId: '3', itemLabel: '硬件', itemValue: 'hardware', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { itemId: '6', typeId: '3', itemLabel: '改造施工', itemValue: 'retrofit_construction', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { itemId: '7', typeId: '3', itemLabel: '咨询', itemValue: 'consulting', status: DictStatus.ENABLED, creator: 'System', createTime: now() },

  { itemId: '8', typeId: '4', itemLabel: '工业园区', itemValue: 'industrial_park', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { itemId: '9', typeId: '4', itemLabel: '单体工业厂房', itemValue: 'single_industrial_plant', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { itemId: '10', typeId: '4', itemLabel: '数据中心', itemValue: 'data_center', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { itemId: '11', typeId: '4', itemLabel: '商业楼宇', itemValue: 'commercial_building', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { itemId: '12', typeId: '4', itemLabel: '商业综合体', itemValue: 'commercial_complex', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
  { itemId: '13', typeId: '4', itemLabel: '酒店', itemValue: 'hotel', status: DictStatus.ENABLED, creator: 'System', createTime: now() },
];
