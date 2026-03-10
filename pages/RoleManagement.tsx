import React, { useEffect, useState } from 'react';
import { ICONS } from '../constants';
import { Role, UserStatus, UserType } from '../types';
import Portal from '../src/components/Portal';
import { getRoleManagementRoleRecords, saveRoleManagementRoles } from '../src/services/roleLocalStore';

const INITIAL_ROLES: Role[] = [
  {
    id: 'role-1',
    name: '超级管理员',
    description: '拥有系统全部模块访问权限。',
    type: UserType.INTERNAL,
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
      'system:logs': true,
    },
  },
  {
    id: 'role-2',
    name: '售前工程师',
    description: '负责调研、填写与报告生成。',
    type: UserType.INTERNAL,
    status: UserStatus.ENABLED,
    createTime: '2023-05-12',
    permissions: {
      'dashboard:view': true,
      'survey:view': true,
      'survey:create': true,
      'survey:edit': true,
      'report:view': true,
      'report:generate': true,
      'product:edit': true,
    },
  },
  {
    id: 'role-3',
    name: '外部客户',
    description: '仅可访问授权范围内调研表单。',
    type: UserType.EXTERNAL,
    status: UserStatus.ENABLED,
    createTime: '2024-02-15',
    permissions: {
      'dashboard:view': true,
      'survey:view': true,
      'report:view': true,
    },
  },
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
    ],
  },
  {
    title: '报告与方案',
    items: [
      { key: 'report:view', label: '查看评估报告' },
      { key: 'report:generate', label: '生成 AI 报告' },
      { key: 'product:edit', label: '维护产品能力' },
    ],
  },
  {
    title: '系统管理',
    items: [
      { key: 'system:users', label: '用户管理' },
      { key: 'system:roles', label: '角色管理' },
      { key: 'system:config', label: '系统配置' },
      { key: 'system:logs', label: '查看日志' },
    ],
  },
];

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  useEffect(() => {
    const localRoles = getRoleManagementRoleRecords();
    if (Array.isArray(localRoles) && localRoles.length > 0) {
      const defaultRoleMap = new Map(INITIAL_ROLES.map((r) => [r.id, r]));
      const normalized = localRoles.map((role: any) => ({
        ...(defaultRoleMap.get(role.id) || {}),
        ...role,
        permissions: role.permissions || defaultRoleMap.get(role.id)?.permissions || {},
        status: role.status || defaultRoleMap.get(role.id)?.status || UserStatus.ENABLED,
        type: role.type || defaultRoleMap.get(role.id)?.type || UserType.INTERNAL,
        createTime: role.createTime || defaultRoleMap.get(role.id)?.createTime || new Date().toISOString().slice(0, 10),
      })) as Role[];
      setRoles(normalized);
      return;
    }

    setRoles(INITIAL_ROLES);
    saveRoleManagementRoles(INITIAL_ROLES);
  }, []);

  const saveRoles = (newRoles: Role[]) => {
    setRoles(newRoles);
    saveRoleManagementRoles(newRoles);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole?.name) return;

    if (editingRole.id) {
      const updatedRole = {
        ...editingRole,
        permissions: editingRole.permissions || {},
        status: editingRole.status || UserStatus.ENABLED,
      } as Role;
      saveRoles(roles.map((r) => (r.id === editingRole.id ? updatedRole : r)));
      setSaveSuccessMessage('角色权限更新成功');
    } else {
      const newRole: Role = {
        id: `role-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: editingRole.name,
        description: editingRole.description || '',
        type: editingRole.type || UserType.INTERNAL,
        permissions: editingRole.permissions || {},
        status: UserStatus.ENABLED,
        createTime: new Date().toISOString().slice(0, 10),
      };
      saveRoles([...roles, newRole]);
      setSaveSuccessMessage('角色创建成功');
    }

    setIsModalOpen(false);
    setEditingRole(null);
    window.setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  const togglePermission = (key: string) => {
    if (!editingRole) return;
    const permissions = { ...(editingRole.permissions || {}) };
    permissions[key] = !permissions[key];
    setEditingRole({ ...editingRole, permissions });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {saveSuccessMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {saveSuccessMessage}
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">角色管理</h2>
          <p className="text-slate-500">定义系统角色并分配功能权限。</p>
        </div>
        <button
          onClick={() => {
            setEditingRole({ permissions: {} });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          <ICONS.Plus className="w-4 h-4" />
          新增角色
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-slate-900">{role.name}</h3>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${role.type === UserType.INTERNAL ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    {role.type === UserType.INTERNAL ? '内部' : '外部'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${role.status === UserStatus.ENABLED ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {role.status === UserStatus.ENABLED ? '启用' : '禁用'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 h-10">{role.description || '-'}</p>
            </div>

            <div className="p-6 flex-1">
              <div className="flex flex-wrap gap-2">
                {Object.entries(role.permissions || {})
                  .filter(([_, v]) => v)
                  .slice(0, 4)
                  .map(([k]) => (
                    <span key={k} className="px-2 py-1 bg-slate-100 rounded text-[10px] font-medium text-slate-600">
                      {k.split(':')[1]}
                    </span>
                  ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-medium">创建于 {role.createTime}</span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingRole(role);
                    setIsModalOpen(true);
                  }}
                  className="text-blue-600 font-bold text-xs hover:underline"
                >
                  编辑权限
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('确定要删除该角色吗？')) {
                      saveRoles(roles.filter((r) => r.id !== role.id));
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
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">角色名称 <span className="text-rose-600">*</span></label>
                  <input
                    required
                    value={editingRole?.name || ''}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="例如：实施经理"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">角色描述</label>
                  <textarea
                    value={editingRole?.description || ''}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">类型 <span className="text-rose-600">*</span></label>
                  <select
                    required
                    value={editingRole?.type || UserType.INTERNAL}
                    onChange={(e) => setEditingRole({ ...editingRole, type: e.target.value as UserType })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={UserType.INTERNAL}>内部用户</option>
                    <option value={UserType.EXTERNAL}>外部客户</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase block">功能权限分配</label>
                  <div className="space-y-6">
                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group.title} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700 mb-4">{group.title}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {group.items.map((item) => (
                            <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!editingRole?.permissions?.[item.key]}
                                onChange={() => togglePermission(item.key)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-600 font-medium">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">
                    取消
                  </button>
                  <button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">
                    保存角色
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
