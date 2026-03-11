import { UserType } from '../../types';

export type PermissionAction = {
  key: string;
  label: string;
};

export type PermissionSubMenu = {
  key: string;
  label: string;
  actions: PermissionAction[];
};

export type PermissionGroup = {
  key: string;
  title: string;
  items: PermissionSubMenu[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'dashboard',
    title: '\u552e\u524d\u7efc\u5408\u770b\u677f',
    items: [
      {
        key: 'dashboard',
        label: '\u552e\u524d\u7efc\u5408\u770b\u677f',
        actions: [{ key: 'dashboard:view', label: '\u67e5\u770b' }],
      },
    ],
  },
  {
    key: 'survey',
    title: '\u5ba2\u6237\u8c03\u7814\u7ba1\u7406',
    items: [
      {
        key: 'survey_form',
        label: '\u8c03\u7814\u8868\u5355\u5217\u8868',
        actions: [
          { key: 'survey_form:view', label: '\u67e5\u770b' },
          { key: 'survey_form:create', label: '\u65b0\u5efa' },
          { key: 'survey_form:edit', label: '\u7f16\u8f91' },
          { key: 'survey_form:delete', label: '\u5220\u9664' },
          { key: 'survey_form:submit', label: '\u63d0\u4ea4' },
          { key: 'survey_form:generate_report', label: '\u751f\u6210\u62a5\u544a' },
          { key: 'survey_form:view_report', label: '\u67e5\u770b\u62a5\u544a' },
          { key: 'survey_form:share_report', label: '\u5206\u4eab\u62a5\u544a' },
          { key: 'survey_form:export_report', label: '\u5bfc\u51fa\u62a5\u544a' },
        ],
      },
      {
        key: 'survey_template',
        label: '\u8c03\u7814\u6a21\u677f\u7ba1\u7406',
        actions: [
          { key: 'survey_template:view', label: '\u67e5\u770b' },
          { key: 'survey_template:rename', label: '\u4fee\u6539\u540d\u79f0' },
        ],
      },
    ],
  },
  {
    key: 'product',
    title: '\u4ea7\u54c1\u65b9\u6848\u7ba1\u7406',
    items: [
      {
        key: 'capability',
        label: '\u4ea7\u54c1\u80fd\u529b\u7ef4\u62a4',
        actions: [
          { key: 'capability:view', label: '\u67e5\u770b' },
          { key: 'capability:create', label: '\u65b0\u589e' },
          { key: 'capability:edit', label: '\u7f16\u8f91' },
          { key: 'capability:delete', label: '\u5220\u9664' },
          { key: 'capability:import', label: '\u5bfc\u5165' },
          { key: 'capability:export', label: '\u5bfc\u51fa' },
        ],
      },
      {
        key: 'report_template',
        label: '\u62a5\u544a\u6a21\u677f\u7ba1\u7406',
        actions: [
          { key: 'report_template:view', label: '\u67e5\u770b' },
          { key: 'report_template:rename', label: '\u4fee\u6539\u540d\u79f0' },
        ],
      },
    ],
  },
  {
    key: 'settings',
    title: '\u7cfb\u7edf\u8bbe\u7f6e',
    items: [
      {
        key: 'user',
        label: '\u7528\u6237\u7ba1\u7406',
        actions: [
          { key: 'user:view', label: '\u67e5\u770b' },
          { key: 'user:create', label: '\u65b0\u589e' },
          { key: 'user:edit', label: '\u7f16\u8f91' },
          { key: 'user:delete', label: '\u5220\u9664' },
        ],
      },
      {
        key: 'role',
        label: '\u89d2\u8272\u7ba1\u7406',
        actions: [
          { key: 'role:view', label: '\u67e5\u770b' },
          { key: 'role:create', label: '\u65b0\u589e' },
          { key: 'role:edit', label: '\u7f16\u8f91' },
          { key: 'role:delete', label: '\u5220\u9664' },
        ],
      },
      {
        key: 'pre_sales',
        label: '\u552e\u524d\u914d\u7f6e',
        actions: [
          { key: 'pre_sales:view', label: '\u67e5\u770b' },
          { key: 'pre_sales:edit', label: '\u7f16\u8f91' },
        ],
      },
      {
        key: 'dictionary',
        label: '\u5b57\u5178\u7ba1\u7406',
        actions: [
          { key: 'dictionary:view', label: '\u67e5\u770b' },
          { key: 'dictionary:create', label: '\u65b0\u589e' },
          { key: 'dictionary:edit', label: '\u7f16\u8f91' },
          { key: 'dictionary:delete', label: '\u5220\u9664' },
        ],
      },
      {
        key: 'message',
        label: '\u6d88\u606f\u4e2d\u5fc3',
        actions: [
          { key: 'message:view', label: '\u67e5\u770b' },
          { key: 'message:mark_read', label: '\u6807\u8bb0\u5df2\u8bfb' },
        ],
      },
      {
        key: 'logs',
        label: '\u65e5\u5fd7\u7ba1\u7406',
        actions: [
          { key: 'logs:view', label: '\u67e5\u770b' },
          { key: 'logs:export', label: '\u5bfc\u51fa' },
        ],
      },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((group) =>
  group.items.flatMap((item) => item.actions.map((action) => action.key)),
);

const KNOWN_PERMISSION_KEY_SET = new Set(ALL_PERMISSION_KEYS);

export const PERMISSION_LABEL_MAP = new Map(
  PERMISSION_GROUPS.flatMap((group) =>
    group.items.flatMap((item) =>
      item.actions.map((action) => [action.key, `${item.label}\uff1a${action.label}`] as const),
    ),
  ),
);

export const LEGACY_PERMISSION_KEY_MAP: Record<string, string[]> = {
  'dashboard:view': ['dashboard:view'],
  'survey:view': ['survey_form:view'],
  'survey:create': ['survey_form:create'],
  'survey:edit': ['survey_form:edit'],
  'survey:delete': ['survey_form:delete'],
  'report:view': ['survey_form:view_report'],
  'report:generate': ['survey_form:generate_report'],
  'product:edit': ['capability:edit'],
  'system:users': ['user:view'],
  'system:roles': ['role:view'],
  'system:config': ['pre_sales:view', 'dictionary:view', 'message:view'],
  'system:logs': ['logs:view'],
};

export const PERMISSION_STORAGE_KEY = 'ems_permission_keys';
export const PERMISSION_EVENT = 'ems_permissions_updated';

const parsePermissionStorage = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const readPermissionKeys = (): string[] => {
  if (typeof window === 'undefined') return [];
  return parsePermissionStorage(window.localStorage.getItem(PERMISSION_STORAGE_KEY));
};

export const readPermissionKeySet = () => new Set(readPermissionKeys());

const normalizeRoleType = (value: any): 'internal' | 'external' => {
  const raw = String(value ?? '').trim();
  const normalized = raw.toLowerCase();
  if (normalized === UserType.INTERNAL || normalized.includes('internal') || raw.includes('\u5185\u90e8')) {
    return 'internal';
  }
  if (
    normalized === UserType.EXTERNAL
    || normalized.includes('external')
    || raw.includes('\u5916\u90e8')
    || raw.includes('\u5ba2\u6237')
  ) {
    return 'external';
  }
  return 'internal';
};

const dedupe = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

export const normalizePermissionRecord = (permissions: Record<string, boolean> | undefined | null) => {
  const normalized: Record<string, boolean> = {};
  Object.entries(permissions || {}).forEach(([rawKey, enabled]) => {
    if (!enabled) return;
    const key = String(rawKey || '').trim();
    if (!key) return;

    const aliasTargets = LEGACY_PERMISSION_KEY_MAP[key];
    if (aliasTargets?.length) {
      aliasTargets.forEach((targetKey) => {
        normalized[targetKey] = true;
      });
      return;
    }

    if (KNOWN_PERMISSION_KEY_SET.has(key)) {
      normalized[key] = true;
    }
  });
  return normalized;
};

export const getEnabledPermissionKeys = (permissions: Record<string, boolean> | undefined | null): string[] =>
  Object.keys(normalizePermissionRecord(permissions));

export const getEnabledPermissionLabels = (permissions: Record<string, boolean> | undefined | null): string[] => {
  const keys = getEnabledPermissionKeys(permissions);
  return keys.map((key) => PERMISSION_LABEL_MAP.get(key) || `\u672a\u77e5\u6743\u9650\uff1a${key}`);
};

export const isSuperAdminUser = (user: any, roles: any[] = []) => {
  const roleText = String(user?.role || '').toLowerCase();
  if (roleText.includes('\u8d85\u7ea7\u7ba1\u7406\u5458') || roleText.includes('super admin')) return true;

  const roleIds = Array.isArray(user?.role_ids) ? user.role_ids.filter(Boolean) : [user?.role_id].filter(Boolean);
  if (!roleIds.length) return false;

  const roleMap = new Map((roles || []).map((role: any) => [String(role?.id || ''), role]));
  return roleIds.some((roleId: string) => {
    const role = roleMap.get(String(roleId || ''));
    const roleName = String(role?.name || '').toLowerCase();
    return roleName.includes('\u8d85\u7ea7\u7ba1\u7406\u5458') || roleName.includes('super admin');
  });
};

export const resolvePermissionKeysByUserAndRoles = (user: any, roles: any[] = []): string[] => {
  if (!user) return [];
  if (isSuperAdminUser(user, roles)) return ['*'];

  const roleIds = Array.isArray(user?.role_ids)
    ? dedupe(user.role_ids.filter(Boolean))
    : [user?.role_id].filter(Boolean);
  if (!roleIds.length) return [];

  const roleMap = new Map((roles || []).map((role: any) => [String(role?.id || ''), role]));
  const permissions = roleIds.flatMap((roleId: string) => {
    const role = roleMap.get(String(roleId || ''));
    return getEnabledPermissionKeys(role?.permissions || {});
  });

  return dedupe(permissions);
};

export const cachePermissionKeys = (permissionKeys: string[]) => {
  if (typeof window === 'undefined') return;
  const next = dedupe(permissionKeys);
  window.localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(PERMISSION_EVENT, { detail: next }));
};

export const hasPermission = (permissionKey: string, keys?: Set<string>): boolean => {
  const permissionSet = keys || readPermissionKeySet();
  return permissionSet.has('*') || permissionSet.has(permissionKey);
};

export const hasAnyPermission = (permissionKeys: string[], keys?: Set<string>): boolean => {
  if (!permissionKeys.length) return true;
  return permissionKeys.some((permissionKey) => hasPermission(permissionKey, keys));
};

type RoutePermissionRule = {
  test: (pathname: string) => boolean;
  anyOf: string[];
};

const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  { test: (pathname) => pathname === '/' || pathname === '/dashboard', anyOf: ['dashboard:view'] },
  { test: (pathname) => pathname === '/customer-survey/list', anyOf: ['survey_form:view'] },
  { test: (pathname) => pathname === '/customer-survey/templates', anyOf: ['survey_template:view'] },
  { test: (pathname) => pathname === '/surveys/new', anyOf: ['survey_form:create'] },
  {
    test: (pathname) => /^\/surveys\/fill\/[^/]+$/.test(pathname) || /^\/authorized\/surveys\/fill\/[^/]+$/.test(pathname),
    anyOf: ['survey_form:view', 'survey_form:edit', 'survey_form:submit'],
  },
  { test: (pathname) => /^\/reports\/[^/]+$/.test(pathname), anyOf: ['survey_form:view_report'] },
  { test: (pathname) => pathname === '/product-solution/capabilities', anyOf: ['capability:view'] },
  { test: (pathname) => pathname === '/product-solution/report-templates', anyOf: ['report_template:view'] },
  { test: (pathname) => pathname === '/settings/users', anyOf: ['user:view'] },
  { test: (pathname) => pathname === '/settings/roles', anyOf: ['role:view'] },
  { test: (pathname) => pathname === '/settings/pre-sales', anyOf: ['pre_sales:view'] },
  { test: (pathname) => pathname === '/settings/dictionaries', anyOf: ['dictionary:view'] },
  { test: (pathname) => pathname === '/settings/messages', anyOf: ['message:view'] },
  { test: (pathname) => pathname === '/settings/logs', anyOf: ['logs:view'] },
];

export const canAccessPathByPermissions = (pathname: string, keys?: Set<string>) => {
  const matchedRule = ROUTE_PERMISSION_RULES.find((rule) => rule.test(pathname));
  if (!matchedRule) return true;
  return hasAnyPermission(matchedRule.anyOf, keys);
};

const DEFAULT_REDIRECT_CANDIDATES: Array<{ path: string; anyOf: string[] }> = [
  { path: '/customer-survey/list', anyOf: ['survey_form:view'] },
  { path: '/', anyOf: ['dashboard:view'] },
  { path: '/product-solution/capabilities', anyOf: ['capability:view'] },
  { path: '/settings/messages', anyOf: ['message:view'] },
];

export const getDefaultAuthorizedPath = (keys?: Set<string>) => {
  const candidate = DEFAULT_REDIRECT_CANDIDATES.find((item) => hasAnyPermission(item.anyOf, keys));
  return candidate?.path || '/login';
};

export const guardPermission = (
  permissionKey: string,
  actionLabel: string,
  keys?: Set<string>,
  notifier: (message: string) => void = (message) => window.alert(message),
) => {
  if (hasPermission(permissionKey, keys)) return true;
  notifier(`\u65e0\u6743\u9650\uff1a\u65e0\u6cd5${actionLabel}`);
  return false;
};

export const getKnownPermissionKeys = () => ALL_PERMISSION_KEYS;

export const normalizeRoleRecordType = (value: any) => normalizeRoleType(value);
