import React, { useEffect, useMemo, useState } from 'react';
import { User, UserStatus, UserType } from '../types';
import { roleService, userService } from '../src/services/supabaseService';

type RoleLite = {
  id: string;
  name: string;
  type?: UserType;
};

type FormState = {
  username: string;
  password: string;
  phone: string;
  email: string;
  type: UserType;
  role_id: string;
};

const defaultForm: FormState = {
  username: '',
  password: '',
  phone: '',
  email: '',
  type: UserType.EXTERNAL,
  role_id: '',
};

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleLite[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [roleList, userList] = await Promise.all([
        roleService.getRoles(),
        userService.getUsers(),
      ]);

      setRoles((roleList || []).map((r: any) => ({ id: r.id, name: r.name, type: r.type })));

      const normalizedUsers: User[] = (userList || []).map((u: any) => ({
        id: u.user_id || u.id,
        user_id: u.user_id,
        user_name: u.user_name || u.username,
        username: u.username,
        phone: u.phone || '',
        email: u.email || '',
        type: (u.type || u.user_type || UserType.EXTERNAL) as UserType,
        user_type: (u.type || u.user_type || UserType.EXTERNAL) as UserType,
        role: '',
        role_id: u.role_id,
        role_ids: u.role_id ? [u.role_id] : [],
        status: (u.status || UserStatus.ENABLED) as UserStatus,
        last_login_time: u.last_login_time || '',
        create_time: u.create_time || '',
        createTime: u.create_time ? new Date(u.create_time).toISOString().split('T')[0] : '',
      }));

      setUsers(normalizedUsers);
    } catch (e) {
      console.error('加载用户数据失败:', e);
      setError('加载用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const roleNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of roles) map[r.id] = r.name;
    return map;
  }, [roles]);

  const visibleUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((u) => {
      return (
        (u.username || '').toLowerCase().includes(keyword) ||
        (u.user_name || '').toLowerCase().includes(keyword) ||
        (u.email || '').toLowerCase().includes(keyword) ||
        (u.phone || '').toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  const filteredRoles = useMemo(() => {
    return roles.filter((r) => !r.type || r.type === form.type);
  }, [roles, form.type]);

  useEffect(() => {
    if (!filteredRoles.find((r) => r.id === form.role_id)) {
      setForm((prev) => ({ ...prev, role_id: filteredRoles[0]?.id || '' }));
    }
  }, [filteredRoles, form.role_id]);

  const onCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (!form.username.trim()) {
        throw new Error('用户名不能为空');
      }
      if (!form.password.trim()) {
        throw new Error('密码不能为空');
      }
      if (!form.role_id) {
        throw new Error('请先选择角色');
      }

      const payload = {
        user_name: form.username.trim(),
        username: form.username.trim(),
        password_hash: form.password,
        type: form.type,
        user_type: form.type,
        role_id: form.role_id,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        status: UserStatus.ENABLED,
      };

      const created = await userService.createUser(payload);
      if (!created) throw new Error('创建用户失败');

      setForm(defaultForm);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '创建用户失败';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onToggleStatus = async (u: User) => {
    const nextStatus = u.status === UserStatus.ENABLED ? UserStatus.DISABLED : UserStatus.ENABLED;
    const ok = await userService.updateUser(u.id, { status: nextStatus });
    if (ok) {
      setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, status: nextStatus } : item)));
    }
  };

  const onDeleteUser = async (u: User) => {
    if (!window.confirm(`确认删除用户 ${u.username} 吗？`)) return;
    const ok = await userService.deleteUser(u.id);
    if (ok) {
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">用户管理</h2>
          <p className="text-slate-500">创建、启停和删除系统用户</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户名/手机号/邮箱"
          className="w-full md:w-80 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-2 text-rose-600 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="font-bold text-slate-800 mb-3">新建用户</h3>
        <form onSubmit={onCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            placeholder="用户名"
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
          <input
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="密码"
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
          <select
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as UserType }))}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          >
            <option value={UserType.EXTERNAL}>外部客户</option>
            <option value={UserType.INTERNAL}>内部用户</option>
          </select>
          <select
            value={form.role_id}
            onChange={(e) => setForm((prev) => ({ ...prev, role_id: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          >
            {filteredRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <input
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="手机号"
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
          <input
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="邮箱"
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
          <button
            disabled={submitting}
            className="md:col-span-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg disabled:opacity-60"
          >
            {submitting ? '创建中...' : '创建用户'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3">用户名</th>
              <th className="text-left px-4 py-3">类型</th>
              <th className="text-left px-4 py-3">角色</th>
              <th className="text-left px-4 py-3">手机号</th>
              <th className="text-left px-4 py-3">邮箱</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="text-right px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  加载中...
                </td>
              </tr>
            ) : visibleUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              visibleUsers.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.username}</td>
                  <td className="px-4 py-3">{u.type === UserType.INTERNAL ? '内部' : '外部'}</td>
                  <td className="px-4 py-3">{u.role_id ? roleNameMap[u.role_id] || u.role_id : '-'}</td>
                  <td className="px-4 py-3">{u.phone || '-'}</td>
                  <td className="px-4 py-3">{u.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.status === UserStatus.ENABLED
                          ? 'text-emerald-600 font-medium'
                          : 'text-rose-600 font-medium'
                      }
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      onClick={() => onToggleStatus(u)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {u.status === UserStatus.ENABLED ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => onDeleteUser(u)}
                      className="text-rose-600 hover:underline font-medium"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

