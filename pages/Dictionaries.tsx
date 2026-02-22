
import React, { useState, useMemo, useEffect } from 'react';
import { 
  DictType, DictItem, DictStatus, RegionDict, RegionLevel 
} from '../types';
import { ICONS } from '../constants';
import { dictService } from '../src/services/supabaseService';

export const Dictionaries: React.FC = () => {
  const [selectedType, setSelectedType] = useState<DictType | null>(null);
  const [dictTypes, setDictTypes] = useState<DictType[]>([]);
  const [dictItems, setDictItems] = useState<DictItem[]>([]);
  const [regions, setRegions] = useState<RegionDict[]>([]);
  
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  
  const [editingType, setEditingType] = useState<Partial<DictType> | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<DictItem> | null>(null);
  const [editingRegion, setEditingRegion] = useState<Partial<RegionDict> | null>(null);

  // Load data
  useEffect(() => {
    // 从数据库获取字典类型列表
    const fetchDictTypes = async () => {
      const typeList = await dictService.getDictTypes();
      // 转换数据格式以匹配前端类型
      const formattedTypes = typeList.map(type => ({
        typeId: type.type_id,
        typeName: type.type_name,
        typeCode: type.type_code,
        description: type.description,
        status: type.status,
        sortOrder: type.sort_order,
        creator: '系统用户', // 需要根据creator_id获取用户名
        createTime: type.create_time ? new Date(type.create_time).toISOString() : ''
      }));
      setDictTypes(formattedTypes);
      
      if (formattedTypes.length > 0 && !selectedType) {
        setSelectedType(formattedTypes[0]);
      }
    };

    fetchDictTypes();
  }, []);

  // 当选择的字典类型变化时，获取对应的字典项
  useEffect(() => {
    if (selectedType) {
      const fetchDictItems = async () => {
        const itemList = await dictService.getDictItems(selectedType.typeId);
        // 转换数据格式以匹配前端类型
        const formattedItems = itemList.map(item => ({
          itemId: item.item_id,
          typeId: item.type_id,
          itemLabel: item.item_label,
          itemValue: item.item_value,
          sortOrder: item.sort_order,
          status: item.status,
          ext1: item.ext1,
          ext2: item.ext2,
          creator: '系统用户', // 需要根据creator_id获取用户名
          createTime: item.create_time ? new Date(item.create_time).toISOString() : ''
        }));
        setDictItems(formattedItems);
      };

      fetchDictItems();
    }
  }, [selectedType]);

  // 模拟获取区域数据（暂时使用静态数据，后续可从数据库获取）
  useEffect(() => {
    // 这里可以从数据库获取区域数据
    // 暂时使用模拟数据
    const mockRegions: RegionDict[] = [
      { regionId: '1', regionName: '中国', regionCode: 'CN', parentId: '', regionLevel: RegionLevel.COUNTRY, status: DictStatus.ENABLED, isSystem: true, createTime: new Date().toISOString() },
      { regionId: '2', regionName: '华北', regionCode: 'CN_NORTH', parentId: '1', regionLevel: RegionLevel.REGION, status: DictStatus.ENABLED, isSystem: true, createTime: new Date().toISOString() },
      { regionId: '3', regionName: '华东', regionCode: 'CN_EAST', parentId: '1', regionLevel: RegionLevel.REGION, status: DictStatus.ENABLED, isSystem: true, createTime: new Date().toISOString() },
      { regionId: '4', regionName: '北京市', regionCode: 'CN_BJ', parentId: '2', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: new Date().toISOString() },
      { regionId: '5', regionName: '上海市', regionCode: 'CN_SH', parentId: '3', regionLevel: RegionLevel.PROVINCE, status: DictStatus.ENABLED, isSystem: true, createTime: new Date().toISOString() },
    ];
    setRegions(mockRegions);
  }, []);

  const filteredItems = useMemo(() => {
    if (!selectedType) return [];
    return dictItems.filter(item => item.typeId === selectedType.typeId);
  }, [selectedType, dictItems]);

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType?.typeName || !editingType?.typeCode) return;

    if (editingType.typeId) {
      setDictTypes(dictTypes.map(t => t.typeId === editingType.typeId ? { ...t, ...editingType } as DictType : t));
    } else {
      const newType: DictType = {
        ...editingType,
        typeId: Date.now().toString(),
        status: DictStatus.ENABLED,
        creator: 'Admin',
        createTime: new Date().toISOString()
      } as DictType;
      setDictTypes([...dictTypes, newType]);
    }
    setIsTypeModalOpen(false);
    setEditingType(null);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.itemLabel || !editingItem?.itemValue || !selectedType) return;

    if (editingItem.itemId) {
      setDictItems(dictItems.map(i => i.itemId === editingItem.itemId ? { ...i, ...editingItem } as DictItem : i));
    } else {
      const newItem: DictItem = {
        ...editingItem,
        itemId: Date.now().toString(),
        typeId: selectedType.typeId,
        status: DictStatus.ENABLED,
        creator: 'Admin',
        createTime: new Date().toISOString()
      } as DictItem;
      setDictItems([...dictItems, newItem]);
    }
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveRegion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegion?.regionName || !editingRegion?.regionCode) return;

    if (editingRegion.regionId) {
      setRegions(regions.map(r => r.regionId === editingRegion.regionId ? { ...r, ...editingRegion } as RegionDict : r));
    } else {
      const newRegion: RegionDict = {
        ...editingRegion,
        regionId: Date.now().toString(),
        status: DictStatus.ENABLED,
        isSystem: false,
        createTime: new Date().toISOString()
      } as RegionDict;
      setRegions([...regions, newRegion]);
    }
    setIsRegionModalOpen(false);
    setEditingRegion(null);
  };

  const handleExport = () => {
    const data = selectedType?.typeCode === 'region'
      ? { regions }
      : { types: dictTypes, items: dictItems };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ems_dict_${selectedType?.typeCode || 'all'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">字典管理</h2>
          <p className="text-slate-500">维护系统基础枚举数据、下拉选项及中国行政区划。</p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-blue-600 font-bold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            导出数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar: Dict Types */}
        <div className="col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">字典类型</h3>
              <button 
                onClick={() => { setEditingType({}); setIsTypeModalOpen(true); }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ICONS.Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
              {dictTypes.map(type => (
                <div 
                  key={type.typeId}
                  onClick={() => setSelectedType(type)}
                  className={`p-4 cursor-pointer transition-all flex justify-between items-center group ${selectedType?.typeId === type.typeId ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50'}`}
                >
                  <div>
                    <p className={`font-bold text-sm ${selectedType?.typeId === type.typeId ? 'text-blue-700' : 'text-slate-700'}`}>
                      {type.typeName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono uppercase">{type.typeCode}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingType(type); setIsTypeModalOpen(true); }}
                      className="p-1 text-slate-400 hover:text-blue-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main: Dict Items or Region Management */}
        <div className="col-span-8 space-y-4">
          {selectedType ? (
            selectedType.typeCode === 'region' ? (
              /* Region Management */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">中国行政区划</h3>
                    <p className="text-xs text-slate-400 mt-1">四级联动结构: 国家 → 大区 → 省份 → 城市</p>
                  </div>
                  <button 
                    onClick={() => { setEditingRegion({ regionLevel: RegionLevel.CITY }); setIsRegionModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-100"
                  >
                    <ICONS.Plus className="w-4 h-4" />
                    新增区域
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">区域名称</th>
                      <th className="px-6 py-3">编码</th>
                      <th className="px-6 py-3">层级</th>
                      <th className="px-6 py-3">状态</th>
                      <th className="px-6 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {regions.map(region => (
                      <tr key={region.regionId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-300">
                              {Array(region.regionLevel - 1).fill('—').join('')}
                            </span>
                            <span className={`font-bold text-sm ${region.regionLevel === 1 ? 'text-blue-600' : 'text-slate-700'}`}>
                              {region.regionName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400 text-xs">{region.regionCode}</td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {['国家', '大区', '省份', '城市'][region.regionLevel - 1]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${region.status === DictStatus.ENABLED ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {region.status === DictStatus.ENABLED ? '启用' : '禁用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { setEditingRegion(region); setIsRegionModalOpen(true); }}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            {!region.isSystem && (
                              <button 
                                onClick={() => setRegions(regions.filter(r => r.regionId !== region.regionId))}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Standard Dict Items */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedType.typeName} - 数据项</h3>
                    <p className="text-xs text-slate-400 mt-1">编码: {selectedType.typeCode}</p>
                  </div>
                  <button 
                    onClick={() => { setEditingItem({}); setIsItemModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-100"
                  >
                    <ICONS.Plus className="w-4 h-4" />
                    新增项
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">显示名称</th>
                      <th className="px-6 py-3">枚举值</th>
                      <th className="px-6 py-3">状态</th>
                      <th className="px-6 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredItems.map(item => (
                      <tr key={item.itemId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700 text-sm">{item.itemLabel}</td>
                        <td className="px-6 py-4 font-mono text-slate-400 text-xs">{item.itemValue}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === DictStatus.ENABLED ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {item.status === DictStatus.ENABLED ? '启用' : '禁用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button 
                              onClick={() => setDictItems(dictItems.filter(i => i.itemId !== item.itemId))}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                          该类型下暂无数据项
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-slate-400">
              <ICONS.Settings className="w-12 h-12 mb-4 opacity-20" />
              <p>请从左侧选择一个字典类型进行管理</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">{editingType?.typeId ? '编辑字典类型' : '新增字典类型'}</h3>
              <button onClick={() => setIsTypeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSaveType} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">类型名称</label>
                <input 
                  type="text" required
                  value={editingType?.typeName || ''}
                  onChange={e => setEditingType({ ...editingType, typeName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="如：行业分类"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">类型编码</label>
                <input 
                  type="text" required
                  value={editingType?.typeCode || ''}
                  onChange={e => setEditingType({ ...editingType, typeCode: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="如：industry"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">描述</label>
                <textarea 
                  value={editingType?.description || ''}
                  onChange={e => setEditingType({ ...editingType, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsTypeModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">取消</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">{editingItem?.itemId ? '编辑字典项' : '新增字典项'}</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">显示名称</label>
                <input 
                  type="text" required
                  value={editingItem?.itemLabel || ''}
                  onChange={e => setEditingItem({ ...editingItem, itemLabel: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="如：制造业"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">枚举值</label>
                <input 
                  type="text" required
                  value={editingItem?.itemValue || ''}
                  onChange={e => setEditingItem({ ...editingItem, itemValue: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="如：manufacturing"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">取消</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRegionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">{editingRegion?.regionId ? '编辑区域' : '新增区域'}</h3>
              <button onClick={() => setIsRegionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSaveRegion} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">区域名称</label>
                <input 
                  type="text" required
                  value={editingRegion?.regionName || ''}
                  onChange={e => setEditingRegion({ ...editingRegion, regionName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">区域编码</label>
                <input 
                  type="text" required
                  value={editingRegion?.regionCode || ''}
                  onChange={e => setEditingRegion({ ...editingRegion, regionCode: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">父级区域</label>
                <select 
                  value={editingRegion?.parentId || ''}
                  onChange={e => setEditingRegion({ ...editingRegion, parentId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">顶级</option>
                  {regions.filter(r => r.regionLevel < (editingRegion?.regionLevel || 4)).map(r => (
                    <option key={r.regionId} value={r.regionId}>{r.regionName}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsRegionModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">取消</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
