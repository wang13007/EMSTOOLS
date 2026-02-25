import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ICONS } from '../constants';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenValid, setTokenValid] = useState(true);
  const navigate = useNavigate();

  // 获取 URL 中的 token 参数
  const token = searchParams.get('token');

  useEffect(() => {
    // 验证 token 是否存在
    if (!token) {
      setTokenValid(false);
      setError('重置密码链接无效或已过期');
    } else {
      // 这里应该调用后端 API 验证 token 是否有效
      console.log('验证重置密码 token:', token);
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const validateForm = (): boolean => {
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
      // 模拟重置密码
      console.log('重置密码请求:', { token, ...formData });

      // 这里应该调用真实的后端 API
      // const response = await authService.resetPassword(token, formData.password);

      // 模拟重置成功
      setTimeout(() => {
        setLoading(false);
        setSuccess('密码重置成功！正在跳转到登录页面...');

        // 3秒后跳转到登录页面
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError('重置密码失败，请稍后重试');
      console.error('重置密码失败:', err);
    }
  };

  if (!tokenValid) {
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
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-center font-medium">{error || '重置密码链接无效或已过期'}</p>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/forgot-password')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
              >
                重新发送重置链接
              </button>
              <p className="mt-4 text-slate-600 text-sm">
                或者 <a href="/login" className="text-blue-600 hover:text-blue-800 font-bold">返回登录</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-slate-500 text-sm">设置新密码</p>
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
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                新密码 <span className="text-red-500">*</span>
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
                placeholder="请输入新密码（最少4位）"
              />
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700 mb-1">
                确认新密码 <span className="text-red-500">*</span>
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
                placeholder="请再次输入新密码"
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
              {loading ? '重置中...' : '重置密码'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 text-sm">
              想起密码了? <a href="/login" className="text-blue-600 hover:text-blue-800 font-bold">立即登录</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};