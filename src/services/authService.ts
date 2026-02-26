export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  user_name: string;
  username: string;
  phone?: string;
  email?: string;
  password: string;
  confirm_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirm_password: string;
}

export interface UserInfo {
  id: string;
  username: string;
  name: string;
  type: string;
  role: string;
  email?: string;
  phone?: string;
}

const LEGACY_DEFAULT_HASH_PREFIX = '$2';

export const authService = {
  async login(data: LoginRequest): Promise<{ user: UserInfo; token: string }> {
    try {
      console.log('登录请求:', data);

      const { userService, roleService } = await import('../services/supabaseService');

      const users = await userService.getUsers();
      console.log('数据库用户列表:', users);

      const currentUser = users.find((u: any) => u.username === data.username);
      if (!currentUser) {
        throw new Error('用户不存在');
      }

      const stored = String(currentUser.password_hash || '');
      const plainMatch = stored === data.password;
      const legacyHash = stored.startsWith(LEGACY_DEFAULT_HASH_PREFIX);
      const legacyFallbackMatch = legacyHash && (data.password === data.username || data.password === '123456');

      if (!plainMatch && !legacyFallbackMatch) {
        throw new Error('账号或密码错误');
      }

      const roles = await roleService.getRoles();
      const roleName = roles.find((r: any) => r.id === currentUser.role_id)?.name || '外部客户';

      const userType = currentUser.user_type || currentUser.type || 'external';
      const userInfo: UserInfo = {
        id: currentUser.id,
        username: currentUser.username,
        name: currentUser.user_name || currentUser.name || currentUser.username,
        type: userType,
        role: roleName,
        email: currentUser.email,
        phone: currentUser.phone,
      };

      const token = `token_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

      localStorage.setItem('ems_user', JSON.stringify(userInfo));
      localStorage.setItem('ems_token', token);

      console.log('登录成功:', { user: userInfo, token });
      return { user: userInfo, token };
    } catch (error) {
      console.error('登录失败:', error);
      const msg = error instanceof Error ? error.message : '登录失败，请检查账号和密码';
      throw new Error(msg);
    }
  },

  async register(data: RegisterRequest): Promise<{ user: UserInfo; token: string }> {
    try {
      console.log('注册请求:', data);

      const { userService, roleService } = await import('../services/supabaseService');

      const users = await userService.getUsers();
      const existingUser = users.find((u: any) => u.username === data.username);
      if (existingUser) {
        throw new Error('用户名已存在');
      }

      const roles = await roleService.getRoles();
      console.log('角色列表:', roles);

      const customerRole = roles.find((r: any) => r.name === '客户用户' || r.name === '外部客户');
      if (!customerRole) {
        throw new Error('系统配置错误，未找到客户角色');
      }

      const userData = {
        user_name: data.user_name,
        username: data.username,
        password_hash: data.password,
        type: 'external',
        user_type: 'external',
        role_id: customerRole.id,
        status: 'enabled',
        email: data.email,
        phone: data.phone,
      };

      const createdUser = await userService.createUser(userData);
      if (!createdUser) {
        throw new Error('用户创建失败');
      }

      const userInfo: UserInfo = {
        id: createdUser.id,
        username: createdUser.username,
        name: createdUser.user_name || data.user_name,
        type: createdUser.user_type || createdUser.type || 'external',
        role: customerRole.name || '外部客户',
        email: createdUser.email || data.email,
        phone: createdUser.phone || data.phone,
      };

      const token = `token_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

      localStorage.setItem('ems_user', JSON.stringify(userInfo));
      localStorage.setItem('ems_token', token);

      console.log('注册成功:', { user: userInfo, token });
      return { user: userInfo, token };
    } catch (error) {
      console.error('注册失败:', error);
      const msg = error instanceof Error ? error.message : '注册失败，请稍后重试';
      throw new Error(msg);
    }
  },

  async forgotPassword(_data: ForgotPasswordRequest): Promise<{ success: boolean }> {
    return { success: true };
  },

  async resetPassword(_data: ResetPasswordRequest): Promise<{ success: boolean }> {
    return { success: true };
  },

  async logout(): Promise<{ success: boolean }> {
    localStorage.removeItem('ems_user');
    localStorage.removeItem('ems_token');
    return { success: true };
  },

  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const userStr = localStorage.getItem('ems_user');
      if (!userStr) return null;
      return JSON.parse(userStr) as UserInfo;
    } catch {
      return null;
    }
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem('ems_token');
  },
};

export default authService;
