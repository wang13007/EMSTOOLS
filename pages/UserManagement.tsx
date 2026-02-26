
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { User, UserType, UserStatus } from '../types';
import { userService } from '../src/services/supabaseService';
import Portal from '../src/components/Portal';

export const UserManagement: React.FC = () =&gt; {
  const [users, setUsers] = useState&lt;User[]&gt;([]);
  const [roles, setRoles] = useState&lt;any[]&gt;([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState&lt;User | null&gt;(null);
  const [selectedRoles, setSelectedRoles] = useState&lt;string[]&gt;([]);
  const [selectedUserType, setSelectedUserType] = useState&lt;UserType&gt;(UserType.INTERNAL);

  const DEFAULT_ROLES = [
    { id: 'role-1', name: '超级管理员', type: UserType.INTERNAL },
    { id: 'role-2', name: '售前工程师', type: UserType.INTERNAL },
    { id: 'role-3', name: '客户用户', type: UserType.EXTERNAL }
  ];

  useEffect(() =&gt; {
    const fetchData = async () =&gt; {
      try {
        const roleList = await userService.getRoles();
        if (roleList &amp;&amp; roleList.length &gt; 0) {
          setRoles(roleList);
        } else {
          setRoles(DEFAULT_ROLES);
        }

        const userList = await userService.getUsers();
        const formattedUsers = userList.map(user =&gt; {
          let roleNames = '未分配';
          const currentRoles = roleList.length &gt; 0 ? roleList : DEFAULT_ROLES;
          
          if (user.role_ids &amp;&amp; Array.isArray(user.role_ids) &amp;&amp; user.role_ids.length &gt; 0) {
            roleNames = user.role_ids.map(roleId =&gt; {
              const role = currentRoles.find(r =&gt; r.id === roleId);
              return role ? role.name : '未知角色';
            }).join(', ');
          } else if (user.role_id) {
            const role = currentRoles.find(r =&gt; r.id === user.role_id);
            roleNames = role ? role.name : '未知角色';
          }
          
          return {
            id: user.user_id || user.id,
            user_id: user.user_id,
            user_name: user.user_name,
            username: user.username,
            name: user.name || user.user_name || user.username,
            type: user.type,
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
        console.error('获取数据失败:', error);
        setRoles(DEFAULT_ROLES);
        setUsers([
          {
            id: 'user-1',
            user_name: 'admin',
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

    fetchData();
  }, []);

  const saveUsers = async (userData: any) =&gt; {
    try {
      if (userData.id) {
        const updatedUser = await userService.updateUser(userData.id, userData);
        if (updatedUser) {
          setUsers(prevUsers =&gt; prevUsers.map(u =&gt; u.id === userData.id ? { ...u, ...userData } : u));
        }
      } else {
        const createdUser = await userService.createUser(userData);
        if (createdUser) {
          const newUser = {
            id: createdUser.id,
            ...userData,
            createTime: new Date().toISOString().split('T')[0]
          };
          setUsers(prevUsers =&gt; [...prevUsers, newUser]);
        }
      }
    } catch (error) {
      console.error('保存用户失败:', error);
    }
  };

  const filteredUsers = users.filter(u =&gt; {
    const userName = u.username || u.user_name || '';
    const userId = u.id || '';
    return userName.includes(searchTerm) || userId.includes(searchTerm);
  });

  const handleDelete = async (id: string) =&gt; {
    if (window.confirm('确定要删除该用户吗？')) {
      const success = await userService.deleteUser(id);
      if (success) {
        setUsers(users.filter(u =&gt; u.id !== id));
      }
    }
  };

  const handleToggleStatus = async (id: string) =&gt; {
    const user = users.find(u =&gt; u.id === id);
    if (user) {
      const newStatus = user.status === UserStatus.ENABLED ? UserStatus.DISABLED : UserStatus.ENABLED;
      const success = await userService.updateUser(id, { status: newStatus });
      if (success) {
        setUsers(users.map(u =&gt; {
          if (u.id === id) {
            return { ...u, status: newStatus };
          }
          return u;
        }));
      }
    }
  };

  return (
    &lt;div className="space-y-6 animate-fadeIn"&gt;
      &lt;div className="flex justify-between items-end"&gt;
        &lt;div&gt;
          &lt;h2 className="text-2xl font-bold text-slate-900"&gt;用户管理&lt;/h2&gt;
          &lt;p className="text-slate-500"&gt;维护系统登录用户信息，支持内部员工与外部客户账号管理。&lt;/p&gt;
        &lt;/div&gt;
        &lt;div className="flex gap-3"&gt;
          &lt;div className="relative"&gt;
            &lt;input 
              type="text"
              placeholder="搜索用户名/用户ID..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) =&gt; setSearchTerm(e.target.value)}
            /&gt;
            &lt;div className="absolute left-3 top-2.5 text-slate-400"&gt;
               &lt;svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;&lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/&gt;&lt;/svg&gt;
            &lt;/div&gt;
          &lt;/div&gt;
          &lt;button 
            onClick={() =&gt; { setEditingUser(null); setSelectedUserType(UserType.INTERNAL); setSelectedRoles([]); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
          &gt;
            &lt;ICONS.Plus className="w-4 h-4" /&gt;
            新增用户
          &lt;/button&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"&gt;
        &lt;table className="w-full text-left"&gt;
          &lt;thead className="bg-slate-50 border-b border-slate-200"&gt;
            &lt;tr&gt;
              &lt;th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"&gt;用户ID&lt;/th&gt;
              &lt;th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"&gt;用户名&lt;/th&gt;
              &lt;th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"&gt;姓名&lt;/th&gt;
              &lt;th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"&gt;用户类型&lt;/th&gt;
              &lt;th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"&gt;手机号&lt;/th&gt;
              &lt;th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"&gt;邮箱&lt;/th&gt;
              &lt;th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"&gt;状态&lt;/th&gt;
              &lt;th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"&gt;创建时间&lt;/th&gt;
              &lt;th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"&gt;上次登录时间&lt;/th&gt;
              &lt;th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right"&gt;操作&lt;/th&gt;
            &lt;/tr&gt;
          &lt;/thead&gt;
          &lt;tbody className="divide-y divide-slate-100"&gt;
            {filteredUsers.map(user =&gt; (
              &lt;tr key={user.id} className="hover:bg-slate-50 transition-colors"&gt;
                &lt;td className="px-6 py-4 text-sm text-slate-900 font-medium"&gt;{user.id}&lt;/td&gt;
                &lt;td className="px-6 py-4"&gt;
                  &lt;div className="flex items-center gap-3"&gt;
                    &lt;div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]"&gt;
                      {(user.username || user.user_name || 'U').slice(0, 1)}
                    &lt;/div&gt;
                    &lt;span className="font-bold text-slate-900"&gt;{user.username || user.user_name || '-'}&lt;/span&gt;
                  &lt;/div&gt;
                &lt;/td&gt;
                &lt;td className="px-6 py-4 text-sm text-slate-500"&gt;{user.name || '-'}&lt;/td&gt;
                &lt;td className="px-6 py-4"&gt;
                  &lt;span className="text-[10px] text-slate-400 font-bold uppercase"&gt;{user.type === UserType.INTERNAL ? '内部用户' : '外部客户'}&lt;/span&gt;
                &lt;/td&gt;
                &lt;td className="px-6 py-4 text-sm text-slate-500"&gt;{user.phone || '-'}&lt;/td&gt;
                &lt;td className="px-6 py-4 text-sm text-slate-500"&gt;{user.email || '-'}&lt;/td&gt;
                &lt;td className="px-6 py-4"&gt;
                  &lt;span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${user.status === UserStatus.ENABLED ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}&gt;
                    {user.status}
                  &lt;/span&gt;
                &lt;/td&gt;
                &lt;td className="px-6 py-4 text-sm text-slate-500"&gt;{user.createTime}&lt;/td&gt;
                &lt;td className="px-6 py-4 text-sm text-slate-500"&gt;{user.last_login_time || '-'}&lt;/td&gt;
                &lt;td className="px-6 py-4 text-right space-x-3"&gt;
                  &lt;button 
                    onClick={() =&gt; {
                      setEditingUser(user);
                      setSelectedUserType(user.type);
                      setSelectedRoles(user.role_ids || []);
                      setIsModalOpen(true);
                    }}
                    className="text-blue-600 font-bold text-sm hover:underline"
                  &gt;
                    编辑
                  &lt;/button&gt;
                  &lt;button 
                    onClick={() =&gt; handleToggleStatus(user.id)}
                    className={`${user.status === UserStatus.ENABLED ? 'text-rose-600' : 'text-emerald-600'} font-bold text-sm hover:underline`}
                  &gt;
                    {user.status === UserStatus.ENABLED ? '禁用' : '启用'}
                  &lt;/button&gt;
                  &lt;button 
                    onClick={() =&gt; handleDelete(user.id)}
                    className="text-red-600 font-bold text-sm hover:underline"
                  &gt;
                    删除
                  &lt;/button&gt;
                &lt;/td&gt;
              &lt;/tr&gt;
            ))}
          &lt;/tbody&gt;
        &lt;/table&gt;
      &lt;/div&gt;

      {isModalOpen &amp;&amp; (
        &lt;Portal&gt;
          &lt;div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"&gt;
            &lt;div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp"&gt;
              &lt;div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center"&gt;
                &lt;h3 className="text-xl font-bold text-slate-900"&gt;{editingUser ? '编辑用户' : '新增用户'}&lt;/h3&gt;
                &lt;button onClick={() =&gt; setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"&gt;
                  &lt;svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;&lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/&gt;&lt;/svg&gt;
                &lt;/button&gt;
              &lt;/div&gt;
              &lt;form className="p-8 space-y-4" onSubmit={async (e) =&gt; {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                const userData = {
                  username: formData.get('user_name') as string,
                  password_hash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
                  type: formData.get('type') as UserType,
                  role_id: selectedRoles[0],
                  status: editingUser?.status || UserStatus.ENABLED
                };
                
                try {
                  console.log('用户数据:', userData);
                  console.log('选中的角色:', selectedRoles);
                  
                  if (!userData.username || userData.username.trim() === '') {
                    console.error('用户名不能为空');
                    alert('请输入用户名');
                    return;
                  }
                  
                  if (!userData.type) {
                    console.error('用户类型不能为空');
                    alert('请选择用户类型');
                    return;
                  }
                  
                  if (!formData.get('phone') || (formData.get('phone') as string).trim() === '') {
                    console.error('手机号不能为空');
                    alert('请输入手机号');
                    return;
                  }
                  
                  if (!formData.get('email') || (formData.get('email') as string).trim() === '') {
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
                    console.log('更新用户 ID:', editingUser.id);
                    const updatedUser = await userService.updateUser(editingUser.id, userData);
                    console.log('更新用户结果:', updatedUser);
                    if (updatedUser) {
                      const roleNames = selectedRoles.map(roleId =&gt; roles.find(r =&gt; r.id === roleId)?.name || '未知').join(', ');
                      setUsers(users.map(u =&gt; {
                        if (u.id === editingUser.id) {
                          return {
                            ...u,
                            user_name: updatedUser.username,
                            username: updatedUser.username,
                            name: updatedUser.username,
                            type: updatedUser.type,
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
                    console.log('创建新用户');
                    const newUser = await userService.createUser(userData);
                    console.log('创建用户结果:', newUser);
                    if (newUser) {
                      const roleNames = selectedRoles.map(roleId =&gt; roles.find(r =&gt; r.id === roleId)?.name || '未知').join(', ');
                      setUsers([...users, {
                        id: newUser.id,
                        user_name: newUser.username,
                        username: newUser.username,
                        name: newUser.username,
                        type: newUser.type,
                        role_id: selectedRoles[0],
                        role_ids: selectedRoles,
                        role: roleNames || '未分配',
                        status: newUser.status,
                        last_login_time: newUser.last_login_time,
                        createTime: newUser.create_time ? new Date(newUser.create_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
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
              }}&gt;
                &lt;div className="grid grid-cols-2 gap-4"&gt;
                  &lt;div className="space-y-1"&gt;
                    &lt;label className="text-xs font-bold text-slate-500 uppercase"&gt;用户名 &lt;span className="text-rose-600"&gt;*&lt;/span&gt;&lt;/label&gt;
                    &lt;input name="user_name" required defaultValue={editingUser?.username || editingUser?.user_name} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /&gt;
                  &lt;/div&gt;
                  &lt;div className="space-y-1"&gt;
                    &lt;label className="text-xs font-bold text-slate-500 uppercase"&gt;姓名&lt;/label&gt;
                    &lt;input name="name" defaultValue={editingUser?.name} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入姓名" /&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
                &lt;div className="grid grid-cols-2 gap-4"&gt;
                  &lt;div className="space-y-1"&gt;
                    &lt;label className="text-xs font-bold text-slate-500 uppercase"&gt;用户类型 &lt;span className="text-rose-600"&gt;*&lt;/span&gt;&lt;/label&gt;
                    &lt;select 
                      name="type" 
                      required 
                      defaultValue={editingUser?.type || UserType.INTERNAL} 
                      onChange={(e) =&gt; {
                        const newType = e.target.value as UserType;
                        setSelectedUserType(newType);
                        setSelectedRoles([]);
                      }}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    &gt;
                      &lt;option value={UserType.INTERNAL}&gt;内部用户&lt;/option&gt;
                      &lt;option value={UserType.EXTERNAL}&gt;外部客户&lt;/option&gt;
                    &lt;/select&gt;
                  &lt;/div&gt;
                  &lt;div className="space-y-1"&gt;
                    &lt;label className="text-xs font-bold text-slate-500 uppercase"&gt;手机号 &lt;span className="text-rose-600"&gt;*&lt;/span&gt;&lt;/label&gt;
                    &lt;input name="phone" required defaultValue={editingUser?.phone} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入手机号" /&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
                &lt;div className="grid grid-cols-1 gap-4"&gt;
                  &lt;div className="space-y-1"&gt;
                    &lt;label className="text-xs font-bold text-slate-500 uppercase"&gt;邮箱 &lt;span className="text-rose-600"&gt;*&lt;/span&gt;&lt;/label&gt;
                    &lt;input name="email" required defaultValue={editingUser?.email} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入邮箱" /&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
                &lt;div className="grid grid-cols-1 gap-4"&gt;
                  &lt;div className="space-y-1"&gt;
                    &lt;label className="text-xs font-bold text-slate-500 uppercase"&gt;角色 (多选) &lt;span className="text-rose-600"&gt;*&lt;/span&gt;&lt;/label&gt;
                    &lt;div className="flex flex-wrap gap-2 border border-slate-200 rounded-lg p-2 min-h-[40px]"&gt;
                      {roles.map(role =&gt; {
                        const isDisabled = role.type !== selectedUserType;
                        return (
                          &lt;div key={role.id} className="flex items-center"&gt;
                            &lt;input
                              type="checkbox"
                              id={`role-${role.id}`}
                              checked={selectedRoles.includes(role.id)}
                              onChange={(e) =&gt; {
                                if (isDisabled) return;
                                if (e.target.checked) {
                                  setSelectedRoles([...selectedRoles, role.id]);
                                } else {
                                  setSelectedRoles(selectedRoles.filter(id =&gt; id !== role.id));
                                }
                              }}
                              disabled={isDisabled}
                              className={`mr-1 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            /&gt;
                            &lt;label 
                              htmlFor={`role-${role.id}`} 
                              className={`text-sm ${isDisabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600'}`}
                            &gt;
                              {role.name}
                            &lt;/label&gt;
                          &lt;/div&gt;
                        );
                      })}
                    &lt;/div&gt;
                  &lt;/div&gt;
                &lt;/div&gt;

                &lt;div className="pt-4 flex justify-end gap-3"&gt;
                  &lt;button type="button" onClick={() =&gt; setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"&gt;取消&lt;/button&gt;
                  &lt;button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200"&gt;保存&lt;/button&gt;
                &lt;/div&gt;
              &lt;/form&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/Portal&gt;
      )}
    &lt;/div&gt;
  );
};
