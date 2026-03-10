import { UserType } from '../../types';

export type RoleOption = {
  id: string;
  name: string;
  type: UserType;
};

const ROLE_STORAGE_KEY = 'ems_role_management_roles';

const inferRoleType = (role: any): UserType => {
  const direct = role?.type || role?.user_type;
  if (direct === UserType.INTERNAL || direct === UserType.EXTERNAL) return direct;

  const source = `${role?.name || ''} ${role?.description || ''}`.toLowerCase();
  const externalKeywords = ['外部', '客户', 'customer', 'client', 'external'];
  return externalKeywords.some((keyword) => source.includes(keyword)) ? UserType.EXTERNAL : UserType.INTERNAL;
};

export const normalizeRoleOptions = (roles: any[]): RoleOption[] => {
  const deduped = new Map<string, RoleOption>();
  (roles || []).forEach((role: any) => {
    const id = String(role?.id || '').trim();
    const name = String(role?.name || '').trim();
    if (!id || !name) return;

    const type = inferRoleType(role);
    const key = `${type}:${name}`;
    if (!deduped.has(key)) {
      deduped.set(key, { id, name, type });
    }
  });
  return Array.from(deduped.values());
};

export const getRoleManagementRoles = (): RoleOption[] => {
  return normalizeRoleOptions(getRoleManagementRoleRecords());
};

export const getRoleManagementRoleRecords = (): any[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ROLE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

export const saveRoleManagementRoles = (roles: any[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles || []));
};
