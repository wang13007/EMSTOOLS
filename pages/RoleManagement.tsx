
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { Role, UserStatus } from '../types';
import { roleService } from '../src/services/supabaseService';
import Portal from '../src/components/Portal';

const INITIAL_ROLES: Role[] = [
  {
    id: 'role-1',
    name: '超级管理员',
    description: '拥有系统所有模块的完全访问权限，包括系统设置、用户管理和数据删除。',
    status: UserStatus.ENABLED,
    createTime: '2023-01-01',
    permissions: {
      'dashboard:view': true,
      'survey:view': true,
      'survey:create': true,
      'survey:edit': true,
      'survey:delete': true,
      'report:view': true,
      'report:generate': true,
      'system:users': true,
      'system:roles': true,
      'system:config': true,
    }
  },
  {
    id: 'role-2',
    name: '售前工程师',
    description: '负责现场调研、表单填写和报告生成。无法访问系统管理模块。',
    status: UserStatus.ENABLED,
    createTime: '2023-05-12',
    permissions: {
      'dashboard:view': true,
      'survey:view': true,
      'survey:create': true,
      'survey:edit': true,
      'report:view': true,
      'report:generate': true,
    }
  },
  {
    id: 'role-3',
    name: '外部客户',
    description: '仅能查看与其关联的调研表单和生成的评估报告。',
    status: UserStatus.ENABLED,
    createTime: '2024-02-15',
    permissions: {
      'dashboard:view': true,
      'survey:view': true,
      'report:view': true,
    }
  }
];

const PERMISSION_GROUPS = [
  {
    title: '看板与调研',
    items: [
      { key: 'dashboard:view', label: '查看看板统计' },
      { key: 'survey:view', label: '查看调研列表' },
      { key: 'survey:create', label: '新建调研表单' },
      { key: 'survey:edit', label: '编辑调研表单' },
      { key: 'survey:delete', label: '删除调研表单' },
    ]
  },
  {
    title: '报告与方案',
    items: [
      { key: 'report:view', label: '查看评估报告' },
      { key: 'report:generate', label: '生成 AI 报告' },
      { key: 'product:edit', label: '维护产品能力' },
    ]
  },
  {
    title: '系统管理',
    items: [
      { key: 'system:users', label: '用户账号管理' },
      { key: 'system:roles', label: '角色权限管理' },
      { key: 'system:config', label: '系统参数配置' },
      { key: 'system:logs', label: '查看系统日志' },
    ]
  }
];

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);

  useEffect(() => {
    // 直接使用默认角色数据，避免从数据库获取角色导致的无限递归问题
    setRoles(INITIAL_ROLES);
  }, []);

  const saveRoles = async (newRoles: Role[]) => {
    setRoles(newRoles);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole?.name) return;

    try {
      if (editingRole.id) {
        // 更新现有角色（只更新本地状态）
        const updatedRole = {
          ...editingRole,
          permissions: editingRole.permissions || {},
          status: editingRole.status || UserStatus.ENABLED
        } as Role;
        
        saveRoles(roles.map(r => r.id === editingRole.id ? updatedRole : r));
      } else {
        // 创建新角色（只更新本地状态）
        const newRole: Role = {
          id: `role-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: editingRole.name,
          description: editingRole.description || '',
          permissions: editingRole.permissions || {},
          status: UserStatus.ENABLED,
          createTime: new Date().toISOString().split('T')[0]
        };
        
        saveRoles([...roles, newRole]);
      }
      setIsModalOpen(false);
      setEditingRole(null);
    } catch (error) {
      console.error('保存角色失败:', error);
      alert('保存角色失败，请重试');
    }
  };

  const togglePermission = (key: string) => {
    if (!editingRole) return;
    const permissions = { ...(editingRole.permissions || {}) };
    permissions[key] = !permissions[key];
    setEditingRole({ ...editingRole, permissions });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">角色管理</h2>
          <p className="text-slate-500">定义系统角色并分配功能权限，确保数据安全与职责分离。</p>
        </div>
        <button 
          onClick={() => { setEditingRole({ permissions: {} }); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          <ICONS.Plus className="w-4 h-4" />
          新增角色
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-slate-900">{role.name}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${role.status === UserStatus.ENABLED ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {role.status === UserStatus.ENABLED ? '启用' : '禁用'}
                </span>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 h-10">{role.description}</p>
            </div>
            <div className="p-6 flex-1">
              <div className="flex flex-wrap gap-2">
                {Object.entries(role.permissions).filter(([_, v]) => v).slice(0, 4).map(([k]) => (
                  <span key={k} className="px-2 py-1 bg-slate-100 rounded text-[10px] font-medium text-slate-600">
                    {k.split(':')[1]}
                  </span>
                ))}
                {Object.values(role.permissions).filter(v => v).length > 4 && (
                  <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-medium text-slate-400">
                    +{Object.values(role.permissions).filter(v => v).length - 4}
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-medium">创建于 {role.createTime}</span>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setEditingRole(role); setIsModalOpen(true); }}
                  className="text-blue-600 font-bold text-xs hover:underline"
                >
                  编辑权限
                </button>
                <button 
                  onClick={async () => {
                    if (window.confirm('确定要删除该角色吗？')) {
                      // 只更新本地状态，避免与数据库交互
                      saveRoles(roles.filter(r => r.id !== role.id));
                    }
                  }}
                  className="text-rose-600 font-bold text-xs hover:underline"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp flex flex-col">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-slate-900">{editingRole?.id ? '编辑角色权限' : '新增角色'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <ICONS.Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <form className="flex-1 overflow-y-auto p-8 space-y-6" onSubmit={handleSave}>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">角色名称</label>
                    <input 
                      name="name" 
                      required 
                      value={editingRole?.name || ''} 
                      onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                      placeholder="例如: 售前专家"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">角色描述</label>
                    <textarea 
                      name="description" 
                      value={editingRole?.description || ''} 
                      onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                      placeholder="简要描述该角色的职责与权限范围..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase block">功能权限分配</label>
                  <div className="space-y-6">
                    {PERMISSION_GROUPS.map(group => (
                      <div key={group.title} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                          <span className="w-1 h-4 bg-blue-600 rounded-full" />
                          {group.title}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {group.items.map(item => (
                            <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                              <div 
                                onClick={() => togglePermission(item.key)}
                                className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                                  editingRole?.permissions?.[item.key] 
                                    ? 'bg-blue-600 border-blue-600' 
                                    : 'border-slate-300 bg-white group-hover:border-blue-400'
                                }`}
                              >
                                {editingRole?.permissions?.[item.key] && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm text-slate-600 font-medium">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">取消</button>
                  <button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">保存角色</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
