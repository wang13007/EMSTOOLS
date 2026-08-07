import { cachePermissionKeys, resolvePermissionKeysByUserAndRoles } from '../auth/permissions';
import { hashPassword, shouldUpgradePasswordHash, verifyPassword } from '../utils/passwordSecurity';
import { LogType, OperationResult } from '../../types';
import { validateRegisterInput } from '../utils/userValidation';
import { createAuditLog, roleService, userService } from './supabaseService';

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

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type StoredSession = {
  token: string;
  userId: string;
  expiresAt: number;
};

const generateSecureToken = (): string => {
  const timestamp = Date.now();
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  return `ems_${timestamp}_${uuid}`;
};

const createStoredSession = (user: UserInfo, token: string): StoredSession => ({
  token,
  userId: user.id,
  expiresAt: Date.now() + SESSION_TTL_MS,
});

const persistSession = (user: UserInfo, token: string) => {
  localStorage.setItem('ems_user', JSON.stringify(user));
  localStorage.setItem('ems_token', token);
  localStorage.setItem('ems_session', JSON.stringify(createStoredSession(user, token)));
};

const clearStoredSession = () => {
  localStorage.removeItem('ems_user');
  localStorage.removeItem('ems_token');
  localStorage.removeItem('ems_session');
  cachePermissionKeys([]);
};

const readStoredSession = (): StoredSession | null => {
  try {
    const raw = localStorage.getItem('ems_session');
    const token = localStorage.getItem('ems_token');
    if (!raw || !token) return null;
    const session = JSON.parse(raw) as StoredSession;
    if (!session?.token || session.token !== token || !session.expiresAt || session.expiresAt <= Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

export const authService = {
  async login(data: LoginRequest, options?: LoginOptions): Promise<{ user: UserInfo; token: string }> {
    try {
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
          password_hash: await hashPassword(data.password),
          type: 'external',
          user_type: 'external',
          role_id: customerRole.id,
          status: 'enabled',
        });
        if (!createdUser) throw new Error('自动创建外部用户失败');
        currentUser = createdUser;
      }

      if (String(currentUser.status || 'enabled') !== 'enabled') {
        throw new Error('账号已停用，请联系管理员');
      }

      if (!(await verifyPassword(data.password, currentUser.password_hash))) throw new Error('账号或密码错误');

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

      try {
        const loginUpdatePayload: Record<string, string> = {
          last_login_time: new Date().toISOString(),
        };
        if (shouldUpgradePasswordHash(currentUser.password_hash)) {
          loginUpdatePayload.password_hash = await hashPassword(data.password);
        }
        const updatedUser = await userService.updateUser(currentUser.id, {
          ...loginUpdatePayload,
        });
        if (!updatedUser) {
          console.warn('鏇存柊鐢ㄦ埛鏈€杩戠櫥褰曟椂闂村け璐ワ紝宸茬户缁櫥褰?:', { userId: currentUser.id });
        }
      } catch (updateError) {
        console.warn('鏇存柊鐢ㄦ埛鏈€杩戠櫥褰曟椂闂村け璐ワ紝宸茬户缁櫥褰?:', {
          userId: currentUser.id,
          error: updateError,
        });
      }

      persistSession(userInfo, token);
      cachePermissionKeys(permissionKeys);
      await createAuditLog({
        type: LogType.LOGIN,
        content: `${userInfo.name || userInfo.username} 登录系统`,
        result: OperationResult.SUCCESS,
        operatorId: userInfo.id,
      });
      return { user: userInfo, token };
    } catch (error) {
      const msg = error instanceof Error ? error.message : '登录失败，请检查账号和密码';
      await createAuditLog({
        type: LogType.LOGIN,
        content: `登录失败：${String(data.username || '').trim() || '未知账号'}，${msg}`,
        result: OperationResult.FAILURE,
      });
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

      const users = await userService.getUsers();
      const existingUser = users.find((u: any) => u.username === normalizedData.username);
      if (existingUser) throw new Error('用户名已存在');

      const roles = await roleService.getRoles();
      const customerRole = roles.find((r: any) => r.name === '客户用户' || r.name === '外部客户');
      if (!customerRole) throw new Error('系统配置错误，未找到客户角色');

      const createdUser = await userService.createUser({
        user_name: normalizedData.name,
        username: normalizedData.username,
        password_hash: await hashPassword(normalizedData.password),
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
      persistSession(userInfo, token);
      cachePermissionKeys(permissionKeys);
      await createAuditLog({
        type: LogType.LOGIN,
        content: `${userInfo.name || userInfo.username} 注册并登录系统`,
        result: OperationResult.SUCCESS,
        operatorId: userInfo.id,
      });
      return { user: userInfo, token };
    } catch (error) {
      const msg = error instanceof Error ? error.message : '注册失败，请稍后重试';
      await createAuditLog({
        type: LogType.LOGIN,
        content: `用户注册失败：${String(data.username || '').trim() || '未知账号'}，${msg}`,
        result: OperationResult.FAILURE,
      });
      throw new Error(msg);
    }
  },

  async forgotPassword(_data: ForgotPasswordRequest): Promise<{ success: boolean }> {
    throw new Error('密码找回暂未启用，请联系管理员重置密码');
  },

  async resetPassword(_data: ResetPasswordRequest): Promise<{ success: boolean }> {
    throw new Error('密码重置链接暂未启用，请联系管理员重置密码');
  },

  async logout(): Promise<{ success: boolean }> {
    const currentUser = await authService.getCurrentUser();
    await createAuditLog({
      type: LogType.LOGIN,
      content: `${currentUser?.name || currentUser?.username || '当前用户'} 退出登录`,
      result: OperationResult.SUCCESS,
      operatorId: currentUser?.id,
    });
    clearStoredSession();
    return { success: true };
  },

  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const session = readStoredSession();
      if (!session) {
        clearStoredSession();
        return null;
      }
      const userStr = localStorage.getItem('ems_user');
      if (!userStr) return null;
      const user = JSON.parse(userStr) as UserInfo;
      if (user.id !== session.userId) {
        clearStoredSession();
        return null;
      }
      return user;
    } catch {
      return null;
    }
  },

  isLoggedIn(): boolean {
    const session = readStoredSession();
    if (!session) {
      clearStoredSession();
      return false;
    }
    return true;
  },
};

export default authService;
