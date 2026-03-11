import { cachePermissionKeys, resolvePermissionKeysByUserAndRoles } from '../auth/permissions';
import { validateRegisterInput } from '../utils/userValidation';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginOptions {
  autoCreateExternalIfNotExists?: boolean;
}

export interface RegisterRequest {
  name: string;
  username: string;
  phone: string;
  email: string;
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
  role_id?: string;
  role_ids?: string[];
  email?: string;
  phone?: string;
  permissions?: string[];
}

const generateSecureToken = (): string => {
  const timestamp = Date.now();
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  return `ems_${timestamp}_${uuid}`;
};

export const authService = {
  async login(data: LoginRequest, options?: LoginOptions): Promise<{ user: UserInfo; token: string }> {
    try {
      const { userService, roleService } = await import('../services/supabaseService');
      const users = await userService.getUsers();
      const loginIdentifier = String(data.username || '').trim();
      const normalizedPhone = loginIdentifier.replace(/\s+/g, '');

      let currentUser = users.find((u: any) => {
        const username = String(u.username || '').trim();
        const phone = String(u.phone || '').replace(/\s+/g, '');
        return username === loginIdentifier || (normalizedPhone && phone === normalizedPhone);
      });
      if (!currentUser) {
        if (!options?.autoCreateExternalIfNotExists) {
          throw new Error('用户不存在（请使用用户名或手机号登录）');
        }

        const roles = await roleService.getRoles();
        const customerRole = roles.find((r: any) => r.name === '客户用户' || r.name === '外部客户' || r.type === 'external');
        if (!customerRole) throw new Error('系统配置错误，未找到外部角色');

        const createdUser = await userService.createUser({
          user_name: loginIdentifier,
          username: loginIdentifier,
          password_hash: data.password,
          type: 'external',
          user_type: 'external',
          role_id: customerRole.id,
          status: 'enabled',
        });
        if (!createdUser) throw new Error('自动创建外部用户失败');
        currentUser = createdUser;
      }

      const stored = String(currentUser.password_hash || '');
      if (stored !== data.password) throw new Error('账号或密码错误');

      const roles = await roleService.getRoles();
      const roleName = roles.find((r: any) => r.id === currentUser.role_id)?.name || '外部客户';
      const permissionKeys = resolvePermissionKeysByUserAndRoles(currentUser, roles || []);

      const userInfo: UserInfo = {
        id: currentUser.id,
        username: currentUser.username,
        name: currentUser.user_name || currentUser.name || currentUser.username,
        type: currentUser.user_type || currentUser.type || 'external',
        role: roleName,
        role_id: currentUser.role_id,
        role_ids: Array.isArray(currentUser.role_ids)
          ? currentUser.role_ids.filter(Boolean)
          : [currentUser.role_id].filter(Boolean),
        email: currentUser.email,
        phone: currentUser.phone,
        permissions: permissionKeys,
      };

      const token = generateSecureToken();

      await userService.updateUser(currentUser.id, {
        last_login_time: new Date().toISOString(),
      });

      localStorage.setItem('ems_user', JSON.stringify(userInfo));
      localStorage.setItem('ems_token', token);
      cachePermissionKeys(permissionKeys);
      return { user: userInfo, token };
    } catch (error) {
      const msg = error instanceof Error ? error.message : '登录失败，请检查账号和密码';
      throw new Error(msg);
    }
  },

  async register(data: RegisterRequest): Promise<{ user: UserInfo; token: string }> {
    try {
      const normalizedData: RegisterRequest = {
        ...data,
        name: String(data.name || '').trim(),
        username: String(data.username || '').trim(),
        phone: String(data.phone || '').trim(),
        email: String(data.email || '').trim(),
      };

      const validationError = validateRegisterInput(normalizedData);
      if (validationError) throw new Error(validationError);

      const { userService, roleService } = await import('../services/supabaseService');
      const users = await userService.getUsers();
      const existingUser = users.find((u: any) => u.username === normalizedData.username);
      if (existingUser) throw new Error('用户名已存在');

      const roles = await roleService.getRoles();
      const customerRole = roles.find((r: any) => r.name === '客户用户' || r.name === '外部客户');
      if (!customerRole) throw new Error('系统配置错误，未找到客户角色');

      const createdUser = await userService.createUser({
        user_name: normalizedData.name,
        username: normalizedData.username,
        password_hash: normalizedData.password,
        type: 'external',
        user_type: 'external',
        role_id: customerRole.id,
        status: 'enabled',
        email: normalizedData.email,
        phone: normalizedData.phone,
      });
      if (!createdUser) throw new Error('用户创建失败');
      const permissionKeys = resolvePermissionKeysByUserAndRoles(createdUser, roles || []);

      const userInfo: UserInfo = {
        id: createdUser.id,
        username: createdUser.username,
        name: createdUser.name || normalizedData.name,
        type: createdUser.user_type || createdUser.type || 'external',
        role: customerRole.name || '外部客户',
        role_id: createdUser.role_id,
        role_ids: Array.isArray(createdUser.role_ids)
          ? createdUser.role_ids.filter(Boolean)
          : [createdUser.role_id].filter(Boolean),
        email: createdUser.email || normalizedData.email,
        phone: createdUser.phone || normalizedData.phone,
        permissions: permissionKeys,
      };

      const token = generateSecureToken();
      localStorage.setItem('ems_user', JSON.stringify(userInfo));
      localStorage.setItem('ems_token', token);
      cachePermissionKeys(permissionKeys);
      return { user: userInfo, token };
    } catch (error) {
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
    cachePermissionKeys([]);
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
