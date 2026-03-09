import React, { useEffect, useState } from 'react';
import { ICONS } from '../constants';
import { ProductCapability, ProductType } from '../types';
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

// 临时使用模拟服务，后续可替换为真实 API
export const productService = {
  async getProducts(): Promise<ProductCapabilityRecord[]> {
    return [
      {
        id: '1',
        name: '智能能效分析平台 (EMS)',
        type: ProductType.SOFTWARE,
        industries: ['制造业', '商业综合体', '园区'],
        scenarios: ['能耗分析', '节能诊断'],
        description: '核心 EMS 软件，支持多维度看板与智能诊断。',
        create_time: new Date().toISOString(),
      },
      {
        id: '2',
        name: '边缘计算采集网关 (EC-100)',
        type: ProductType.HARDWARE,
        industries: ['通用'],
        scenarios: ['数据采集', '协议转换'],
        description: '支持 Modbus、BACnet 等多种协议接入。',
        create_time: new Date().toISOString(),
      },
      {
        id: '3',
        name: '碳管理咨询服务',
        type: ProductType.CONSULTING,
        industries: ['出口制造'],
        scenarios: ['碳中和', 'CBAM 应对'],
        description: '提供组织碳核算与产品碳足迹咨询服务。',
        create_time: new Date().toISOString(),
      },
    ];
  },
};

export const ProductCapabilities: React.FC = () => {
  const [products, setProducts] = useState<ProductCapability[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCapability | null>(null);

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

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除该产品能力吗？')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleEdit = (product: ProductCapability) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const getTypeBadgeClass = (type: ProductType) => {
    if (type === ProductType.SOFTWARE) return 'bg-blue-600';
    if (type === ProductType.HARDWARE) return 'bg-emerald-600';
    return 'bg-purple-600';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">产品能力维护</h2>
          <p className="text-slate-500">管理系统支持的软件、硬件与咨询能力，用于调研后方案生成。</p>
        </div>

        <div className="flex items-center">
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <ICONS.Plus className="w-4 h-4" />
            新增产品能力
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${getTypeBadgeClass(p.type)}`}>
                    {p.type}
                  </span>
                  <h3 className="font-bold text-slate-900 truncate">{p.name}</h3>
                </div>
                <p className="text-sm text-slate-500">{p.description}</p>
              </div>

              <div className="flex items-center justify-end gap-3 shrink-0">
                <button onClick={() => handleEdit(p)} className="text-xs font-bold text-blue-600 hover:underline">
                  修改
                </button>
                <button onClick={() => handleDelete(p.id)} className="text-xs font-bold text-rose-600 hover:underline">
                  删除
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">适用行业</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.industries.map((i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                      {i}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">典型场景</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.scenarios.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-blue-50 rounded text-xs text-blue-600">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">{editingProduct ? '编辑产品能力' : '新增产品能力'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form
                className="p-8 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const product: ProductCapability = {
                    id: editingProduct?.id || Math.random().toString(36).slice(2, 11),
                    name: String(formData.get('name') || ''),
                    type: formData.get('type') as ProductType,
                    industries: String(formData.get('industries') || '')
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                    scenarios: String(formData.get('scenarios') || '')
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                    description: String(formData.get('description') || ''),
                    createTime: editingProduct?.createTime || new Date().toISOString(),
                  };

                  if (editingProduct) {
                    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
                  } else {
                    setProducts((prev) => [...prev, product]);
                  }
                  setIsModalOpen(false);
                }}
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    产品名称 <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    defaultValue={editingProduct?.name}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    产品类型 <span className="text-rose-600">*</span>
                  </label>
                  <select
                    name="type"
                    required
                    defaultValue={editingProduct?.type}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {Object.values(ProductType).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    适用行业（逗号分隔） <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="industries"
                    required
                    defaultValue={editingProduct?.industries.join(', ')}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    典型场景（逗号分隔） <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="scenarios"
                    required
                    defaultValue={editingProduct?.scenarios.join(', ')}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    产品描述 <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    defaultValue={editingProduct?.description}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                  >
                    取消
                  </button>
                  <button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">
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
