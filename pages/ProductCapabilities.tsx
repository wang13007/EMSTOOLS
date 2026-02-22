
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { ProductCapability, ProductType } from '../types';

// 暂时使用模拟服务，后续可从数据库获取
export const productService = {
  // 模拟获取产品能力列表
  async getProducts() {
    // 这里可以从数据库获取产品能力数据
    // 暂时使用模拟数据
    return [
      { 
        id: '1', 
        name: '智能能效分析平台 (EMS)', 
        type: '软件', 
        industries: ['制造业', '商业综合体', '园区'], 
        scenarios: ['能耗分析', '节能诊断'], 
        description: '核心 EMS 软件，支持多维度能效看板与 AI 诊断。',
        create_time: new Date().toISOString()
      },
      { 
        id: '2', 
        name: '边缘计算采集网关 (EC-100)', 
        type: '硬件', 
        industries: ['通用'], 
        scenarios: ['数据采集', '协议转换'], 
        description: '支持 Modbus, BACnet 等多种协议接入。',
        create_time: new Date().toISOString()
      },
      { 
        id: '3', 
        name: '碳管理咨询服务', 
        type: '咨询', 
        industries: ['出口制造'], 
        scenarios: ['碳中和', 'CBAM 应对'], 
        description: '提供组织碳核算与产品碳足迹报告服务。',
        create_time: new Date().toISOString()
      },
    ];
  }
};

export const ProductCapabilities: React.FC = () => {
  const [products, setProducts] = useState<ProductCapability[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCapability | null>(null);

  useEffect(() => {
    // 从数据库获取产品能力列表
    const fetchProducts = async () => {
      const productList = await productService.getProducts();
      // 转换数据格式以匹配前端类型
      const formattedProducts = productList.map(product => ({
        id: product.id,
        name: product.name,
        type: product.type === '软件' ? ProductType.SOFTWARE : 
              product.type === '硬件' ? ProductType.HARDWARE : ProductType.CONSULTING,
        industries: product.industries,
        scenarios: product.scenarios,
        description: product.description,
        createTime: product.create_time ? new Date(product.create_time).toISOString() : ''
      }));
      setProducts(formattedProducts);
    };

    fetchProducts();
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除该产品能力吗？')) {
      // 这里可以调用服务方法删除产品能力
      // 暂时只更新本地状态
      setProducts(products.filter(p => p.id !== id));
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">产品能力维护</h2>
          <p className="text-slate-500">管理系统支持的软硬件能力库，用于智能生成调研后的解决方案建议。</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <ICONS.Plus className="w-4 h-4" />
          新增产品能力
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase text-white ${
              p.type === ProductType.SOFTWARE ? 'bg-blue-600' : 
              p.type === ProductType.HARDWARE ? 'bg-emerald-600' : 'bg-purple-600'
            }`}>
              {p.type}
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              {p.type === ProductType.SOFTWARE ? <ICONS.Report /> : p.type === ProductType.HARDWARE ? <ICONS.Box /> : <ICONS.Dictionary />}
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{p.name}</h3>
            <p className="text-xs text-slate-500 mb-4 line-clamp-2 h-8">{p.description}</p>
            
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">适用行业</span>
                <div className="flex flex-wrap gap-1">
                  {p.industries.map(i => <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">{i}</span>)}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">典型场景</span>
                <div className="flex flex-wrap gap-1">
                  {p.scenarios.map(s => <span key={s} className="px-2 py-0.5 bg-blue-50 rounded text-[10px] text-blue-600">{s}</span>)}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEdit(p)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                修改
              </button>
              <button 
                onClick={() => handleDelete(p.id)}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingProduct ? '编辑产品能力' : '新增产品能力'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form className="p-8 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const product: ProductCapability = {
                id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
                name: formData.get('name') as string,
                type: formData.get('type') as ProductType,
                industries: (formData.get('industries') as string).split(',').map(s => s.trim()),
                scenarios: (formData.get('scenarios') as string).split(',').map(s => s.trim()),
                description: formData.get('description') as string,
                createTime: editingProduct?.createTime || new Date().toISOString()
              };
              if (editingProduct) {
                setProducts(products.map(p => p.id === product.id ? product : p));
              } else {
                setProducts([...products, product]);
              }
              setIsModalOpen(false);
            }}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">产品名称</label>
                <input name="name" required defaultValue={editingProduct?.name} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">产品类型</label>
                <select name="type" required defaultValue={editingProduct?.type} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.values(ProductType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">适用行业 (逗号分隔)</label>
                <input name="industries" required defaultValue={editingProduct?.industries.join(', ')} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">典型场景 (逗号分隔)</label>
                <input name="scenarios" required defaultValue={editingProduct?.scenarios.join(', ')} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">产品描述</label>
                <textarea name="description" required rows={3} defaultValue={editingProduct?.description} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">取消</button>
                <button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
