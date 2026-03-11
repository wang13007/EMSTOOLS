import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ICONS } from '../constants';
import { Role, UserStatus, UserType } from '../types';
import Portal from '../src/components/Portal';
import { roleService } from '../src/services/supabaseService';

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

const normalizeRoleType = (value: any): UserType => {
  const raw = String(value ?? '').trim();
  const normalized = raw.toLowerCase();
  if (normalized === UserType.INTERNAL || normalized.includes('internal') || raw.includes('内部')) {
    return UserType.INTERNAL;
  }
  if (normalized === UserType.EXTERNAL || normalized.includes('external') || raw.includes('外部') || raw.includes('客户')) {
    return UserType.EXTERNAL;
  }
  return UserType.INTERNAL;
};

const normalizeRoleStatus = (value: any): UserStatus => {
  return String(value ?? '').toLowerCase() === UserStatus.DISABLED ? UserStatus.DISABLED : UserStatus.ENABLED;
};

const normalizeRoleRecord = (role: any): Role => {
  return {
    id: String(role?.id || ''),
    name: String(role?.name || ''),
    description: String(role?.description || ''),
    type: normalizeRoleType(role?.type || role?.user_type),
    permissions: normalizePermissionRecord(role?.permissions || {}),
    status: normalizeRoleStatus(role?.status),
    createTime: role?.create_time
      ? new Date(role.create_time).toISOString().slice(0, 10)
      : role?.createTime || new Date().toISOString().slice(0, 10),
  };
};

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const roleList = await roleService.getRoles();
      setRoles((roleList || []).map(normalizeRoleRecord));
    } catch (loadError) {
      console.error('加载角色失败:', loadError);
      setError('加载角色失败，请检查数据库 roles 表配置。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

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

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const openCreateModal = () => {
    setEditingRole({
      name: '',
      description: '',
      type: UserType.INTERNAL,
      status: UserStatus.ENABLED,
      permissions: {},
    });
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole({
      ...role,
      permissions: normalizePermissionRecord(role.permissions),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole?.name || saving) return;

    const name = editingRole.name.trim();
    if (!name) {
      setError('角色名称不能为空。');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        name,
        description: editingRole.description || '',
        type: editingRole.type || UserType.INTERNAL,
        user_type: editingRole.type || UserType.INTERNAL,
        permissions: normalizePermissionRecord(editingRole.permissions || {}),
        status: normalizeRoleStatus(editingRole.status),
      };

      if (editingRole.id) {
        const updated = await roleService.updateRole(editingRole.id, payload);
        if (!updated) throw new Error('角色更新失败，请检查数据库 roles 表。');
        setSaveSuccessMessage('角色权限更新成功');
      } else {
        const created = await roleService.createRole(payload);
        if (!created) throw new Error('角色创建失败，请检查数据库 roles 表。');
        setSaveSuccessMessage('角色创建成功');
      }

      setIsModalOpen(false);
      setEditingRole(null);
      window.setTimeout(() => setSaveSuccessMessage(''), 3000);
      await loadRoles();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : '角色保存失败，请稍后重试。';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (saving) return;
    if (!window.confirm(`确定要删除角色「${role.name}」吗？`)) return;

    setSaving(true);
    setError('');
    try {
      const ok = await roleService.deleteRole(role.id);
      if (!ok) {
        throw new Error('删除角色失败：可能是预置角色不可删除，或该角色已被引用。');
      }
      setSaveSuccessMessage('角色删除成功');
      window.setTimeout(() => setSaveSuccessMessage(''), 3000);
      await loadRoles();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : '删除角色失败，请稍后重试。';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {saveSuccessMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {saveSuccessMessage}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">角色管理</h2>
          <p className="text-slate-500">角色数据直接来自数据库 roles 表，和用户管理使用同一数据源。</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={saving || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-60"
        >
          <ICONS.Plus className="w-4 h-4" />
          新增角色
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-400">加载中...</div>
      ) : roles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-400">暂无角色数据</div>
      ) : (
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
                      <span className="px-2 py-1 bg-blue-50 rounded text-[10px] font-semibold text-blue-700">+{remainCount}</span>
                    )}
                    {!labels.length && <span className="text-xs text-slate-400">未授权任何权限</span>}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-medium">创建于 {role.createTime}</span>
                  <div className="flex gap-3">
                    <button onClick={() => openEditModal(role)} disabled={saving} className="text-blue-600 font-bold text-xs hover:underline disabled:text-slate-300 disabled:no-underline">
                      编辑权限
                    </button>
                    <button onClick={() => void handleDelete(role)} disabled={saving} className="text-rose-600 font-bold text-xs hover:underline disabled:text-slate-300 disabled:no-underline">
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp flex flex-col">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-slate-900">{editingRole?.id ? '编辑角色权限' : '新增角色'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <ICONS.Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <form className="flex-1 overflow-y-auto p-8 space-y-6" onSubmit={handleSave}>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">角色名称 <span className="text-rose-600">*</span></label>
                  <input
                    required
                    value={editingRole?.name || ''}
                    onChange={(e) => setEditingRole((prev) => ({ ...(prev || {}), name: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="例如：实施经理"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">角色描述</label>
                  <textarea
                    value={editingRole?.description || ''}
                    onChange={(e) => setEditingRole((prev) => ({ ...(prev || {}), description: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">类型 <span className="text-rose-600">*</span></label>
                    <select
                      required
                      value={editingRole?.type || UserType.INTERNAL}
                      onChange={(e) => setEditingRole((prev) => ({ ...(prev || {}), type: e.target.value as UserType }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value={UserType.INTERNAL}>内部用户</option>
                      <option value={UserType.EXTERNAL}>外部客户</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">状态 <span className="text-rose-600">*</span></label>
                    <select
                      required
                      value={editingRole?.status || UserStatus.ENABLED}
                      onChange={(e) => setEditingRole((prev) => ({ ...(prev || {}), status: e.target.value as UserStatus }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value={UserStatus.ENABLED}>启用</option>
                      <option value={UserStatus.DISABLED}>禁用</option>
                    </select>
                  </div>
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
                  <button type="button" onClick={closeModal} className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">
                    取消
                  </button>
                  <button type="submit" disabled={saving} className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 disabled:opacity-60">
                    {saving ? '保存中...' : '保存角色'}
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
