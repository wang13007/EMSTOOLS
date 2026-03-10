import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '../constants';
import { Role, UserStatus, UserType } from '../types';
import Portal from '../src/components/Portal';
import { getRoleManagementRoleRecords, saveRoleManagementRoles } from '../src/services/roleLocalStore';

type PermissionAction = {
  key: string;
  label: string;
};

type PermissionSubMenu = {
  label: string;
  actions: PermissionAction[];
};

type PermissionMenuGroup = {
  title: string;
  items: PermissionSubMenu[];
};

const MENU_PERMISSION_GROUPS: PermissionMenuGroup[] = [
  {
    title: '售前综合看板',
    items: [
      {
        label: '售前综合看板',
        actions: [{ key: 'dashboard:view', label: '查看' }],
      },
    ],
  },
  {
    title: '客户调研管理',
    items: [
      {
        label: '调研表单列表',
        actions: [
          { key: 'survey_form:view', label: '查看' },
          { key: 'survey_form:create', label: '新建' },
          { key: 'survey_form:edit', label: '编辑' },
          { key: 'survey_form:delete', label: '删除' },
          { key: 'survey_form:submit', label: '提交' },
          { key: 'survey_form:generate_report', label: '生成报告' },
          { key: 'survey_form:view_report', label: '查看报告' },
          { key: 'survey_form:share_report', label: '分享报告' },
          { key: 'survey_form:export_report', label: '导出报告' },
        ],
      },
      {
        label: '调研模板管理',
        actions: [
          { key: 'survey_template:view', label: '查看' },
          { key: 'survey_template:rename', label: '修改名称' },
        ],
      },
    ],
  },
  {
    title: '产品方案管理',
    items: [
      {
        label: '产品能力维护',
        actions: [
          { key: 'capability:view', label: '查看' },
          { key: 'capability:create', label: '新增' },
          { key: 'capability:edit', label: '编辑' },
          { key: 'capability:delete', label: '删除' },
          { key: 'capability:import', label: '导入' },
          { key: 'capability:export', label: '导出' },
        ],
      },
      {
        label: '报告模板管理',
        actions: [
          { key: 'report_template:view', label: '查看' },
          { key: 'report_template:rename', label: '修改名称' },
        ],
      },
    ],
  },
  {
    title: '系统设置',
    items: [
      {
        label: '用户管理',
        actions: [
          { key: 'user:view', label: '查看' },
          { key: 'user:create', label: '新增' },
          { key: 'user:edit', label: '编辑' },
          { key: 'user:delete', label: '删除' },
        ],
      },
      {
        label: '角色管理',
        actions: [
          { key: 'role:view', label: '查看' },
          { key: 'role:create', label: '新增' },
          { key: 'role:edit', label: '编辑' },
          { key: 'role:delete', label: '删除' },
        ],
      },
      {
        label: '售前配置',
        actions: [
          { key: 'pre_sales:view', label: '查看' },
          { key: 'pre_sales:edit', label: '编辑' },
        ],
      },
      {
        label: '字典管理',
        actions: [
          { key: 'dictionary:view', label: '查看' },
          { key: 'dictionary:create', label: '新增' },
          { key: 'dictionary:edit', label: '编辑' },
          { key: 'dictionary:delete', label: '删除' },
        ],
      },
      {
        label: '消息中心',
        actions: [
          { key: 'message:view', label: '查看' },
          { key: 'message:mark_read', label: '标记已读' },
        ],
      },
      {
        label: '日志管理',
        actions: [
          { key: 'logs:view', label: '查看' },
          { key: 'logs:export', label: '导出' },
        ],
      },
    ],
  },
];

const ORDERED_PERMISSION_KEYS = MENU_PERMISSION_GROUPS.flatMap((menu) =>
  menu.items.flatMap((item) => item.actions.map((action) => action.key))
);

const PERMISSION_LABEL_MAP = new Map(
  MENU_PERMISSION_GROUPS.flatMap((menu) =>
    menu.items.flatMap((item) =>
      item.actions.map((action) => [action.key, `${item.label}:${action.label}`] as const)
    )
  )
);

const LEGACY_PERMISSION_KEY_MAP: Record<string, string[]> = {
  'dashboard:view': ['dashboard:view'],
  'survey:view': ['survey_form:view'],
  'survey:create': ['survey_form:create'],
  'survey:edit': ['survey_form:edit'],
  'survey:delete': ['survey_form:delete'],
  'report:view': ['survey_form:view_report'],
  'report:generate': ['survey_form:generate_report'],
  'product:edit': ['capability:edit'],
  'system:users': ['user:view'],
  'system:roles': ['role:view'],
  'system:config': ['pre_sales:view', 'dictionary:view', 'message:view'],
  'system:logs': ['logs:view'],
};

const buildPermissionRecord = (keys: string[]) => {
  return keys.reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});
};

const normalizePermissionRecord = (permissions: Record<string, boolean> | undefined) => {
  const normalized: Record<string, boolean> = {};
  Object.entries(permissions || {}).forEach(([key, enabled]) => {
    if (!enabled) return;
    const mappedKeys = LEGACY_PERMISSION_KEY_MAP[key];
    if (mappedKeys?.length) {
      mappedKeys.forEach((targetKey) => {
        normalized[targetKey] = true;
      });
      return;
    }
    normalized[key] = true;
  });
  return normalized;
};

const getEnabledPermissionLabels = (permissions: Record<string, boolean> | undefined) => {
  const normalized = normalizePermissionRecord(permissions);
  const known: string[] = [];
  const unknown: string[] = [];
  const knownKeySet = new Set(ORDERED_PERMISSION_KEYS);

  ORDERED_PERMISSION_KEYS.forEach((key) => {
    if (normalized[key]) {
      known.push(PERMISSION_LABEL_MAP.get(key) || key);
    }
  });

  Object.keys(normalized).forEach((key) => {
    if (!knownKeySet.has(key)) {
      unknown.push(key);
    }
  });

  return [...known, ...unknown];
};

const INITIAL_ROLES: Role[] = [
  {
    id: 'role-1',
    name: '超级管理员',
    description: '拥有系统全部模块访问权限。',
    type: UserType.INTERNAL,
    status: UserStatus.ENABLED,
    createTime: '2023-01-01',
    permissions: buildPermissionRecord(ORDERED_PERMISSION_KEYS),
  },
  {
    id: 'role-2',
    name: '售前工程师',
    description: '负责调研、填写与报告生成。',
    type: UserType.INTERNAL,
    status: UserStatus.ENABLED,
    createTime: '2023-05-12',
    permissions: buildPermissionRecord([
      'dashboard:view',
      'survey_form:view',
      'survey_form:create',
      'survey_form:edit',
      'survey_form:submit',
      'survey_form:generate_report',
      'survey_form:view_report',
      'survey_form:share_report',
      'survey_form:export_report',
      'survey_template:view',
      'capability:view',
      'capability:edit',
      'capability:import',
      'capability:export',
      'report_template:view',
      'user:view',
      'role:view',
      'pre_sales:view',
      'message:view',
    ]),
  },
  {
    id: 'role-3',
    name: '外部客户',
    description: '仅可访问授权范围内调研表单。',
    type: UserType.EXTERNAL,
    status: UserStatus.ENABLED,
    createTime: '2024-02-15',
    permissions: buildPermissionRecord([
      'survey_form:view',
      'survey_form:submit',
      'survey_form:view_report',
      'survey_form:share_report',
      'survey_form:export_report',
    ]),
  },
];

const PRESET_ROLE_IDS = new Set(['role-1', 'role-2', 'role-3']);

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  useEffect(() => {
    const localRoles = getRoleManagementRoleRecords();
    if (Array.isArray(localRoles) && localRoles.length > 0) {
      const defaultRoleMap = new Map(INITIAL_ROLES.map((r) => [r.id, r]));
      const normalized = localRoles.map((role: any) => {
        const defaults = defaultRoleMap.get(role.id);
        return {
          ...(defaults || {}),
          ...role,
          permissions: normalizePermissionRecord(role.permissions || defaults?.permissions || {}),
          status: role.status || defaults?.status || UserStatus.ENABLED,
          type: role.type || defaults?.type || UserType.INTERNAL,
          createTime: role.createTime || defaults?.createTime || new Date().toISOString().slice(0, 10),
        } as Role;
      });
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

    const normalizedPermissions = normalizePermissionRecord(editingRole.permissions || {});

    if (editingRole.id) {
      const updatedRole = {
        ...editingRole,
        permissions: normalizedPermissions,
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
        permissions: normalizedPermissions,
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

  const rolePreviewMap = useMemo(() => {
    return roles.reduce<Record<string, string[]>>((acc, role) => {
      acc[role.id] = getEnabledPermissionLabels(role.permissions);
      return acc;
    }, {});
  }, [roles]);

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
          <p className="text-slate-500">按左侧菜单结构分配角色权限，并可细化到菜单操作级别。</p>
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
        {roles.map((role) => {
          const labels = rolePreviewMap[role.id] || [];
          const shownLabels = labels.slice(0, 6);
          const remainCount = labels.length - shownLabels.length;
          return (
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
                  {shownLabels.map((label) => (
                    <span key={`${role.id}_${label}`} className="px-2 py-1 bg-slate-100 rounded text-[10px] font-medium text-slate-600">
                      {label}
                    </span>
                  ))}
                  {remainCount > 0 && (
                    <span className="px-2 py-1 bg-blue-50 rounded text-[10px] font-semibold text-blue-700">
                      +{remainCount}
                    </span>
                  )}
                  {!labels.length && <span className="text-xs text-slate-400">未授权任何权限</span>}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-medium">创建于 {role.createTime}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingRole({ ...role, permissions: normalizePermissionRecord(role.permissions) });
                      setIsModalOpen(true);
                    }}
                    className="text-blue-600 font-bold text-xs hover:underline"
                  >
                    编辑权限
                  </button>
                  <button
                    onClick={() => {
                      if (PRESET_ROLE_IDS.has(role.id)) {
                        setSaveSuccessMessage('预置角色不可删除');
                        window.setTimeout(() => setSaveSuccessMessage(''), 3000);
                        return;
                      }
                      if (window.confirm('确定要删除该角色吗？')) {
                        saveRoles(roles.filter((r) => r.id !== role.id));
                      }
                    }}
                    disabled={PRESET_ROLE_IDS.has(role.id)}
                    className={`font-bold text-xs ${PRESET_ROLE_IDS.has(role.id) ? 'text-slate-300 cursor-not-allowed' : 'text-rose-600 hover:underline'}`}
                  >
                    {PRESET_ROLE_IDS.has(role.id) ? '预置角色' : '删除'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp flex flex-col">
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
                  <div className="space-y-5">
                    {MENU_PERMISSION_GROUPS.map((group) => (
                      <div key={group.title} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">{group.title}</h4>
                        <div className="space-y-3">
                          {group.items.map((item) => (
                            <div key={`${group.title}_${item.label}`} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                              <p className="text-xs font-semibold text-slate-500 mb-2">{item.label}</p>
                              <div className="flex flex-wrap gap-x-5 gap-y-2">
                                {item.actions.map((action) => (
                                  <label key={action.key} className="inline-flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!editingRole?.permissions?.[action.key]}
                                      onChange={() => togglePermission(action.key)}
                                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">{action.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
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
