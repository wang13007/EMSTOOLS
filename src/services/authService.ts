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
      
      // 调用 supabaseService 进行真实登录
      const { userService } = await import('../services/supabaseService');
      
      // 获取所有用户
      const users = await userService.getUsers();
      console.log('数据库用户列表:', users);
      
      // 查找当前用户
      const currentUser = users.find(u => u.username === data.username);
      
      if (!currentUser) {
        throw new Error('用户不存在');
      }
      
      // 验证密码（这里应该使用真实的密码验证，暂时简化处理）
      // 注意：实际生产环境中应该使用 bcrypt 等库进行密码验证
      if (currentUser.password_hash !== data.password) {
        throw new Error('账号或密码错误');
      }
      
      // 构建用户信息
      const userInfo: UserInfo = {
        id: currentUser.id,
        username: currentUser.username,
        name: currentUser.name || currentUser.username,
        type: currentUser.type,
        role: currentUser.role || '外部客户',
        email: currentUser.email,
        phone: currentUser.phone
      };
      
      // 生成 token
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 保存用户信息到本地存储
      localStorage.setItem('ems_user', JSON.stringify(userInfo));
      localStorage.setItem('ems_token', token);
      
      console.log('登录成功:', { user: userInfo, token });
      return { user: userInfo, token };
    } catch (error) {
      console.error('登录失败:', error);
      const errorMessage = error instanceof Error ? error.message : '登录失败，请检查账号和密码';
      throw new Error(errorMessage);
    }
  },

  // 注册
  async register(data: RegisterRequest): Promise<{ user: UserInfo; token: string }> {
    try {
      console.log('注册请求:', data);
      
      // 调用 supabaseService 进行真实注册
      const { userService, roleService } = await import('../services/supabaseService');
      
      // 检查用户是否已存在
      const users = await userService.getUsers();
      const existingUser = users.find(u => u.username === data.username);
      
      if (existingUser) {
        throw new Error('用户名已存在');
      }
      
      // 获取角色列表，找到客户用户角色
      const roles = await roleService.getRoles();
      console.log('角色列表:', roles);
      
      // 查找客户用户角色
      const customerRole = roles.find(r => r.name === '客户用户' || r.name === '外部客户');
      if (!customerRole) {
        console.error('未找到客户用户角色');
        throw new Error('系统配置错误，未找到客户角色');
      }
      
      // 创建用户数据
      const userData = {
        user_name: data.user_name,
        username: data.username,
        password_hash: data.password, // 注意：实际生产环境中应该使用 bcrypt 等库对密码进行哈希处理
        type: 'external', // 外部客户
        role_id: customerRole.id, // 设置客户用户角色
        status: 'enabled', // 启用状态
        email: data.email,
        phone: data.phone
      };
      
      // 创建用户
      const createdUser = await userService.createUser(userData);
      
      if (!createdUser) {
        throw new Error('用户创建失败');
      }
      
      // 构建用户信息
      const userInfo: UserInfo = {
        id: createdUser.id,
        username: createdUser.username,
        name: data.user_name,
        type: 'external',
        role: customerRole.name || '外部客户',
        email: data.email,
        phone: data.phone
      };
      
      // 生成 token
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 保存用户信息到本地存储
      localStorage.setItem('ems_user', JSON.stringify(userInfo));
      localStorage.setItem('ems_token', token);
      
      console.log('注册成功:', { user: userInfo, token });
      return { user: userInfo, token };
    } catch (error) {
      console.error('注册失败:', error);
      const errorMessage = error instanceof Error ? error.message : '注册失败，请稍后重试';
      throw new Error(errorMessage);
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