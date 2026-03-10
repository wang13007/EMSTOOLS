import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ICONS } from '../constants';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
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

const LEGACY_LABEL_MAP: Record<string, string> = {
  '杞欢': '软件',
  '纭欢': '硬件',
  '鍜ㄨ': '咨询',
  '鏀归€犳柦宸?': '改造施工',
  '鍒堕€犱笟': '制造业',
  '鍟嗕笟鍦颁骇': '商业地产',
  '鍥尯': '园区',
};

const INDUSTRY_TYPE_CODES = ['industry', 'industry_type', 'industry_category'];
const SCENARIO_TYPE_CODES = ['scenario', 'scenarios', 'scene', 'scenario_type', 'scenario_category', 'application_scenario', 'use_case'];
const CAPABILITY_TYPE_CODES = ['capability_type', 'product_type', 'capability', 'product_capability_type'];
const INDUSTRY_TYPE_NAMES = ['行业类型', '行业分类', 'industry type', 'industry category'];
const SCENARIO_TYPE_NAMES = ['场景分类', '场景类型', 'scenario category', 'scenario type'];
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
    return dedupeStrings(value.map((item) => normalizeLabel(String(item || ''))));
  }
  return dedupeStrings(String(value || '').split(/[,，;；]/).map((item) => normalizeLabel(item)));
};

const getTypeId = (type: DictionaryTypeLike) => String(type.typeId ?? type.type_id ?? '');
const getTypeCode = (type: DictionaryTypeLike) => String(type.typeCode ?? type.type_code ?? '').trim().toLowerCase();
const getTypeName = (type: DictionaryTypeLike) => String(type.typeName ?? type.type_name ?? '').trim().toLowerCase();
const getItemTypeId = (item: DictionaryItemLike) => String(item.typeId ?? item.type_id ?? '');
const normalizeLabel = (value: string) => LEGACY_LABEL_MAP[value.trim()] || value.trim();
const getItemLabel = (item: DictionaryItemLike) => normalizeLabel(String(item.itemLabel ?? item.item_label ?? ''));

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

const normalizeImportedType = (rawType: unknown): ProductType | null => {
  const value = String(rawType || '').trim();
  if (Object.values(ProductType).includes(value as ProductType)) {
    return value as ProductType;
  }

  const normalized = value.toLowerCase();
  const legacyTypeMap: Record<string, ProductType> = {
    '软件': ProductType.SOFTWARE,
    '杞欢': ProductType.SOFTWARE,
    '硬件': ProductType.HARDWARE,
    '纭欢': ProductType.HARDWARE,
    '咨询': ProductType.CONSULTING,
    '鍜ㄨ': ProductType.CONSULTING,
    '改造施工': ProductType.RETROFIT,
    '鏀归€犳柦宸?': ProductType.RETROFIT,
  };
  if (legacyTypeMap[normalized]) return legacyTypeMap[normalized];

  if (['software', 'soft'].includes(normalized)) return ProductType.SOFTWARE;
  if (['hardware', 'hard'].includes(normalized)) return ProductType.HARDWARE;
  if (['consulting', 'consult', 'advisory'].includes(normalized)) return ProductType.CONSULTING;
  if (['retrofit', 'renovation', 'construction'].includes(normalized)) return ProductType.RETROFIT;
  return null;
};

const IMPORT_FIELD_ALIASES = {
  id: ['ID', 'id', 'Id', '能力ID', 'productId'],
  name: ['能力名称', 'name', 'Name', 'capabilityName'],
  type: ['类型', '能力类型', '产品类型', 'type', 'Type'],
  industries: ['适用行业', '适用行业（多选请用英文逗号,分隔）', 'industries', 'industry', '行业'],
  scenarios: ['适用场景', '适用场景（多选请用英文逗号,分隔）', 'scenarios', 'scenario', '场景'],
  description: ['详细描述', 'description', 'detailDescription', '描述'],
  createTime: ['创建时间', '创建时间（导入时无需填写，系统自动生成）', 'createTime', 'create_time'],
};

const EXCEL_EXPORT_HEADERS = [
  'ID',
  '能力名称',
  '类型',
  '适用行业（多选请用英文逗号,分隔）',
  '适用场景（多选请用英文逗号,分隔）',
  '详细描述',
  '创建时间（导入时无需填写，系统自动生成）',
];

const getImportCellValue = (row: Record<string, unknown>, aliases: string[]) => {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias)) return row[alias];
  }

  const lowerCaseKeyMap = Object.keys(row).reduce<Record<string, string>>((acc, key) => {
    acc[key.trim().toLowerCase()] = key;
    return acc;
  }, {});

  for (const alias of aliases) {
    const mappedKey = lowerCaseKeyMap[alias.trim().toLowerCase()];
    if (mappedKey) return row[mappedKey];
  }

  return '';
};

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
    const viewportPadding = 8;
    const panelWidth = Math.max(rect.width, 220);

    let left = rect.left;
    if (left + panelWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - panelWidth - viewportPadding;
    }
    if (left < viewportPadding) {
      left = viewportPadding;
    }

    let top = rect.bottom + 6;
    let maxHeight = window.innerHeight - top - viewportPadding;

    if (maxHeight < 160) {
      const upwardHeight = rect.top - 14;
      maxHeight = Math.max(120, upwardHeight);
      top = Math.max(viewportPadding, rect.top - maxHeight - 6);
    }

    setPanelStyle({
      left,
      top,
      width: panelWidth,
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
              <span className="text-xs font-semibold text-slate-500">已选 {value.length}</span>
              <button type="button" onClick={clearAll} className="text-xs text-blue-600 hover:underline">
                清空
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
                <div className="px-2 py-3 text-xs text-slate-400">暂无可选项</div>
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
        name: '能效分析平台',
        type: ProductType.SOFTWARE,
        industries: ['制造业', '园区'],
        scenarios: ['能耗分析', '能效诊断'],
        description: '提供看板分析、异常告警与能效诊断的核心软件平台。',
        create_time: new Date().toISOString(),
      },
      {
        id: '2',
        name: '边缘采集网关',
        type: ProductType.HARDWARE,
        industries: ['制造业', '商业地产'],
        scenarios: ['数据采集', '协议转换'],
        description: '支持常见工业协议接入与边缘侧数据汇聚。',
        create_time: new Date().toISOString(),
      },
      {
        id: '3',
        name: '节能改造实施服务',
        type: ProductType.RETROFIT,
        industries: ['园区', '制造业'],
        scenarios: ['系统升级', '节能改造'],
        description: '面向现场的节能改造交付与实施服务包。',
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

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('产品能力');
    const optionsSheet = workbook.addWorksheet('下拉选项');
    const typeColIndex = 3;
    const industryColIndex = 4;
    const scenarioColIndex = 5;

    worksheet.addRow(EXCEL_EXPORT_HEADERS);
    products.forEach((item) => {
      worksheet.addRow([
        item.id,
        item.name,
        item.type,
        item.industries.join(','),
        item.scenarios.join(','),
        item.description,
        item.createTime,
      ]);
    });

    worksheet.columns = [
      { width: 18 },
      { width: 24 },
      { width: 16 },
      { width: 40 },
      { width: 40 },
      { width: 36 },
      { width: 34 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;

    optionsSheet.getCell('A1').value = '类型';
    capabilityTypeOptions.forEach((item, index) => {
      optionsSheet.getCell(`A${index + 2}`).value = item;
    });
    optionsSheet.getCell('B1').value = '适用行业';
    industryOptions.forEach((item, index) => {
      optionsSheet.getCell(`B${index + 2}`).value = item;
    });
    optionsSheet.getCell('C1').value = '适用场景';
    scenarioOptions.forEach((item, index) => {
      optionsSheet.getCell(`C${index + 2}`).value = item;
    });

    optionsSheet.state = 'veryHidden';

    const maxDataRows = Math.max(products.length + 100, 300);
    const typeLastRow = Math.max(capabilityTypeOptions.length + 1, 2);
    const industryLastRow = Math.max(industryOptions.length + 1, 2);
    const scenarioLastRow = Math.max(scenarioOptions.length + 1, 2);

    for (let rowIndex = 2; rowIndex <= maxDataRows; rowIndex += 1) {
      worksheet.getCell(rowIndex, typeColIndex).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'下拉选项'!$A$2:$A$${typeLastRow}`],
        showErrorMessage: true,
        errorTitle: '类型无效',
        error: '请从下拉选项中选择类型。',
      };
      worksheet.getCell(rowIndex, industryColIndex).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'下拉选项'!$B$2:$B$${industryLastRow}`],
        showErrorMessage: false,
        showInputMessage: true,
        promptTitle: '填写提示',
        prompt: '支持多选：多个适用行业请用英文逗号,分隔',
      };
      worksheet.getCell(rowIndex, scenarioColIndex).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'下拉选项'!$C$2:$C$${scenarioLastRow}`],
        showErrorMessage: false,
        showInputMessage: true,
        promptTitle: '填写提示',
        prompt: '支持多选：多个适用场景请用英文逗号,分隔',
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    anchor.href = url;
    anchor.download = `product-capabilities-${stamp}.xlsx`;
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
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        alert('导入失败：Excel 文件中未找到工作表。');
        return;
      }
      const sourceRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheetName], { defval: '' });

      if (!sourceRows.length) {
        alert('导入文件中未找到可用数据。');
        return;
      }

      const errors: string[] = [];
      const importedProducts: ProductCapability[] = [];

      sourceRows.forEach((row, index) => {
        const rowNo = index + 2;
        const rawId = getImportCellValue(row, IMPORT_FIELD_ALIASES.id);
        const rawName = getImportCellValue(row, IMPORT_FIELD_ALIASES.name);
        const rawType = getImportCellValue(row, IMPORT_FIELD_ALIASES.type);
        const rawIndustries = getImportCellValue(row, IMPORT_FIELD_ALIASES.industries);
        const rawScenarios = getImportCellValue(row, IMPORT_FIELD_ALIASES.scenarios);
        const rawDescription = getImportCellValue(row, IMPORT_FIELD_ALIASES.description);

        const name = normalizeLabel(String(rawName || '').trim());
        const type = normalizeImportedType(rawType);
        const industries = parseMultiValues(rawIndustries);
        const scenarios = parseMultiValues(rawScenarios);
        const description = String(rawDescription || '').trim();

        const rowHasContent = Boolean(
          name
          || String(rawType || '').trim()
          || industries.length
          || scenarios.length
          || description,
        );
        if (!rowHasContent) return;

        const rowErrors: string[] = [];
        if (!name) {
          rowErrors.push(`第 ${rowNo} 行：能力名称不能为空。`);
        }
        if (!type) {
          rowErrors.push(`第 ${rowNo} 行：类型无效，请填写“软件/硬件/咨询/改造施工”。`);
        }
        if (industryOptions.length) {
          const invalidIndustries = industries.filter((item) => !industryOptions.includes(item));
          if (invalidIndustries.length) {
            rowErrors.push(`第 ${rowNo} 行：适用行业无效（${invalidIndustries.join('、')}），请从模板下拉选项中选择。`);
          }
        }
        if (scenarioOptions.length) {
          const invalidScenarios = scenarios.filter((item) => !scenarioOptions.includes(item));
          if (invalidScenarios.length) {
            rowErrors.push(`第 ${rowNo} 行：适用场景无效（${invalidScenarios.join('、')}），请从模板下拉选项中选择。`);
          }
        }
        if (rowErrors.length) {
          errors.push(...rowErrors);
          return;
        }

        importedProducts.push({
          id: String(rawId || '').trim() || `pc-${Date.now()}-${index}`,
          type,
          name,
          industries,
          scenarios,
          description,
          createTime: new Date().toISOString(),
        });
      });

      if (errors.length) {
        const preview = errors.slice(0, 8).join('\n');
        const remain = errors.length > 8 ? `\n...其余 ${errors.length - 8} 条错误请检查 Excel。` : '';
        alert(`导入校验失败，请修正后重试：\n${preview}${remain}`);
        return;
      }

      if (!importedProducts.length) {
        alert('未识别到有效产品能力记录。');
        return;
      }

      const duplicateIds = dedupeStrings(
        importedProducts
          .map((item) => item.id)
          .filter((id, index, arr) => id && arr.indexOf(id) !== index),
      );
      if (duplicateIds.length) {
        const preview = duplicateIds.slice(0, 5).join('、');
        const remain = duplicateIds.length > 5 ? ` 等 ${duplicateIds.length} 个` : '';
        alert(`导入校验失败：Excel 中存在重复 ID（${preview}${remain}）。`);
        return;
      }

      const confirmed = window.confirm(`将使用 Excel 内容全量覆盖当前 ${products.length} 条数据，并更新为 ${importedProducts.length} 条，是否继续？`);
      if (!confirmed) return;

      setProducts(importedProducts);
      setSelectedIds([]);
      setEditingIds([]);
      alert(`Excel 导入成功，已全量更新 ${importedProducts.length} 条产品能力记录。`);
    } catch {
      alert('导入失败，请检查 Excel 格式和内容是否正确。');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <input ref={importInputRef} type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" onChange={handleImportFile} />

      <div className="rounded-2xl bg-gradient-to-r from-slate-50 via-white to-blue-50 p-5 border border-slate-200/80">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-blue-600" />
              产品能力维护
            </h2>
            <p className="text-slate-500 mt-1">支持行内编辑、字典多选、批量删除及 Excel 导入导出（导入为全量覆盖）。</p>
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
              新增能力
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




