import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '../constants';
import { DictItem, DictType, PreSalesAssignment, RegionDict, RegionLevel, User } from '../types';
import { INITIAL_DICT_ITEMS, INITIAL_DICT_TYPES } from '../constants/dictionaries';
import { INITIAL_REGIONS } from '../constants/regions';
import Portal from '../src/components/Portal';

type OptionItem = {
  id: string;
  label: string;
};

const ASSIGNMENT_STORAGE_KEY = 'ems_presales_assignments';
const USERS_STORAGE_KEY = 'ems_users';
const DICT_TYPES_STORAGE_KEY = 'ems_dict_types';
const DICT_ITEMS_STORAGE_KEY = 'ems_dict_items';
const REGION_STORAGE_KEY = 'ems_regions';

const INDUSTRY_TYPE_CODES = ['industry', 'industry_type', 'industry_category'];
const INDUSTRY_TYPE_NAMES = ['行业类型', '行业分类', 'industry type', 'industry category'];
const LEGACY_LABEL_MAP: Record<string, string> = {
  '鍒堕€犱笟': '制造业',
  '鍟嗕笟鍦颁骇': '商业地产',
  '鍥尯': '园区',
};

const normalizeText = (value?: string) => (value || '').trim().toLowerCase();

const readCachedJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const dedupeOptions = (items: OptionItem[]) => {
  const map = new Map<string, OptionItem>();
  items.forEach((item) => {
    if (!item.id || !item.label) return;
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
};

const isIndustryType = (type: DictType) => {
  const code = normalizeText(type.typeCode);
  const name = normalizeText(type.typeName);
  return INDUSTRY_TYPE_CODES.includes(code) || INDUSTRY_TYPE_NAMES.includes(name);
};

const normalizeLabel = (value: string) => {
  const trimmed = value.trim();
  return LEGACY_LABEL_MAP[trimmed] || trimmed;
};

const isEnabledStatus = (status: unknown) => String(status || '').toLowerCase() !== 'disabled';

const isPreSalesUser = (user: User) => {
  const source = `${user.role || ''} ${user.name || ''} ${user.user_name || ''}`.toLowerCase();
  return source.includes('售前')
    || source.includes('presales')
    || source.includes('pre-sales')
    || source.includes('pre sales');
};

const toDisplayDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

export const PreSalesConfig: React.FC = () => {
  const [assignments, setAssignments] = useState<PreSalesAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [industryOptions, setIndustryOptions] = useState<OptionItem[]>([]);
  const [regionOptions, setRegionOptions] = useState<OptionItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PreSalesAssignment | null>(null);

  useEffect(() => {
    const savedAssignments = readCachedJson<PreSalesAssignment[]>(ASSIGNMENT_STORAGE_KEY, []);
    const savedUsers = readCachedJson<User[]>(USERS_STORAGE_KEY, []);

    const dictTypes = readCachedJson<DictType[]>(DICT_TYPES_STORAGE_KEY, INITIAL_DICT_TYPES);
    const dictItems = readCachedJson<DictItem[]>(DICT_ITEMS_STORAGE_KEY, INITIAL_DICT_ITEMS);
    const regions = readCachedJson<RegionDict[]>(REGION_STORAGE_KEY, INITIAL_REGIONS as RegionDict[]);

    const industryTypeIds = dictTypes.filter(isIndustryType).map((item) => item.typeId);
    const industries = dedupeOptions(
      dictItems
        .filter((item) => industryTypeIds.includes(item.typeId) && isEnabledStatus(item.status))
        .map((item) => ({ id: item.itemId, label: normalizeLabel(item.itemLabel) })),
    );

    const topRegions = regions.filter((item) => item.regionLevel === RegionLevel.REGION && isEnabledStatus(item.status));
    const fallbackRegions = regions.filter((item) => item.regionLevel !== RegionLevel.COUNTRY && isEnabledStatus(item.status));
    const selectableRegions = topRegions.length ? topRegions : fallbackRegions;
    const mappedRegions = dedupeOptions(
      selectableRegions.map((item) => ({ id: item.regionId, label: item.regionName })),
    );

    setAssignments(savedAssignments);
    setUsers(savedUsers);
    setIndustryOptions(industries);
    setRegionOptions(mappedRegions);
  }, []);

  useEffect(() => {
    localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments]);

  const selectableUsers = useMemo(() => {
    const enabledUsers = users.filter((user) => user.status === 'enabled');
    const preSalesUsers = enabledUsers.filter(isPreSalesUser);
    return preSalesUsers.length ? preSalesUsers : enabledUsers;
  }, [users]);

  const regionNameMap = useMemo(() => new Map(regionOptions.map((item) => [item.id, item.label])), [regionOptions]);
  const industryNameMap = useMemo(() => new Map(industryOptions.map((item) => [item.id, item.label])), [industryOptions]);

  const resolveRegionName = (id: string) => regionNameMap.get(id) || id;
  const resolveIndustryName = (id: string) => industryNameMap.get(id) || id;

  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PreSalesAssignment) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('确认删除该分配记录吗？')) return;
    setAssignments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const userId = String(formData.get('userId') || '').trim();
    const regionIds = Array.from(new Set(formData.getAll('regionIds').map((value) => String(value))));
    const industryIds = Array.from(new Set(formData.getAll('industryIds').map((value) => String(value))));

    if (!userId) return;
    const selectedUser = selectableUsers.find((user) => user.id === userId) || users.find((user) => user.id === userId);
    if (!selectedUser) return;

    if (editingItem) {
      setAssignments((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                userId,
                userName: selectedUser.name,
                regionIds,
                industryIds,
              }
            : item,
        ),
      );
    } else {
      setAssignments((prev) => [
        ...prev,
        {
          id: `ASG-${Date.now()}`,
          userId,
          userName: selectedUser.name,
          regionIds,
          industryIds,
          createTime: new Date().toISOString(),
        },
      ]);
    }

    closeModal();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">售前配置</h2>
        <p className="text-slate-500">仅维护售前人员分配，区域与行业选项均取自字典维护。</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
            售前人员分配
          </h3>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <ICONS.Plus className="w-4 h-4" />
            新增分配
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">售前人员</th>
                <th className="px-6 py-3">负责区域</th>
                <th className="px-6 py-3">负责行业</th>
                <th className="px-6 py-3">创建时间</th>
                <th className="px-6 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{item.userName}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {item.regionIds.length ? (
                        item.regionIds.map((id) => (
                          <span key={id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            {resolveRegionName(id)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">未分配区域</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {item.industryIds.length ? (
                        item.industryIds.map((id) => (
                          <span key={id} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">
                            {resolveIndustryName(id)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">未分配行业</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{toDisplayDate(item.createTime)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditModal(item)} className="text-blue-600 text-sm font-semibold hover:underline mr-4">
                      编辑
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-rose-600 text-sm font-semibold hover:underline">
                      删除
                    </button>
                  </td>
                </tr>
              ))}

              {!assignments.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    暂无分配数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-slideUp">
              <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">{editingItem ? '编辑分配' : '新增分配'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <ICONS.Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <form className="p-6 space-y-5" onSubmit={handleSave}>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">售前人员</label>
                  <select
                    name="userId"
                    required
                    defaultValue={editingItem?.userId}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">请选择售前人员</option>
                    {selectableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">负责区域（多选）</label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50/70">
                    {regionOptions.map((region) => (
                      <label key={region.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="regionIds"
                          value={region.id}
                          defaultChecked={editingItem?.regionIds?.includes(region.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{region.label}</span>
                      </label>
                    ))}
                    {!regionOptions.length && <p className="col-span-2 text-xs text-slate-400">字典中暂无区域选项</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">负责行业（多选）</label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50/70">
                    {industryOptions.map((industry) => (
                      <label key={industry.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="industryIds"
                          value={industry.id}
                          defaultChecked={editingItem?.industryIds?.includes(industry.id)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-700">{industry.label}</span>
                      </label>
                    ))}
                    {!industryOptions.length && <p className="col-span-2 text-xs text-slate-400">字典中暂无行业选项</p>}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-5 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">
                    取消
                  </button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
