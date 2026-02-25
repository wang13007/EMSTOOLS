import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { userService } from '../src/services/supabaseService';

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 模拟登录验证
      console.log('登录请求:', formData);
      
      // 基本密码校验逻辑
      const isValidLogin = validateLogin(formData.username, formData.password);
      
      if (!isValidLogin) {
        throw new Error('账号或密码错误');
      }
      
      // 获取所有用户
      const users = await userService.getUsers();
      console.log('数据库用户列表:', users);
      
      // 查找当前用户
      let currentUser = users.find(u => u.username === formData.username);
      
      if (!currentUser) {
        // 如果用户不存在，创建新用户
        console.log('用户不存在，创建新用户:', formData.username);
        const newUser = {
          name: formData.username === 'admin' ? '系统管理员' : formData.username,
          username: formData.username,
          password_hash: formData.password,
          type: formData.username === 'admin' ? 'INTERNAL' : 'EXTERNAL',
          status: 'ENABLED'
        };
        
        const createdUser = await userService.createUser(newUser);
        console.log('创建用户结果:', createdUser);
        
        if (createdUser) {
          currentUser = {
            ...createdUser,
            name: newUser.name,
            role: formData.username === 'admin' ? '管理员' : '外部客户'
          };
        }
      } else {
        // 补充用户信息
        currentUser = {
          ...currentUser,
          name: currentUser.name || formData.username,
          role: formData.username === 'admin' ? '管理员' : '外部客户'
        };
      }
      
      setLoading(false);
      // 保存登录状态到localStorage
      localStorage.setItem('ems_user', JSON.stringify({
        id: currentUser.id || `user_${Date.now()}`,
        username: currentUser.username,
        name: currentUser.name || formData.username,
        type: currentUser.type || (formData.username === 'admin' ? 'internal' : 'external'),
        role: currentUser.role || (formData.username === 'admin' ? '管理员' : '外部客户')
      }));
      localStorage.setItem('ems_token', `mock_token_${Date.now()}`);
      
      // 跳转到首页
      navigate('/');
    } catch (err) {
      setLoading(false);
      setError('登录失败，请检查账号和密码');
      console.error('登录失败:', err);
    }
  };

  // 验证登录逻辑
  const validateLogin = (username: string, password: string): boolean => {
    // 预设的测试账号和密码
    const testAccounts = {
      'admin': 'admin123',      // 管理员账号
      'user1': 'user123',        // 测试用户账号
      'customer': 'customer123'  // 外部客户账号
    };
    
    // 检查是否为预设账号
    if (testAccounts[username]) {
      return password === testAccounts[username];
    }
    
    // 对于其他账号，要求：
    // 1. 用户名长度至少4位
    // 2. 密码长度至少4位
    // 3. 密码不能与用户名相同
    // 4. 密码不能是简单的弱密码
    return (
      username.length >= 4 &&
      password.length >= 4 &&
      password !== username &&
      !['123456', 'password', '123456789', '1234', '12345', '1234567', '12345678', '1234567890', '000000', '111111'].includes(password)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 text-blue-600 font-black text-xl tracking-tight mb-2">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                <ICONS.Energy className="w-6 h-6" />
              </div>
              <span>EMS 售前助手</span>
            </div>
            <p className="text-slate-500 text-sm">登录系统以继续</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                登录账号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                minLength={4}
                maxLength={50}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="请输入登录账号"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={4}
                maxLength={32}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="请输入密码"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? '登录中...' : '登录'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-slate-700">
                  记住我
                </label>
              </div>
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium">
                忘记密码?
              </Link>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 text-sm">
              还没有账号? <Link to="/register" className="text-blue-600 hover:text-blue-800 font-bold">立即注册</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};