
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { 
  PreSalesRegion, PreSalesIndustry, PreSalesAssignment, User, 
  DictType, DictItem, RegionDict, RegionLevel 
} from '../types';
import { INITIAL_REGIONS } from '../constants/regions';
import { INITIAL_DICT_TYPES, INITIAL_DICT_ITEMS } from '../constants/dictionaries';
import Portal from '../src/components/Portal';

export const PreSalesConfig: React.FC = () => {
  const [regions, setRegions] = useState<PreSalesRegion[]>([]);
  const [industries, setIndustries] = useState<PreSalesIndustry[]>([]);
  const [assignments, setAssignments] = useState<PreSalesAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Dictionary data for selection
  const [dictIndustries, setDictIndustries] = useState<DictItem[]>([]);
  const [dictRegions, setDictRegions] = useState<RegionDict[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'region' | 'industry' | 'assignment' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Load data
  useEffect(() => {
    const savedRegions = localStorage.getItem('ems_presales_regions');
    const savedIndustries = localStorage.getItem('ems_presales_industries');
    const savedAssignments = localStorage.getItem('ems_presales_assignments');
    const savedUsers = localStorage.getItem('ems_users');

    // Load dictionary data
    const savedDictTypes = localStorage.getItem('ems_dict_types');
    const savedDictItems = localStorage.getItem('ems_dict_items');
    const savedDictRegions = localStorage.getItem('ems_regions');

    if (savedRegions) setRegions(JSON.parse(savedRegions));
    if (savedIndustries) setIndustries(JSON.parse(savedIndustries));
    if (savedAssignments) setAssignments(JSON.parse(savedAssignments));
    if (savedUsers) setUsers(JSON.parse(savedUsers));

    const types: DictType[] = savedDictTypes ? JSON.parse(savedDictTypes) : INITIAL_DICT_TYPES;
    const items: DictItem[] = savedDictItems ? JSON.parse(savedDictItems) : INITIAL_DICT_ITEMS;
    const industryType = types.find(t => t.typeCode === 'industry');
    if (industryType) {
      setDictIndustries(items.filter(i => i.typeId === industryType.typeId));
    }

    const allRegions: RegionDict[] = savedDictRegions ? JSON.parse(savedDictRegions) : INITIAL_REGIONS;
    // Only show top-level regions for selection in pre-sales config
    setDictRegions(allRegions.filter(r => r.regionLevel === RegionLevel.REGION));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('ems_presales_regions', JSON.stringify(regions));
    localStorage.setItem('ems_presales_industries', JSON.stringify(industries));
    localStorage.setItem('ems_presales_assignments', JSON.stringify(assignments));
  }, [regions, industries, assignments]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    if (modalType === 'region') {
      const regionId = formData.get('regionId') as string;
      if (!regionId) return;
      
      const dictRegion = dictRegions.find(r => r.regionId === regionId);
      if (!dictRegion) return;

      if (editingItem) {
        setRegions(regions.map(r => r.id === editingItem.id ? { ...r, name: dictRegion.regionName, id: dictRegion.regionId } : r));
      } else {
        if (regions.some(r => r.id === dictRegion.regionId)) {
          alert('该区域已存在');
          return;
        }
        setRegions([...regions, { id: dictRegion.regionId, name: dictRegion.regionName, createTime: new Date().toISOString() }]);
      }
    } else if (modalType === 'industry') {
      const industryId = formData.get('industryId') as string;
      if (!industryId) return;

      const dictIndustry = dictIndustries.find(i => i.itemId === industryId);
      if (!dictIndustry) return;

      if (editingItem) {
        setIndustries(industries.map(i => i.id === editingItem.id ? { ...i, name: dictIndustry.itemLabel, id: dictIndustry.itemId } : i));
      } else {
        if (industries.some(i => i.id === dictIndustry.itemId)) {
          alert('该行业已存在');
          return;
        }
        setIndustries([...industries, { id: dictIndustry.itemId, name: dictIndustry.itemLabel, createTime: new Date().toISOString() }]);
      }
    } else if (modalType === 'assignment') {
      const userId = formData.get('userId') as string;
      const regionIds = formData.getAll('regionIds') as string[];
      const industryIds = formData.getAll('industryIds') as string[];
      
      if (!userId) return;
      const user = users.find(u => u.id === userId);
      if (!user) return;

      if (editingItem) {
        setAssignments(assignments.map(a => a.id === editingItem.id ? { ...a, userId, userName: user.name, regionIds, industryIds } : a));
      } else {
        setAssignments([...assignments, { 
          id: `ASG-${Date.now()}`, 
          userId, 
          userName: user.name, 
          regionIds, 
          industryIds, 
          createTime: new Date().toISOString() 
        }]);
      }
    }
    
    setIsModalOpen(false);
    setEditingItem(null);
    setModalType(null);
  };

  const handleDelete = (type: 'region' | 'industry' | 'assignment', id: string) => {
    if (!window.confirm('确定要删除吗？')) return;
    if (type === 'region') setRegions(regions.filter(r => r.id !== id));
    if (type === 'industry') setIndustries(industries.filter(i => i.id !== id));
    if (type === 'assignment') setAssignments(assignments.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">售前配置</h2>
        <p className="text-slate-500">维护调研基础数据，并为售前人员分配多个负责区域与行业。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Region Master */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
              区域管理
            </h3>
            <button 
              onClick={() => { setEditingItem(null); setModalType('region'); setIsModalOpen(true); }}
              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
            >
              <ICONS.Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="p-0 flex-1 overflow-auto max-h-64">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">区域名称</th>
                  <th className="px-6 py-3">创建时间</th>
                  <th className="px-6 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {regions.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(item.createTime).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setEditingItem(item); setModalType('region'); setIsModalOpen(true); }} className="text-blue-600 text-xs font-bold hover:underline mr-4">编辑</button>
                      <button onClick={() => handleDelete('region', item.id)} className="text-rose-600 text-xs font-bold hover:underline">删除</button>
                    </td>
                  </tr>
                ))}
                {regions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic text-sm">暂无区域数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Industry Master */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-4 bg-emerald-600 rounded-full" />
              行业管理
            </h3>
            <button 
              onClick={() => { setEditingItem(null); setModalType('industry'); setIsModalOpen(true); }}
              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
            >
              <ICONS.Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="p-0 flex-1 overflow-auto max-h-64">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">行业名称</th>
                  <th className="px-6 py-3">创建时间</th>
                  <th className="px-6 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {industries.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(item.createTime).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setEditingItem(item); setModalType('industry'); setIsModalOpen(true); }} className="text-blue-600 text-xs font-bold hover:underline mr-4">编辑</button>
                      <button onClick={() => handleDelete('industry', item.id)} className="text-rose-600 text-xs font-bold hover:underline">删除</button>
                    </td>
                  </tr>
                ))}
                {industries.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic text-sm">暂无行业数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assignment Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <div className="w-1.5 h-4 bg-amber-600 rounded-full" />
            售前人员分配 (多选配置)
          </h3>
          <button 
            onClick={() => { setEditingItem(null); setModalType('assignment'); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
          >
            <ICONS.Plus className="w-4 h-4" />
            新增分配
          </button>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-3">售前人员</th>
              <th className="px-6 py-3">负责区域</th>
              <th className="px-6 py-3">负责行业</th>
              <th className="px-6 py-3">创建时间</th>
              <th className="px-6 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {assignments.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                      {item.userName.slice(0, 1)}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{item.userName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {item.regionIds.map(rid => {
                      const r = regions.find(reg => reg.id === rid);
                      return r ? (
                        <span key={rid} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                          {r.name}
                        </span>
                      ) : null;
                    })}
                    {item.regionIds.length === 0 && <span className="text-[10px] text-slate-300 italic">未分配区域</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {item.industryIds.map(iid => {
                      const i = industries.find(ind => ind.id === iid);
                      return i ? (
                        <span key={iid} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold">
                          {i.name}
                        </span>
                      ) : null;
                    })}
                    {item.industryIds.length === 0 && <span className="text-[10px] text-slate-300 italic">未分配行业</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{new Date(item.createTime).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { setEditingItem(item); setModalType('assignment'); setIsModalOpen(true); }} className="text-blue-600 text-xs font-bold hover:underline mr-4">编辑</button>
                  <button onClick={() => handleDelete('assignment', item.id)} className="text-rose-600 text-xs font-bold hover:underline">删除</button>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">暂无分配数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingItem ? '编辑' : '新增'}{modalType === 'region' ? '区域' : modalType === 'industry' ? '行业' : '分配'}
                </h3>
                <button onClick={() => { setIsModalOpen(false); setModalType(null); }} className="text-slate-400 hover:text-slate-600">
                  <ICONS.Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <form className="p-8 space-y-6" onSubmit={handleSave}>
                {modalType === 'assignment' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">选择售前人员</label>
                      <select name="userId" required defaultValue={editingItem?.userId} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="">请选择人员</option>
                        {users.filter(u => u.role.includes('售前')).map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase block">负责区域 (多选)</label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 border border-slate-100 rounded-xl bg-slate-50">
                        {regions.map(r => (
                          <label key={r.id} className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              name="regionIds" 
                              value={r.id} 
                              defaultChecked={editingItem?.regionIds?.includes(r.id)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                            />
                            <span className="text-xs text-slate-600 group-hover:text-blue-600 transition-colors">{r.name}</span>
                          </label>
                        ))}
                        {regions.length === 0 && <p className="col-span-2 text-[10px] text-slate-400 italic">请先添加区域</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase block">负责行业 (多选)</label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 border border-slate-100 rounded-xl bg-slate-50">
                        {industries.map(i => (
                          <label key={i.id} className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              name="industryIds" 
                              value={i.id} 
                              defaultChecked={editingItem?.industryIds?.includes(i.id)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                            />
                            <span className="text-xs text-slate-600 group-hover:text-emerald-600 transition-colors">{i.name}</span>
                          </label>
                        ))}
                        {industries.length === 0 && <p className="col-span-2 text-[10px] text-slate-400 italic">请先添加行业</p>}
                      </div>
                    </div>
                  </>
                ) : modalType === 'region' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">选择区域 (从字典)</label>
                    <select 
                      name="regionId" 
                      required 
                      defaultValue={editingItem?.id}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">请选择区域</option>
                      {dictRegions.map(r => (
                        <option key={r.regionId} value={r.regionId}>{r.regionName}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">选择行业 (从字典)</label>
                    <select 
                      name="industryId" 
                      required 
                      defaultValue={editingItem?.id}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">请选择行业</option>
                      {dictIndustries.map(i => (
                        <option key={i.itemId} value={i.itemId}>{i.itemLabel}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsModalOpen(false); setModalType(null); }} className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">取消</button>
                  <button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">保存</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
