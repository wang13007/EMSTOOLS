import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ICONS } from '../constants';
import { User, UserStatus, UserType } from '../types';
import { roleService, userService } from '../src/services/supabaseService';
import Portal from '../src/components/Portal';

type RoleLite = {
  id: string;
  name: string;
  type: UserType;
};

type UserRow = User & {
  name?: string;
};

type FormState = {
  username: string;
  name: string;
  phone: string;
  email: string;
  type: UserType;
  roleIds: string[];
};

const DEFAULT_FORM: FormState = {
  username: '',
  name: '',
  phone: '',
  email: '',
  type: UserType.EXTERNAL,
  roleIds: [],
};

const inferRoleType = (role: any): UserType => {
  const directType = role?.type || role?.user_type;
  if (directType === UserType.INTERNAL || directType === UserType.EXTERNAL) {
    return directType;
  }
  const source = `${role?.name || ''} ${role?.description || ''}`.toLowerCase();
  return source.includes('外部') || source.includes('客户') ? UserType.EXTERNAL : UserType.INTERNAL;
};

const generateUserId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleLite[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const roleDropdownRef = useRef<HTMLDivElement | null>(null);

  const normalizeUsers = (list: any[]): UserRow[] => {
    return (list || []).map((u: any) => {
      const type = (u.user_type || u.type || UserType.EXTERNAL) as UserType;
      const roleIds = Array.isArray(u.role_ids) ? u.role_ids : u.role_id ? [u.role_id] : [];
      return {
        id: u.user_id || u.id,
        user_id: u.user_id,
        user_name: u.user_name || u.user_realname || u.username,
        username: u.username,
        name: u.user_name || u.user_realname || u.name || u.username,
        phone: u.phone || '',
        email: u.email || '',
        type,
        user_type: type,
        role: '',
        role_id: u.role_id || roleIds[0],
        role_ids: roleIds,
        status: (u.status || UserStatus.ENABLED) as UserStatus,
        last_login_time: u.last_login_time || '',
        create_time: u.create_time || '',
        createTime: u.create_time ? new Date(u.create_time).toISOString().split('T')[0] : '',
      };
    });
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [roleList, userList] = await Promise.all([roleService.getRoles(), userService.getUsers()]);
      const formattedRoles = (roleList || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        type: inferRoleType(r),
      }));
      setRoles(formattedRoles);
      setUsers(normalizeUsers(userList || []));
    } catch (e) {
      console.error('加载用户数据失败:', e);
      setError('加载用户数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isRoleDropdownOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!roleDropdownRef.current?.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [isRoleDropdownOpen]);

  const roleNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    roles.forEach((r) => {
      map[r.id] = r.name;
    });
    return map;
  }, [roles]);

  const availableRoles = useMemo(() => {
    return roles.filter((r) => r.type === form.type);
  }, [roles, form.type]);

  useEffect(() => {
    setForm((prev) => {
      const availableRoleIdSet = new Set(availableRoles.map((r) => r.id));
      const filteredRoleIds = prev.roleIds.filter((id) => availableRoleIdSet.has(id));
      const nextRoleIds = filteredRoleIds.length ? filteredRoleIds : availableRoles[0] ? [availableRoles[0].id] : [];
      const changed =
        nextRoleIds.length !== prev.roleIds.length || nextRoleIds.some((id, idx) => id !== prev.roleIds[idx]);
      return changed ? { ...prev, roleIds: nextRoleIds } : prev;
    });
  }, [availableRoles]);

  const selectedRoleNames = useMemo(() => {
    if (!form.roleIds.length) return '';
    return form.roleIds.map((id) => roleNameMap[id] || id).join('、');
  }, [form.roleIds, roleNameMap]);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((u) => {
      return (
        (u.username || '').toLowerCase().includes(keyword) ||
        (u.user_name || '').toLowerCase().includes(keyword) ||
        (u.phone || '').toLowerCase().includes(keyword) ||
        (u.email || '').toLowerCase().includes(keyword)
      );
    });
  }, [searchTerm, users]);

  const openCreateModal = () => {
    const defaultType = UserType.EXTERNAL;
    const defaultRoleIds = roles.filter((r) => r.type === defaultType).slice(0, 1).map((r) => r.id);
    setError('');
    setForm({ ...DEFAULT_FORM, type: defaultType, roleIds: defaultRoleIds });
    setIsRoleDropdownOpen(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsRoleDropdownOpen(false);
    setIsModalOpen(false);
  };

  const toggleRoleSelection = (roleId: string) => {
    setForm((prev) => {
      const exists = prev.roleIds.includes(roleId);
      return {
        ...prev,
        roleIds: exists ? prev.roleIds.filter((id) => id !== roleId) : [...prev.roleIds, roleId],
      };
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const username = form.username.trim();
      const phone = form.phone.trim();
      const email = form.email.trim();

      if (!username) {
        throw new Error('请输入用户名');
      }
      if (!phone) {
        throw new Error('请输入手机号');
      }
      if (!email) {
        throw new Error('请输入邮箱');
      }
      if (!form.roleIds.length) {
        throw new Error('请至少选择一个角色');
      }

      const payload = {
        user_id: generateUserId(),
        user_name: form.name.trim() || undefined,
        name: form.name.trim() || undefined,
        username,
        password_hash: '1234',
        type: form.type,
        user_type: form.type,
        role_id: form.roleIds[0],
        role_ids: form.roleIds,
        phone,
        email,
        status: UserStatus.ENABLED,
      };

      const created = await userService.createUser(payload);
      if (!created) {
        throw new Error('用户创建失败');
      }

      setIsModalOpen(false);
      setIsRoleDropdownOpen(false);
      setForm(DEFAULT_FORM);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : '用户创建失败';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u: UserRow) => {
    const nextStatus = u.status === UserStatus.ENABLED ? UserStatus.DISABLED : UserStatus.ENABLED;
    const updated = await userService.updateUser(u.id, { status: nextStatus });
    if (updated) {
      setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, status: nextStatus } : item)));
    }
  };

  const handleDelete = async (u: UserRow) => {
    if (!window.confirm(`确定删除用户 ${u.username} 吗？`)) return;
    const ok = await userService.deleteUser(u.id);
    if (ok) {
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">用户管理</h2>
          <p className="text-slate-500">维护系统登录用户信息，支持内部员工与外部客户账号管理。</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索用户名/手机号/邮箱..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <ICONS.Plus className="w-4 h-4" />
            新建用户
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-600 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">用户名</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">姓名</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">用户类型</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">角色</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">手机号</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">邮箱</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">创建时间</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-20 text-center text-slate-400">加载中...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-20 text-center text-slate-400">暂无用户数据</td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const roleIds = u.role_ids?.length ? u.role_ids : u.role_id ? [u.role_id] : [];
                const roleText = roleIds.length ? roleIds.map((id) => roleNameMap[id] || id).join('、') : '-';
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{u.username}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.type === UserType.INTERNAL ? '内部用户' : '外部客户'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{roleText}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.email || '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          u.status === UserStatus.ENABLED ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.createTime || '-'}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`${u.status === UserStatus.ENABLED ? 'text-rose-600' : 'text-emerald-600'} font-bold text-sm hover:underline`}
                      >
                        {u.status === UserStatus.ENABLED ? '禁用' : '启用'}
                      </button>
                      <button onClick={() => handleDelete(u)} className="text-red-600 font-bold text-sm hover:underline">
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">新建用户</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form className="p-8 space-y-4" onSubmit={handleCreateUser}>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-amber-700 text-sm">
                  默认密码为 <span className="font-bold">1234</span>，系统将自动生成用户ID。
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">用户名 <span className="text-rose-600">*</span></label>
                    <input
                      required
                      value={form.username}
                      onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="请输入用户名"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">姓名</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="请输入姓名（可选）"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">用户类型 <span className="text-rose-600">*</span></label>
                    <select
                      value={form.type}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, type: e.target.value as UserType }));
                        setIsRoleDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value={UserType.INTERNAL}>内部用户</option>
                      <option value={UserType.EXTERNAL}>外部客户</option>
                    </select>
                  </div>
                  <div className="space-y-1" ref={roleDropdownRef}>
                    <label className="text-xs font-bold text-slate-500 uppercase">角色 <span className="text-rose-600">*</span></label>
                    <button
                      type="button"
                      onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-left focus:ring-2 focus:ring-blue-500 outline-none flex items-center justify-between"
                    >
                      <span className={form.roleIds.length ? 'text-slate-700' : 'text-slate-400'}>
                        {selectedRoleNames || '请选择角色（可多选）'}
                      </span>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isRoleDropdownOpen && (
                      <div className="absolute mt-1 w-full z-10 bg-white border border-slate-200 rounded-lg shadow-xl p-2 max-h-52 overflow-y-auto">
                        {availableRoles.length === 0 ? (
                          <p className="px-2 py-2 text-sm text-slate-400">当前用户类型暂无可选角色</p>
                        ) : (
                          availableRoles.map((role) => (
                            <label key={role.id} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.roleIds.includes(role.id)}
                                onChange={() => toggleRoleSelection(role.id)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-700">{role.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400">仅显示与当前用户类型匹配的角色，支持多选。</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">手机号 <span className="text-rose-600">*</span></label>
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="请输入手机号"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">邮箱 <span className="text-rose-600">*</span></label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="请输入邮箱"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 disabled:opacity-60"
                  >
                    {submitting ? '创建中...' : '创建'}
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
