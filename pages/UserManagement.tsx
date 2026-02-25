
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { User, UserType, UserStatus } from '../types';
import { userService } from '../src/services/supabaseService';
import supabase from '../src/config/supabase';
import Portal from '../src/components/Portal';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUserType, setSelectedUserType] = useState<UserType>(UserType.INTERNAL);

  // 默认角色数据
  const DEFAULT_ROLES = [
    { id: 'role-1', name: '超级管理员', type: UserType.INTERNAL },
    { id: 'role-2', name: '售前工程师', type: UserType.INTERNAL },
    { id: 'role-3', name: '客户用户', type: UserType.EXTERNAL }
  ];

  useEffect(() => {
    // 直接使用默认角色数据，避免从数据库获取角色导致的无限递归问题
    setRoles(DEFAULT_ROLES);

    // 从数据库获取用户列表
    const fetchUsers = async () => {
      try {
        const userList = await userService.getUsers();
        // 转换数据格式以匹配前端类型
        const formattedUsers = userList.map(user => {
          // 获取角色名称
          let roleNames = '未分配';
          if (user.role_ids && Array.isArray(user.role_ids) && user.role_ids.length > 0) {
            roleNames = user.role_ids.map(roleId => {
              const role = DEFAULT_ROLES.find(r => r.id === roleId);
              return role ? role.name : '未知角色';
            }).join(', ');
          } else if (user.role_id) {
            // 兼容旧的单角色格式
            const role = DEFAULT_ROLES.find(r => r.id === user.role_id);
            roleNames = role ? role.name : '未知角色';
          }
          
          return {
            id: user.user_id || user.id,
            username: user.user_name || user.username,
            phone: user.phone,
            email: user.email,
            type: user.user_type || user.type,
            role_id: user.role_id,
            role_ids: [user.role_id] || [],
            role: roleNames,
            status: user.status,
            last_login_time: user.last_login_time,
            createTime: user.create_time ? new Date(user.create_time).toISOString().split('T')[0] : ''
          };
        });
        setUsers(formattedUsers);
      } catch (error) {
        console.error('获取用户列表失败:', error);
        // 使用默认用户数据作为备用
        setUsers([
          {
            id: 'user-1',
            username: 'admin',
            phone: '13800138000',
            email: 'admin@example.com',
            type: UserType.INTERNAL,
            role_id: 'role-1',
            role_ids: ['role-1'],
            role: '超级管理员',
            status: UserStatus.ENABLED,
            last_login_time: null,
            createTime: new Date().toISOString().split('T')[0]
          }
        ]);
      }
    };

    // 直接获取用户
    fetchUsers();
  }, []);

  const saveUsers = async (userData: any) => {
    try {
      if (userData.id) {
        // 更新现有用户
        const updatedUser = await userService.updateUser(userData.id, userData);
        if (updatedUser) {
          setUsers(prevUsers => prevUsers.map(u => u.id === userData.id ? { ...u, ...userData } : u));
        }
      } else {
        // 创建新用户
        const createdUser = await userService.createUser(userData);
        if (createdUser) {
          const newUser = {
            id: createdUser.id,
            ...userData,
            createTime: new Date().toISOString().split('T')[0]
          };
          setUsers(prevUsers => [...prevUsers, newUser]);
        }
      }
    } catch (error) {
      console.error('保存用户失败:', error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.includes(searchTerm) || u.id.includes(searchTerm)
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除该用户吗？')) {
      const success = await userService.deleteUser(id);
      if (success) {
        setUsers(users.filter(u => u.id !== id));
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      const newStatus = user.status === UserStatus.ENABLED ? UserStatus.DISABLED : UserStatus.ENABLED;
      const success = await userService.updateUser(id, { status: newStatus });
      if (success) {
        setUsers(users.map(u => {
          if (u.id === id) {
            return { ...u, status: newStatus };
          }
          return u;
        }));
      }
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
              placeholder="搜索用户名/用户ID..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-slate-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
          <button 
            onClick={() => { setEditingUser(null); setSelectedUserType(UserType.INTERNAL); setSelectedRoles([]); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <ICONS.Plus className="w-4 h-4" />
            新增用户
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">用户ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">用户名</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">用户类型</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">手机号</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">邮箱</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">创建时间</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">上次登录时间</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{user.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                      {user.username.slice(0, 1)}
                    </div>
                    <span className="font-bold text-slate-900">{user.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{user.type === UserType.INTERNAL ? '内部用户' : '外部客户'}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{user.phone || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{user.email || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${user.status === UserStatus.ENABLED ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{user.createTime}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{user.last_login_time || '-'}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button 
                    onClick={() => {
                      setEditingUser(user);
                      setSelectedUserType(user.type);
                      setSelectedRoles(user.role_ids || []);
                      setIsModalOpen(true);
                    }}
                    className="text-blue-600 font-bold text-sm hover:underline"
                  >
                    编辑
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(user.id)}
                    className={`${user.status === UserStatus.ENABLED ? 'text-rose-600' : 'text-emerald-600'} font-bold text-sm hover:underline`}
                  >
                    {user.status === UserStatus.ENABLED ? '禁用' : '启用'}
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 font-bold text-sm hover:underline"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">{editingUser ? '编辑用户' : '新增用户'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <form className="p-8 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                // 初始化密码为123456
                const defaultPassword = '123456';
                
                const userData = {
                  user_id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // 生成用户ID
                  user_name: formData.get('username') as string,
                  password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // 默认密码为 '123456'
                  user_type: formData.get('type') as UserType,
                  role_id: selectedRoles[0], // 使用第一个选中的角色作为role_id
                  phone: formData.get('phone') as string || '',
                  email: formData.get('email') as string || '',
                  status: editingUser?.status || UserStatus.ENABLED,
                  creator: 'system', // 默认为系统创建
                  is_deleted: false, // 默认未删除
                  create_time: new Date().toISOString() // 创建时间
                };
                
                try {
                  console.log('用户数据:', userData);
                  console.log('选中的角色:', selectedRoles);
                  
                  // 数据验证
                  if (!userData.user_name || userData.user_name.trim() === '') {
                    console.error('用户名不能为空');
                    alert('请输入用户名');
                    return;
                  }
                  
                  if (!userData.user_type) {
                    console.error('用户类型不能为空');
                    alert('请选择用户类型');
                    return;
                  }
                  
                  if (!userData.phone || userData.phone.trim() === '') {
                    console.error('手机号不能为空');
                    alert('请输入手机号');
                    return;
                  }
                  
                  if (!userData.email || userData.email.trim() === '') {
                    console.error('邮箱不能为空');
                    alert('请输入邮箱');
                    return;
                  }
                  
                  if (!Array.isArray(selectedRoles) || selectedRoles.length === 0) {
                    console.error('至少选择一个角色');
                    alert('请至少选择一个角色');
                    return;
                  }
                  
                  if (!userData.role_id) {
                    console.error('角色ID不能为空');
                    alert('请选择一个角色');
                    return;
                  }
                  
                  if (editingUser) {
                    // 更新现有用户
                    console.log('更新用户 ID:', editingUser.id);
                    const updatedUser = await userService.updateUser(editingUser.id, userData);
                    console.log('更新用户结果:', updatedUser);
                    if (updatedUser) {
                      const roleNames = selectedRoles.map(roleId => roles.find(r => r.id === roleId)?.name || '未知').join(', ');
                      setUsers(users.map(u => {
                        if (u.id === editingUser.id) {
                          return {
                            ...u,
                            username: updatedUser.user_name || updatedUser.username,
                            phone: updatedUser.phone,
                            email: updatedUser.email,
                            type: updatedUser.user_type || updatedUser.type,
                            role_id: selectedRoles[0],
                            role_ids: selectedRoles,
                            role: roleNames || '未分配',
                            status: updatedUser.status
                          };
                        }
                        return u;
                      }));
                      setIsModalOpen(false);
                      setSelectedRoles([]);
                    } else {
                      alert('更新用户失败，请检查控制台错误信息');
                    }
                  } else {
                    // 创建新用户
                    console.log('创建新用户');
                    const newUser = await userService.createUser(userData);
                    console.log('创建用户结果:', newUser);
                    if (newUser) {
                      const roleNames = selectedRoles.map(roleId => roles.find(r => r.id === roleId)?.name || '未知').join(', ');
                      setUsers([...users, {
                        id: newUser.user_id || newUser.id,
                        username: newUser.user_name || newUser.username,
                        phone: newUser.phone,
                        email: newUser.email,
                        type: newUser.user_type || newUser.type,
                        role_id: selectedRoles[0],
                        role_ids: selectedRoles,
                        role: roleNames || '未分配',
                        status: newUser.status,
                        last_login_time: newUser.last_login_time,
                        createTime: new Date().toISOString().split('T')[0]
                      }]);
                      setIsModalOpen(false);
                      setSelectedRoles([]);
                    } else {
                      alert('创建用户失败，请检查控制台错误信息');
                    }
                  }
                } catch (error) {
                  console.error('保存用户失败:', error);
                  console.error('错误详情:', JSON.stringify(error, null, 2));
                  alert('保存用户失败，请检查控制台错误信息');
                }
              }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">用户名 <span className="text-rose-600">*</span></label>
                    <input name="username" required defaultValue={editingUser?.username} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">用户类型 <span className="text-rose-600">*</span></label>
                    <select 
                      name="type" 
                      required 
                      defaultValue={editingUser?.type || UserType.INTERNAL} 
                      onChange={(e) => {
                        const newType = e.target.value as UserType;
                        setSelectedUserType(newType);
                        // 清空已选择的角色，因为类型改变后可用角色会不同
                        setSelectedRoles([]);
                      }}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value={UserType.INTERNAL}>内部用户</option>
                      <option value={UserType.EXTERNAL}>外部客户</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">手机号 <span className="text-rose-600">*</span></label>
                    <input name="phone" required defaultValue={editingUser?.phone} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入手机号" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">邮箱 <span className="text-rose-600">*</span></label>
                    <input name="email" required defaultValue={editingUser?.email} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入邮箱" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">角色 (多选) <span className="text-rose-600">*</span></label>
                    <div className="flex flex-wrap gap-2 border border-slate-200 rounded-lg p-2 min-h-[40px]">
                      {roles.map(role => {
                        const isDisabled = role.type !== selectedUserType;
                        return (
                          <div key={role.id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`role-${role.id}`}
                              checked={selectedRoles.includes(role.id)}
                              onChange={(e) => {
                                if (isDisabled) return;
                                if (e.target.checked) {
                                  setSelectedRoles([...selectedRoles, role.id]);
                                } else {
                                  setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                                }
                              }}
                              disabled={isDisabled}
                              className={`mr-1 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <label 
                              htmlFor={`role-${role.id}`} 
                              className={`text-sm ${isDisabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600'}`}
                            >
                              {role.name}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">所属客户 (可选)</label>
                    <input name="customer" defaultValue={editingUser?.customer} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">取消</button>
                  <button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">保存</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
