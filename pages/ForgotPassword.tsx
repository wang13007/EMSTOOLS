import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';

export const ForgotPassword: React.FC = () => {
  const [formData, setFormData] = useState({
    email: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 模拟发送重置密码邮件
      console.log('发送重置密码邮件请求:', formData);
      
      // 这里应该调用真实的后端API
      // const response = await authService.forgotPassword(formData.email);
      
      // 模拟发送成功
      setTimeout(() => {
        setLoading(false);
        setSuccess('重置密码链接已发送到您的邮箱，请查收邮件并按照提示操作');
        
        // 3秒后跳转到登录页面
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError('发送重置密码链接失败，请检查邮箱是否正确');
      console.error('发送重置密码链接失败:', err);
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
            <p className="text-slate-500 text-sm">重置您的密码</p>
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
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                邮箱 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="请输入您注册时使用的邮箱"
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
              {loading ? '发送中...' : '发送重置链接'}
            </button>

            <div className="text-sm text-slate-500">
              <p>我们将向您的邮箱发送一封包含重置密码链接的邮件，请在24小时内点击链接重置密码。</p>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 text-sm">
              想起密码了? <Link to="/login" className="text-blue-600 hover:text-blue-800 font-bold">立即登录</Link>
            </p>
            <p className="text-slate-600 text-sm mt-2">
              还没有账号? <Link to="/register" className="text-blue-600 hover:text-blue-800 font-bold">立即注册</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};