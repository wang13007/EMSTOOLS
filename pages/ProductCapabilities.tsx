import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ICONS } from '../constants';
import { DictItem, DictType, ProductCapability, ProductType } from '../types';
import { dictService } from '../src/services/supabaseService';
import { INITIAL_DICT_ITEMS, INITIAL_DICT_TYPES } from '../constants/dictionaries';
import Portal from '../src/components/Portal';

type ProductCapabilityRecord = {
  id: string;
  name: string;
  type: ProductType;
  industries: string[];
  scenarios: string[];
  description: string;
  create_time: string;
};

type DictionaryTypeLike = Partial<DictType> & {
  type_id?: string;
  type_code?: string;
  type_name?: string;
};

type DictionaryItemLike = Partial<DictItem> & {
  type_id?: string;
  item_label?: string;
};

const INDUSTRY_TYPE_CODES = ['industry'];
const SCENARIO_TYPE_CODES = ['scenario', 'scenarios', 'scene', 'application_scenario', 'use_case'];
const CAPABILITY_TYPE_CODES = ['capability_type', 'product_type'];
const INDUSTRY_TYPE_NAMES = ['琛屼笟绫诲瀷', '琛屼笟鍒嗙被', 'industry type', 'industry category'];
const SCENARIO_TYPE_NAMES = ['鍦烘櫙鍒嗙被', 'scenario category'];

const CAPABILITY_TYPE_NAMES = ['能力类型', '产品类型', 'capability type', 'product type'];

const BUTTON_BASE = 'h-10 px-4 rounded-xl inline-flex items-center gap-2 text-sm font-semibold transition-all';

const dedupeStrings = (values: string[]) => {
  const set = new Set<string>();
  values.forEach((value) => {
    const trimmed = value.trim();
    if (trimmed) set.add(trimmed);
  });
  return Array.from(set);
};

const parseMultiValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return dedupeStrings(value.map((item) => String(item || '')));
  }
  return dedupeStrings(String(value || '').split(/[,，;；]/));
};

const getTypeId = (type: DictionaryTypeLike) => String(type.typeId ?? type.type_id ?? '');
const getTypeCode = (type: DictionaryTypeLike) => String(type.typeCode ?? type.type_code ?? '').trim().toLowerCase();
const getTypeName = (type: DictionaryTypeLike) => String(type.typeName ?? type.type_name ?? '').trim().toLowerCase();
const getItemTypeId = (item: DictionaryItemLike) => String(item.typeId ?? item.type_id ?? '');
const getItemLabel = (item: DictionaryItemLike) => String(item.itemLabel ?? item.item_label ?? '');

const getLocalDictionary = () => {
  try {
    const rawTypes = localStorage.getItem('ems_dict_types');
    const rawItems = localStorage.getItem('ems_dict_items');
    return {
      types: rawTypes ? (JSON.parse(rawTypes) as DictionaryTypeLike[]) : [],
      items: rawItems ? (JSON.parse(rawItems) as DictionaryItemLike[]) : [],
    };
  } catch {
    return { types: [], items: [] };
  }
};

const pickLabelsByTypeFilter = (
  types: DictionaryTypeLike[],
  items: DictionaryItemLike[],
  predicate: (type: DictionaryTypeLike) => boolean,
) => {
  const targetTypeIds = types
    .filter(predicate)
    .map(getTypeId)
    .filter(Boolean);

  return dedupeStrings(
    items
      .filter((item) => targetTypeIds.includes(getItemTypeId(item)))
      .map(getItemLabel),
  );
};

const isIndustryDictType = (type: DictionaryTypeLike) => {
  const code = getTypeCode(type);
  const name = getTypeName(type);
  return INDUSTRY_TYPE_CODES.includes(code) || INDUSTRY_TYPE_NAMES.includes(name);
};

const isScenarioDictType = (type: DictionaryTypeLike) => {
  const code = getTypeCode(type);
  const name = getTypeName(type);
  return SCENARIO_TYPE_CODES.includes(code) || SCENARIO_TYPE_NAMES.includes(name);
};

const isCapabilityTypeDict = (type: DictionaryTypeLike) => {
  const code = getTypeCode(type);
  const name = getTypeName(type);
  return CAPABILITY_TYPE_CODES.includes(code) || CAPABILITY_TYPE_NAMES.includes(name);
};

const summaryText = (values: string[], placeholder: string) => {
  if (!values.length) return placeholder;
  if (values.length <= 2) return values.join('、');
  return `${values.slice(0, 2).join('、')} +${values.length - 2}`;
};

const normalizeImportedType = (rawType: unknown): ProductType => {
  const value = String(rawType || '').trim();
  if (Object.values(ProductType).includes(value as ProductType)) {
    return value as ProductType;
  }

  const normalized = value.toLowerCase();
  if (['software', 'soft'].includes(normalized)) return ProductType.SOFTWARE;
  if (['hardware', 'hard'].includes(normalized)) return ProductType.HARDWARE;
  if (['consulting', 'consult', 'advisory'].includes(normalized)) return ProductType.CONSULTING;
  if (['retrofit', 'renovation', 'construction'].includes(normalized)) return ProductType.RETROFIT;
  if (value) return value as ProductType;
  return ProductType.SOFTWARE;
};

const toExportPayload = (products: ProductCapability[]) => ({
  exportedAt: new Date().toISOString(),
  count: products.length,
  products,
});

const IconEdit = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.5 3.5a2.1 2.1 0 113 3L12 14l-4 1 1-4 7.5-7.5z" />
  </svg>
);

const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3 0V5a1 1 0 011-1h6a1 1 0 011 1v2M4 7h16" />
  </svg>
);

const IconImport = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v12m0 0l-4-4m4 4l4-4" />
  </svg>
);

const IconExport = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 15V3m0 0l-4 4m4-4l4 4" />
  </svg>
);

const MultiSelectDropdown: React.FC<{
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}> = ({ options, value, onChange, placeholder, disabled }) => {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    let top = rect.bottom + 6;
    let maxHeight = window.innerHeight - top - 8;

    if (maxHeight < 160) {
      const upwardHeight = rect.top - 14;
      maxHeight = Math.max(120, upwardHeight);
      top = Math.max(8, rect.top - maxHeight - 6);
    }

    setPanelStyle({
      left: rect.left,
      top,
      width: rect.width,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleViewportChange = () => updatePosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, updatePosition]);

  const toggleValue = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
      return;
    }
    onChange([...value, option]);
  };

  const clearAll = () => onChange([]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`w-full rounded-lg border px-3 py-2 text-left text-sm flex items-center justify-between gap-2 transition-colors ${
          disabled
            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
        }`}
      >
        <span className="truncate">{summaryText(value, placeholder)}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && !disabled && (
        <Portal>
          <div className="fixed inset-0 z-[88]" onMouseDown={() => setOpen(false)} />
          <div
            className="fixed z-[99] rounded-xl border border-slate-200 bg-white shadow-xl p-2"
            style={panelStyle}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-1">
              <span className="text-xs font-semibold text-slate-500">宸查€?{value.length}</span>
              <button type="button" onClick={clearAll} className="text-xs text-blue-600 hover:underline">
                娓呯┖
              </button>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: panelStyle.maxHeight ? Number(panelStyle.maxHeight) - 44 : 200 }}>
              {options.length > 0 ? (
                <div className="space-y-1 pr-1">
                  {options.map((option) => (
                    <label key={option} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value.includes(option)}
                        onChange={() => toggleValue(option)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="px-2 py-3 text-xs text-slate-400">鏆傛棤鍙€夐」</div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

export const productService = {
  async getProducts(): Promise<ProductCapabilityRecord[]> {
    return [
      {
        id: '1',
        name: 'EMS Analytics Platform',
        type: ProductType.SOFTWARE,
        industries: ['Manufacturing', 'Campus'],
        scenarios: ['Energy analysis', 'Diagnosis'],
        description: 'Core EMS software with dashboards and insights.',
        create_time: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Edge Gateway EC-100',
        type: ProductType.HARDWARE,
        industries: ['General'],
        scenarios: ['Data collection', 'Protocol conversion'],
        description: 'Supports Modbus and BACnet integration.',
        create_time: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Retrofit Delivery Package',
        type: ProductType.RETROFIT,
        industries: ['Industrial Park', 'Manufacturing'],
        scenarios: ['Upgrade', 'Retrofit'],
        description: 'Delivery package for on-site retrofit implementation.',
        create_time: new Date().toISOString(),
      },
    ];
  },
};

export const ProductCapabilities: React.FC = () => {
  const [products, setProducts] = useState<ProductCapability[]>([]);
  const [editingIds, setEditingIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dictCapabilityTypeOptions, setDictCapabilityTypeOptions] = useState<string[]>([]);
  const [dictIndustryOptions, setDictIndustryOptions] = useState<string[]>([]);
  const [dictScenarioOptions, setDictScenarioOptions] = useState<string[]>([]);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const productList = await productService.getProducts();
      const formattedProducts: ProductCapability[] = productList.map((product) => ({
        id: product.id,
        name: product.name,
        type: product.type,
        industries: product.industries,
        scenarios: product.scenarios,
        description: product.description,
        createTime: product.create_time,
      }));
      setProducts(formattedProducts);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const loadDictionaryOptions = async () => {
      const localDict = getLocalDictionary();

      let capabilityTypeOptions = pickLabelsByTypeFilter(localDict.types, localDict.items, isCapabilityTypeDict);
      let industryOptions = pickLabelsByTypeFilter(localDict.types, localDict.items, isIndustryDictType);
      let scenarioOptions = pickLabelsByTypeFilter(localDict.types, localDict.items, isScenarioDictType);

      if (!capabilityTypeOptions.length || !industryOptions.length || !scenarioOptions.length) {
        try {
          const remoteTypes = (await dictService.getDictTypes()) as DictionaryTypeLike[];
          const capabilityTypes = remoteTypes.filter(isCapabilityTypeDict);
          const industryTypes = remoteTypes.filter(isIndustryDictType);
          const scenarioTypes = remoteTypes.filter(isScenarioDictType);

          const [remoteCapabilityTypeItems, remoteIndustryItems, remoteScenarioItems] = await Promise.all([
            Promise.all(capabilityTypes.map((type) => dictService.getDictItems(getTypeId(type)))) as Promise<DictionaryItemLike[][]>,
            Promise.all(industryTypes.map((type) => dictService.getDictItems(getTypeId(type)))) as Promise<DictionaryItemLike[][]>,
            Promise.all(scenarioTypes.map((type) => dictService.getDictItems(getTypeId(type)))) as Promise<DictionaryItemLike[][]>,
          ]);

          if (!capabilityTypeOptions.length) {
            capabilityTypeOptions = dedupeStrings(remoteCapabilityTypeItems.flat().map(getItemLabel));
          }
          if (!industryOptions.length) {
            industryOptions = dedupeStrings(remoteIndustryItems.flat().map(getItemLabel));
          }
          if (!scenarioOptions.length) {
            scenarioOptions = dedupeStrings(remoteScenarioItems.flat().map(getItemLabel));
          }
        } catch {
          // ignore remote loading failures
        }
      }

      if (!capabilityTypeOptions.length) {
        capabilityTypeOptions = pickLabelsByTypeFilter(INITIAL_DICT_TYPES, INITIAL_DICT_ITEMS, isCapabilityTypeDict);
      }
      if (!industryOptions.length) {
        industryOptions = pickLabelsByTypeFilter(INITIAL_DICT_TYPES, INITIAL_DICT_ITEMS, isIndustryDictType);
      }
      if (!scenarioOptions.length) {
        scenarioOptions = pickLabelsByTypeFilter(INITIAL_DICT_TYPES, INITIAL_DICT_ITEMS, isScenarioDictType);
      }

      if (!capabilityTypeOptions.length) {
        capabilityTypeOptions = [
          ProductType.HARDWARE,
          ProductType.SOFTWARE,
          ProductType.CONSULTING,
          ProductType.RETROFIT,
        ];
      }

      setDictCapabilityTypeOptions(capabilityTypeOptions);
      setDictIndustryOptions(industryOptions);
      setDictScenarioOptions(scenarioOptions);
    };

    loadDictionaryOptions();
  }, []);

  const capabilityTypeOptions = useMemo(() => {
    const options = dedupeStrings(dictCapabilityTypeOptions);
    if (options.length) return options;
    return [
      ProductType.HARDWARE,
      ProductType.SOFTWARE,
      ProductType.CONSULTING,
      ProductType.RETROFIT,
    ];
  }, [dictCapabilityTypeOptions]);
  const industryOptions = useMemo(() => dedupeStrings(dictIndustryOptions), [dictIndustryOptions]);
  const scenarioOptions = useMemo(() => dedupeStrings(dictScenarioOptions), [dictScenarioOptions]);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const editingIdSet = useMemo(() => new Set(editingIds), [editingIds]);
  const allSelected = products.length > 0 && selectedIds.length === products.length;

  const handleChange = (id: string, updater: (current: ProductCapability) => ProductCapability) => {
    setProducts((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  };

  const handleToggleEdit = (id: string) => {
    const isEditing = editingIdSet.has(id);
    if (isEditing) {
      const target = products.find((item) => item.id === id);
      if (target && !target.name.trim()) {
        alert('请先填写能力名称');
        return;
      }
      setEditingIds((prev) => prev.filter((itemId) => itemId !== id));
      return;
    }
    setEditingIds((prev) => [...prev, id]);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('确认删除该产品能力吗？')) return;
    setProducts((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
    setEditingIds((prev) => prev.filter((itemId) => itemId !== id));
  };

  const handleBatchDelete = () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`确认批量删除已选的 ${selectedIds.length} 条记录吗？`)) return;

    setProducts((prev) => prev.filter((item) => !selectedIdSet.has(item.id)));
    setEditingIds((prev) => prev.filter((itemId) => !selectedIdSet.has(itemId)));
    setSelectedIds([]);
  };

  const handleAdd = () => {
    const nextProduct: ProductCapability = {
      id: Math.random().toString(36).slice(2, 11),
      type: (capabilityTypeOptions[0] || ProductType.SOFTWARE) as ProductType,
      name: '',
      industries: [],
      scenarios: [],
      description: '',
      createTime: new Date().toISOString(),
    };

    setProducts((prev) => [...prev, nextProduct]);
    setEditingIds((prev) => [...prev, nextProduct.id]);
  };

  const toggleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }
    setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? products.map((item) => item.id) : []);
  };

  const handleExport = () => {
    const payload = toExportPayload(products);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    anchor.href = url;
    anchor.download = `product-capabilities-${stamp}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const sourceRows: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.products) ? parsed.products : [];

      if (!sourceRows.length) {
        alert('导入文件中未找到可用数据。');
        return;
      }

      const importedProducts: ProductCapability[] = sourceRows.map((row, index) => ({
        id: String(row.id || row.productId || Math.random().toString(36).slice(2, 11) + index),
        type: normalizeImportedType(row.type),
        name: String(row.name ?? row.capabilityName ?? row['能力名称'] ?? '').trim(),
        industries: parseMultiValues(row.industries ?? row.industry ?? row['适用行业']),
        scenarios: parseMultiValues(row.scenarios ?? row.scenario ?? row['适用场景']),
        description: String(row.description ?? row.detailDescription ?? row['详细描述'] ?? '').trim(),
        createTime: String(row.createTime ?? row.create_time ?? new Date().toISOString()),
      }));

      const validRows = importedProducts.filter((item) => item.name || item.description || item.industries.length || item.scenarios.length);
      if (!validRows.length) {
        alert('未识别到有效产品能力记录。');
        return;
      }

      setProducts((prev) => [...prev, ...validRows]);
      setEditingIds((prev) => dedupeStrings([...prev, ...validRows.map((item) => item.id)]));
      alert(`成功导入 ${validRows.length} 条产品能力记录。`);
    } catch {
      alert('导入失败，请检查 JSON 格式是否正确。');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />

      <div className="rounded-2xl bg-gradient-to-r from-slate-50 via-white to-blue-50 p-5 border border-slate-200/80">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-blue-600" />
              产品能力维护
            </h2>
            <p className="text-slate-500 mt-1">支持行内编辑、字典多选、批量删除及导入导出。</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleImportClick} className={`${BUTTON_BASE} bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:text-blue-700`}>
              <IconImport />
              导入
            </button>

            <button onClick={handleExport} className={`${BUTTON_BASE} bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:text-blue-700`}>
              <IconExport />
              导出
            </button>

            <button
              onClick={handleBatchDelete}
              disabled={!selectedIds.length}
              className={`${BUTTON_BASE} ${
                selectedIds.length
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <IconTrash />
              批量删除{selectedIds.length ? ` (${selectedIds.length})` : ''}
            </button>

            <button onClick={handleAdd} className={`${BUTTON_BASE} bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200`}>
              <ICONS.Plus className="w-4 h-4" />
              新增产品能力
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(15,23,42,0.07)] overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="min-w-[1200px] w-full border-collapse">
            <thead className="bg-slate-50 text-slate-700 text-sm">
              <tr>
                <th className="px-4 py-3 border-b border-slate-200 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left font-bold px-4 py-3 border-b border-slate-200 w-48">类型</th>
                <th className="text-left font-bold px-4 py-3 border-b border-slate-200 w-56">能力名称</th>
                <th className="text-left font-bold px-4 py-3 border-b border-slate-200 w-64">适用行业</th>
                <th className="text-left font-bold px-4 py-3 border-b border-slate-200 w-64">适用场景</th>
                <th className="text-left font-bold px-4 py-3 border-b border-slate-200">详细描述</th>
                <th className="text-left font-bold px-4 py-3 border-b border-slate-200 w-36">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isEditing = editingIdSet.has(product.id);

                return (
                  <tr key={product.id} className={`odd:bg-white even:bg-slate-50/40 ${isEditing ? 'ring-1 ring-blue-200' : ''}`}>
                    <td className="px-4 py-3 align-top border-b border-slate-100">
                      <input
                        type="checkbox"
                        checked={selectedIdSet.has(product.id)}
                        onChange={(e) => toggleSelectRow(product.id, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    <td className="px-4 py-3 align-top border-b border-slate-100">
                      {isEditing ? (
                        <select
                          value={product.type}
                          onChange={(e) =>
                            handleChange(product.id, (current) => ({
                              ...current,
                              type: e.target.value as ProductType,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                          {capabilityTypeOptions.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                          {product.type}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top border-b border-slate-100">
                      {isEditing ? (
                        <input
                          value={product.name}
                          onChange={(e) =>
                            handleChange(product.id, (current) => ({
                              ...current,
                              name: e.target.value,
                            }))
                          }
                          placeholder="请输入能力名称"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      ) : (
                        <span className="text-sm font-medium text-slate-800">{product.name || '-'}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top border-b border-slate-100">
                      {isEditing ? (
                        <MultiSelectDropdown
                          options={industryOptions}
                          value={product.industries}
                          onChange={(next) =>
                            handleChange(product.id, (current) => ({
                              ...current,
                              industries: dedupeStrings(next),
                            }))
                          }
                          placeholder="请选择适用行业"
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {product.industries.length ? (
                            product.industries.map((item) => (
                              <span key={item} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top border-b border-slate-100">
                      {isEditing ? (
                        <MultiSelectDropdown
                          options={scenarioOptions}
                          value={product.scenarios}
                          onChange={(next) =>
                            handleChange(product.id, (current) => ({
                              ...current,
                              scenarios: dedupeStrings(next),
                            }))
                          }
                          placeholder="请选择适用场景"
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {product.scenarios.length ? (
                            product.scenarios.map((item) => (
                              <span key={item} className="px-2 py-0.5 bg-blue-50 rounded text-xs text-blue-700">
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top border-b border-slate-100">
                      {isEditing ? (
                        <textarea
                          value={product.description}
                          onChange={(e) =>
                            handleChange(product.id, (current) => ({
                              ...current,
                              description: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder="请输入详细描述"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                        />
                      ) : (
                        <span className="text-sm text-slate-600">{product.description || '-'}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleEdit(product.id)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          <IconEdit />
                          {isEditing ? '保存' : '编辑'}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-700"
                        >
                          <IconTrash />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!products.length && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">暂无产品能力数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

