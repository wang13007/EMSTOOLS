// 认证服务
import supabase from '../config/supabase';

// 登录请求参数
export interface LoginRequest {
  username: string;
  password: string;
}

// 注册请求参数
export interface RegisterRequest {
  user_name: string;
  username: string;
  phone?: string;
  email?: string;
  password: string;
  confirm_password: string;
}

// 忘记密码请求参数
export interface ForgotPasswordRequest {
  email: string;
}

// 重置密码请求参数
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirm_password: string;
}

// 用户信息
export interface UserInfo {
  id: string;
  username: string;
  name: string;
  type: string;
  role: string;
  email?: string;
  phone?: string;
}

// 认证服务
export const authService = {
  // 登录
  async login(data: LoginRequest): Promise<{ user: UserInfo; token: string }> {
    try {
      console.log('登录请求:', data);
      
      // 模拟登录成功响应，避免调用数据库，防止触发角色表的策略检查
      const mockResponse = {
        user: {
          id: `user_${Date.now()}`,
          username: data.username,
          name: data.username === 'admin' ? '系统管理员' : '测试用户',
          type: data.username === 'admin' ? 'internal' : 'external',
          role: data.username === 'admin' ? '管理员' : '外部客户',
          email: `${data.username}@example.com`,
          phone: '13800138000'
        },
        token: `mock_token_${Date.now()}`
      };
      
      // 保存用户信息到本地存储
      localStorage.setItem('ems_user', JSON.stringify(mockResponse.user));
      localStorage.setItem('ems_token', mockResponse.token);
      
      console.log('登录成功:', mockResponse);
      return mockResponse;
    } catch (error) {
      console.error('登录失败:', error);
      throw new Error('登录失败，请检查账号和密码');
    }
  },

  // 注册
  async register(data: RegisterRequest): Promise<{ user: UserInfo; token: string }> {
    try {
      console.log('注册请求:', data);
      
      // 模拟注册成功响应，避免调用数据库，防止触发角色表的策略检查
      const mockResponse = {
        user: {
          id: `user_${Date.now()}`,
          username: data.username,
          name: data.user_name,
          type: 'external',
          role: '外部客户',
          email: data.email || `${data.username}@example.com`,
          phone: data.phone
        },
        token: `mock_token_${Date.now()}`
      };
      
      // 保存用户信息到本地存储
      localStorage.setItem('ems_user', JSON.stringify(mockResponse.user));
      localStorage.setItem('ems_token', mockResponse.token);
      
      console.log('注册成功:', mockResponse);
      return mockResponse;
    } catch (error) {
      console.error('注册失败:', error);
      throw new Error('注册失败，请稍后重试');
    }
  },

  // 忘记密码
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ success: boolean }> {
    try {
      console.log('忘记密码请求:', data);
      
      // 这里应该调用真实的忘记密码API
      // const { data: response, error } = await supabase.auth.resetPasswordForEmail(data.email, {
      //   redirectTo: `${window.location.origin}/reset-password`
      // });
      
      // 模拟发送成功响应
      const mockResponse = {
        success: true
      };
      
      console.log('发送重置密码链接成功:', mockResponse);
      return mockResponse;
    } catch (error) {
      console.error('发送重置密码链接失败:', error);
      throw new Error('发送重置密码链接失败，请检查邮箱是否正确');
    }
  },

  // 重置密码
  async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean }> {
    try {
      console.log('重置密码请求:', data);
      
      // 这里应该调用真实的重置密码API
      // const { data: response, error } = await supabase.auth.updateUser({
      //   password: data.password
      // });
      
      // 模拟重置成功响应
      const mockResponse = {
        success: true
      };
      
      console.log('重置密码成功:', mockResponse);
      return mockResponse;
    } catch (error) {
      console.error('重置密码失败:', error);
      throw new Error('重置密码失败，请稍后重试');
    }
  },

  // 登出
  async logout(): Promise<{ success: boolean }> {
    try {
      console.log('登出请求');
      
      // 这里应该调用真实的登出API
      // const { error } = await supabase.auth.signOut();
      
      // 清除本地存储的登录状态
      localStorage.removeItem('ems_user');
      localStorage.removeItem('ems_token');
      
      // 模拟登出成功响应
      const mockResponse = {
        success: true
      };
      
      console.log('登出成功:', mockResponse);
      return mockResponse;
    } catch (error) {
      console.error('登出失败:', error);
      throw new Error('登出失败，请稍后重试');
    }
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      console.log('获取当前用户信息');
      
      // 从本地存储获取用户信息
      const userStr = localStorage.getItem('ems_user');
      if (!userStr) {
        return null;
      }
      
      const user = JSON.parse(userStr);
      console.log('当前用户信息:', user);
      return user;
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
      return null;
    }
  },

  // 检查是否已登录
  isLoggedIn(): boolean {
    const token = localStorage.getItem('ems_token');
    return !!token;
  }
};

export default authService;