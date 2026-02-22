
import { DictType, DictItem, DictStatus } from '../types';

export const INITIAL_DICT_TYPES: DictType[] = [
  { typeId: '1', typeName: '行业分类', typeCode: 'industry', status: DictStatus.ENABLED, creator: 'System', createTime: new Date().toISOString() },
  { typeId: '2', typeName: '区域信息', typeCode: 'region', status: DictStatus.ENABLED, creator: 'System', createTime: new Date().toISOString() },
  { typeId: '3', typeName: '产品类型', typeCode: 'product_type', status: DictStatus.ENABLED, creator: 'System', createTime: new Date().toISOString() },
  { typeId: '4', typeName: '表单状态', typeCode: 'form_status', status: DictStatus.ENABLED, creator: 'System', createTime: new Date().toISOString() },
  { typeId: '5', typeName: '用户状态', typeCode: 'user_status', status: DictStatus.ENABLED, creator: 'System', createTime: new Date().toISOString() },
];

export const INITIAL_DICT_ITEMS: DictItem[] = [
  { itemId: '1', typeId: '1', itemLabel: '制造业', itemValue: 'manufacturing', status: DictStatus.ENABLED, creator: 'System', createTime: new Date().toISOString() },
  { itemId: '2', typeId: '1', itemLabel: '商业地产', itemValue: 'commercial', status: DictStatus.ENABLED, creator: 'System', createTime: new Date().toISOString() },
  { itemId: '3', typeId: '3', itemLabel: '软件', itemValue: 'software', status: DictStatus.ENABLED, creator: 'System', createTime: new Date().toISOString() },
  { itemId: '4', typeId: '3', itemLabel: '硬件', itemValue: 'hardware', status: DictStatus.ENABLED, creator: 'System', createTime: new Date().toISOString() },
];
