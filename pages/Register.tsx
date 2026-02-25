import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    user_name: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const validateForm = (): boolean => {
    // 用户名长度校验
    if (formData.username.length < 4 || formData.username.length > 50) {
      setError('用户名长度必须在4-50字符之间');
      return false;
    }

    // 密码长度校验
    if (formData.password.length < 4 || formData.password.length > 32) {
      setError('密码长度必须在4-32字符之间');
      return false;
    }

    // 密码一致性校验
    if (formData.password !== formData.confirm_password) {
      setError('两次输入的密码不一致');
      return false;
    }

    // 手机号格式校验（如果填写）
    if (formData.phone && !/^\d+$/.test(formData.phone)) {
      setError('手机号必须为数字格式');
      return false;
    }

    // 邮箱格式校验（如果填写）
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('邮箱格式不正确');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 模拟注册验证
      console.log('注册请求:', formData);
      
      // 这里应该调用真实的注册API
      // const response = await authService.register(formData);
      
      // 模拟注册成功
      setTimeout(() => {
        setLoading(false);
        setSuccess('注册成功！正在跳转到登录页面...');
        
        // 3秒后跳转到登录页面
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError('注册失败，请稍后重试');
      console.error('注册失败:', err);
    }
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
            <p className="text-slate-500 text-sm">创建账号以开始使用</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-600 text-sm font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="user_name" className="block text-sm font-medium text-slate-700 mb-1">
                用户姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="user_name"
                name="user_name"
                value={formData.user_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="请输入用户姓名"
              />
            </div>

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
                placeholder="请输入登录账号（4-50字符）"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                手机号
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="请输入手机号"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="请输入邮箱"
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
                placeholder="请输入密码（最少4位）"
              />
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700 mb-1">
                确认密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                minLength={4}
                maxLength={32}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="请再次输入密码"
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
              {loading ? '注册中...' : '注册'}
            </button>

            <div className="text-sm text-slate-500">
              <p>注册即表示您同意我们的<a href="#" className="text-blue-600 hover:text-blue-800 font-medium">服务条款</a>和<a href="#" className="text-blue-600 hover:text-blue-800 font-medium">隐私政策</a></p>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 text-sm">
              已有账号? <Link to="/login" className="text-blue-600 hover:text-blue-800 font-bold">立即登录</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};