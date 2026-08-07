import supabase from '../config/supabase';
import { LogType, OperationResult, ReportStatus, SurveyForm, SurveyStatus, SurveyTemplate, SystemLog } from '../../types';
import { hashPassword, isHashedPassword } from '../utils/passwordSecurity';
import { generateShareToken, hashShareToken } from '../utils/shareSecurity';

const isMissingColumn = (error: any, column: string) => {
  return error?.code === 'PGRST204' && String(error?.message || '').includes(`'${column}'`);
};

const getMissingColumnName = (error: any): string | null => {
  if (error?.code !== 'PGRST204') return null;
  const message = String(error?.message || '');
  const match = message.match(/'([^']+)'/);
  return match?.[1] || null;
};

const formatSupabaseReadError = (resourceName: string, error: any) => {
  const message = String(error?.message || error?.name || error || '').trim();
  const code = String(error?.code || error?.status || '').trim();
  const combined = `${message} ${code}`.toLowerCase();

  if (message.startsWith(`${resourceName}加载失败`)) {
    return message;
  }

  if (
    combined.includes('failed to fetch') ||
    combined.includes('networkerror') ||
    combined.includes('err_connection_closed') ||
    combined.includes('connection') ||
    combined.includes('fetcherror')
  ) {
    return `无法连接 Supabase，${resourceName}加载失败。请检查网络、代理/VPN、防火墙，以及 VITE_SUPABASE_URL 是否可访问。`;
  }

  if (code === '401' || code === '403' || combined.includes('jwt') || combined.includes('apikey')) {
    return `Supabase 密钥无效或权限不足，${resourceName}加载失败。请检查 VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY。`;
  }

  if (code === '42501' || combined.includes('permission denied')) {
    return `${resourceName}加载失败：Supabase RLS/表权限拒绝访问，请执行 anon 访问策略修复脚本或改用 Supabase Auth。`;
  }

  return `${resourceName}加载失败${message ? `：${message}` : ''}`;
};

const formatSupabaseWriteError = (error: any) => {
  if (!error) return '未知错误';
  const code = String(error.code || '');
  const message = String(error.message || '');
  const details = String(error.details || '');
  const hint = String(error.hint || '');
  const combined = `${message} ${details} ${hint}`.toLowerCase();

  if (code === '23505' || combined.includes('duplicate key')) {
    if (combined.includes('username')) return '用户名已存在，请更换后重试';
    if (combined.includes('user_name')) return '账号已存在，请更换后重试';
    if (combined.includes('phone')) return '手机号已存在，请更换后重试';
    if (combined.includes('email')) return '邮箱已存在，请更换后重试';
    return '存在重复数据，请检查用户名/账号/手机号/邮箱是否已被使用';
  }

  if (code === '22P02' || combined.includes('invalid input syntax for type uuid')) {
    return '用户数据格式错误（UUID 字段无效），请刷新页面后重试';
  }

  if (code === '23514') {
    return '用户数据未通过约束校验，请检查用户类型、状态或角色配置';
  }

  if (code === '23502' || combined.includes('null value in column')) {
    return '存在必填字段为空，请检查用户名、角色等必填信息';
  }

  return message || details || '创建用户失败，请稍后重试';
};

const MULTI_ROLE_CACHE_KEY = 'ems_user_role_ids_map';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const dedupeStringArray = (values: Array<string | undefined | null>) => {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
};

const isUuid = (value: string | null | undefined) => Boolean(value && UUID_REGEX.test(value));

const normalizeUserType = (value: any): 'internal' | 'external' => {
  const raw = String(value ?? '').trim();
  const normalized = raw.toLowerCase();
  if (normalized === 'internal' || normalized.includes('internal') || raw.includes('鍐呴儴')) {
    return 'internal';
  }
  if (normalized === 'external' || normalized.includes('external') || raw.includes('澶栭儴') || raw.includes('瀹㈡埛')) {
    return 'external';
  }
  return 'external';
};

const normalizeRoleType = (value: any): 'internal' | 'external' | null => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  if (normalized === 'internal' || normalized.includes('internal') || raw.includes('鍐呴儴')) {
    return 'internal';
  }
  if (normalized === 'external' || normalized.includes('external') || raw.includes('澶栭儴') || raw.includes('瀹㈡埛')) {
    return 'external';
  }
  return null;
};

const inferRoleType = (role: any): 'internal' | 'external' => {
  const directType = normalizeRoleType(role?.type || role?.user_type);
  if (directType) {
    return directType;
  }

  const source = `${role?.name || ''} ${role?.description || ''}`.toLowerCase();
  const externalKeywords = ['澶栭儴', '瀹㈡埛', 'customer', 'client', 'external'];
  return externalKeywords.some((keyword) => source.includes(keyword)) ? 'external' : 'internal';
};

const canUseLocalStorage = () => {
  return typeof window !== 'undefined' && !!window.localStorage;
};

const CJK_SURVEY_STATUS = {
  draft: '\u8349\u7A3F',
  filling: '\u586B\u5199\u4E2D',
  completed: '\u5DF2\u5B8C\u6210',
} as const;

const CJK_REPORT_STATUS = {
  pending: '\u672A\u751F\u6210',
  generated: '\u5DF2\u751F\u6210',
} as const;

const toDbSurveyStatus = (value: any): 'draft' | 'in_progress' | 'completed' => {
  const raw = String(value ?? '').trim();
  const lower = raw.toLowerCase();

  if (lower === 'in_progress' || raw === CJK_SURVEY_STATUS.filling || raw === SurveyStatus.FILLING) {
    return 'in_progress';
  }
  if (lower === 'completed' || raw === CJK_SURVEY_STATUS.completed || raw === SurveyStatus.COMPLETED) {
    return 'completed';
  }
  return 'draft';
};

const toDbReportStatus = (value: any): 'pending' | 'generated' => {
  const raw = String(value ?? '').trim();
  const lower = raw.toLowerCase();

  if (lower === 'generated' || raw === CJK_REPORT_STATUS.generated || raw === ReportStatus.GENERATED) {
    return 'generated';
  }
  return 'pending';
};

const toClientSurveyStatus = (value: any): SurveyStatus => {
  const raw = String(value ?? '').trim();
  const lower = raw.toLowerCase();

  if (lower === 'in_progress' || raw === CJK_SURVEY_STATUS.filling) {
    return SurveyStatus.FILLING;
  }
  if (lower === 'completed' || raw === CJK_SURVEY_STATUS.completed) {
    return SurveyStatus.COMPLETED;
  }
  return SurveyStatus.DRAFT;
};

const toClientReportStatus = (value: any): ReportStatus => {
  const raw = String(value ?? '').trim();
  const lower = raw.toLowerCase();

  if (lower === 'generated' || raw === CJK_REPORT_STATUS.generated) {
    return ReportStatus.GENERATED;
  }
  return ReportStatus.NOT_GENERATED;
};

const normalizeSurveyRow = (survey: any) => {
  if (!survey || typeof survey !== 'object') return survey;
  return {
    ...survey,
    status: toClientSurveyStatus(survey.status),
    report_status: toClientReportStatus(survey.report_status),
  };
};

const resolveSurveyUserRefToId = async (value: any): Promise<string | null | undefined> => {
  if (typeof value === 'undefined') return undefined;
  if (value === null || value === '') return null;

  const candidate = String(value).trim();
  if (!isUuid(candidate)) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id,user_id')
    .or(`id.eq.${candidate},user_id.eq.${candidate}`)
    .limit(1);

  if (error) {
    console.warn('瑙ｆ瀽璋冪爺琛ㄥ崟鐢ㄦ埛澶栭敭澶辫触:', { candidate, error });
    return null;
  }

  return data?.[0]?.id || null;
};

const getLocalUserContext = () => {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem('ems_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    const idCandidates = dedupeStringArray([user?.id, user?.user_id]);
    const roleIds = Array.isArray(user?.role_ids)
      ? dedupeStringArray(user.role_ids)
      : dedupeStringArray([user?.role_id]);
    return {
      id: idCandidates[0] || '',
      ids: idCandidates,
      type: user?.type || user?.user_type || '',
      role: user?.role || '',
      role_id: user?.role_id || roleIds[0] || '',
      role_ids: roleIds,
    };
  } catch {
    return null;
  }
};

const getLocalUserDisplayName = () => {
  if (!canUseLocalStorage()) return '';
  try {
    const raw = window.localStorage.getItem('ems_user');
    if (!raw) return '';
    const user = JSON.parse(raw);
    return String(user?.name || user?.user_name || user?.username || '').trim();
  } catch {
    return '';
  }
};

const getClientAddressHint = () => {
  if (typeof window === 'undefined') return 'server';
  return window.location?.hostname || 'browser';
};

const insertAuditLogDirectly = async (payload: {
  operator_id: string | null;
  type: LogType;
  content: string;
  ip_address: string;
  result: OperationResult;
}) => {
  const { data, error } = await supabase.from('system_logs').insert(payload).select().maybeSingle();
  if (error) {
    console.error('写入审计日志失败:', error);
    return null;
  }
  return data;
};

export const createAuditLog = async (params: {
  type: LogType;
  content: string;
  result?: OperationResult;
  operatorId?: string | null;
  ipAddress?: string | null;
}) => {
  try {
    const localUser = getLocalUserContext();
    const operatorId = params.operatorId || localUser?.id || null;
    const payload = {
      operator_id: operatorId && isUuid(operatorId) ? operatorId : null,
      type: params.type,
      content: String(params.content || '').slice(0, 1000),
      ip_address: params.ipAddress || getClientAddressHint(),
      result: params.result || OperationResult.SUCCESS,
    };

    const { data, error } = await supabase.functions.invoke('audit-log', {
      body: {
        operator_id: payload.operator_id,
        type: payload.type,
        content: payload.content,
        result: payload.result,
        client_address_hint: payload.ip_address,
        client_time: new Date().toISOString(),
        location: typeof window === 'undefined'
          ? undefined
          : {
              href: window.location.href,
              pathname: window.location.pathname,
              hash: window.location.hash,
            },
      },
    });

    if (!error) {
      return data?.log || data || null;
    }

    const strictAudit = String(import.meta.env.VITE_AUDIT_LOG_STRICT || '').toLowerCase() === 'true';
    console.error('调用审计 Edge Function 失败:', error);
    if (strictAudit) {
      return null;
    }

    return insertAuditLogDirectly(payload);
  } catch (error) {
    console.error('写入审计日志异常:', error);
    return null;
  }
};

const auditSuccess = (type: LogType, content: string, operatorId?: string | null) =>
  createAuditLog({ type, content, result: OperationResult.SUCCESS, operatorId });

const auditFailure = (type: LogType, content: string, operatorId?: string | null) =>
  createAuditLog({ type, content, result: OperationResult.FAILURE, operatorId });

const describeCurrentOperator = () => getLocalUserDisplayName() || '当前用户';

const isExternalLocalUser = () => {
  const user = getLocalUserContext();
  return user?.type === 'external' ? user : null;
};

const canExternalAccessSurvey = (survey: any, userIds: string | string[]) => {
  const ids = Array.isArray(userIds) ? dedupeStringArray(userIds) : dedupeStringArray([userIds]);
  if (!survey || !ids.length) return false;
  if (ids.includes(survey.creator_id) || ids.includes(survey.submitter_id) || ids.includes(survey.pre_sales_responsible_id)) {
    return true;
  }
  const data = survey.data && typeof survey.data === 'object' ? survey.data : {};
  const sharedIds = Array.isArray(data.external_access_user_ids) ? data.external_access_user_ids : [];
  return ids.some((id) => sharedIds.includes(id));
};

const isExternalLinkEnabled = (survey: any) => {
  const data = survey?.data && typeof survey.data === 'object' ? survey.data : {};
  return Boolean(data.external_link_enabled);
};

const getExternalShareTokens = (survey: any) => {
  const data = survey?.data && typeof survey.data === 'object' ? survey.data : {};
  return Array.isArray(data.external_share_tokens) ? data.external_share_tokens : [];
};

const isExternalShareTokenValid = async (survey: any, token?: string | null) => {
  const tokens = getExternalShareTokens(survey);
  if (!tokens.length) return false;
  const tokenHash = await hashShareToken(String(token || ''));
  if (!tokenHash) return false;
  const now = Date.now();
  return tokens.some((item: any) => {
    if (!item || item.revoked_at) return false;
    if (item.expires_at && new Date(item.expires_at).getTime() <= now) return false;
    return item.token_hash === tokenHash;
  });
};

const createExternalShareTokenRecord = async () => {
  const token = generateShareToken();
  return {
    token,
    record: {
      token_hash: await hashShareToken(token),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };
};

const pickExternalSurveyUpdatePayload = (survey: any) => {
  const payload: any = {};
  if ('data' in survey) payload.data = survey.data;
  if ('status' in survey) payload.status = survey.status;
  if ('submitter_id' in survey) payload.submitter_id = survey.submitter_id;
  return payload;
};

const readRoleCache = (): Record<string, string[]> => {
  if (!canUseLocalStorage()) return {};
  try {
    const raw = window.localStorage.getItem(MULTI_ROLE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeRoleCache = (cache: Record<string, string[]>) => {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(MULTI_ROLE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore localStorage write failures
  }
};

const cacheRoleIdsForUser = (userId: string | undefined, roleIds: string[]) => {
  if (!userId || !roleIds.length) return;
  const cache = readRoleCache();
  cache[userId] = dedupeStringArray(roleIds);
  writeRoleCache(cache);
};

const removeCachedRoleIdsForUser = (userId: string | undefined) => {
  if (!userId) return;
  const cache = readRoleCache();
  if (!(userId in cache)) return;
  delete cache[userId];
  writeRoleCache(cache);
};

const resolveRoleIds = (user: any) => {
  const userId = user.id || user.user_id;
  const roleIdsFromRow = Array.isArray(user.role_ids)
    ? dedupeStringArray(user.role_ids)
    : dedupeStringArray([user.role_id]);
  const cached = userId ? dedupeStringArray(readRoleCache()[userId] || []) : [];
  return cached.length ? cached : roleIdsFromRow;
};

const normalizeRole = (role: any) => ({
  ...role,
  type: inferRoleType(role),
});

const normalizeUser = (user: any) => {
  const userType = normalizeUserType(user.user_type || user.type);
  const roleIds = resolveRoleIds(user);
  const displayName = user.user_name || user.name || user.username;
  return {
    id: user.id || user.user_id,
    user_id: user.user_id,
    user_name: displayName,
    name: displayName,
    username: user.username,
    phone: user.phone,
    email: user.email,
    type: userType,
    user_type: userType,
    role_id: user.role_id,
    role_ids: roleIds,
    status: user.status,
    last_login_time: user.last_login_time,
    create_time: user.create_time,
    password_hash: user.password_hash,
  };
};

const resolveUserRowIdentifiers = async (id: string) => {
  const targetId = String(id || '').trim();
  if (!targetId || !isUuid(targetId)) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('id,user_id')
    .or(`id.eq.${targetId},user_id.eq.${targetId}`)
    .limit(1);

  if (error) {
    console.error('閺屻儲澹橀悽銊﹀煕閺囧瓨鏌婇惄顔界垼婢惰精瑙?', { targetId, error });
    return null;
  }

  const row = data?.[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id || row.user_id,
    user_id: row.user_id || row.id,
  };
};

export const userService = {
  async getUsers() {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('Failed to fetch users:', error);
        throw new Error(formatSupabaseReadError('鐢ㄦ埛鍒楄〃', error));
      }
      return (data || []).map(normalizeUser);
    } catch (error) {
      console.error('Unexpected error while fetching users:', error);
      throw new Error(formatSupabaseReadError('鐢ㄦ埛鍒楄〃', error));
    }
  },

  async getRoles() {
    return roleService.getRoles();
  },

  async validateUserRoles(_userId: string | null, userType: string, roleIds: string[]) {
    const selectedRoleIds = dedupeStringArray(roleIds);
    if (!selectedRoleIds.length) return false;
    const validRoleIds = selectedRoleIds.filter((roleId) => isUuid(roleId));
    if (validRoleIds.length !== selectedRoleIds.length) {
      console.warn('妫€娴嬪埌闈濽UID瑙掕壊ID锛屽凡鎷掔粷鏍￠獙:', selectedRoleIds.filter((roleId) => !isUuid(roleId)));
      return false;
    }

    const { data, error } = await supabase.from('roles').select('*').in('id', validRoleIds);
    if (error || !data) {
      console.error('鏍￠獙鐢ㄦ埛瑙掕壊澶辫触:', error);
      return false;
    }

    if (data.length !== validRoleIds.length) {
      return false;
    }

    const expectedType = normalizeUserType(userType);
    return data.every((role: any) => inferRoleType(role) === expectedType);
  },

  async createUser(user: any) {
    try {
      const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
      if (rolesError) {
        console.error('鑾峰彇瑙掕壊鍒楄〃澶辫触:', rolesError);
      }

      const userType = normalizeUserType(user.user_type || user.type);
      let roleIds = dedupeStringArray([...(user.role_ids || []), user.role_id]);
      let roleId = roleIds[0];

      if (!roleId && roles && roles.length > 0) {
        const typedRoles = roles.filter((r: any) => inferRoleType(r) === userType);
        const fallbackRoles = typedRoles.length > 0 ? typedRoles : roles;
        roleId = fallbackRoles[0]?.id;
        roleIds = roleId ? [roleId] : [];
      }

      if (!roleId) {
        throw new Error('无法确定用户角色，请先在角色管理中配置可用角色');
      }

      const roleValidationPassed = await userService.validateUserRoles(null, userType, roleIds);
      if (!roleValidationPassed) {
        throw new Error(userType === 'internal' ? '内部用户只能选择内部角色' : '外部用户只能选择外部角色');
      }

      const rawPassword = String(user.password_hash || user.password || '');
      if (!rawPassword) {
        throw new Error('创建用户失败：缺少初始密码');
      }
      const baseUser: any = {
        user_name: user.username || user.user_name || user.name,
        name: user.name || user.user_name || user.username,
        username: user.username || user.user_name,
        password_hash: rawPassword && isHashedPassword(rawPassword) ? rawPassword : await hashPassword(rawPassword),
        role_id: roleId,
        role_ids: roleIds,
        status: user.status || 'enabled',
        create_time: new Date().toISOString(),
      };
      if (isUuid(user.user_id)) {
        baseUser.user_id = user.user_id;
      }

      if (user.phone) baseUser.phone = user.phone;
      if (user.email) baseUser.email = user.email;

      const payloads = [
        { ...baseUser, user_type: userType },
        { ...baseUser, type: userType },
        { ...baseUser },
      ];

      let lastError: any = null;

      for (const dbUser of payloads) {
        let payload = { ...dbUser };

        while (true) {
          const { data, error } = await supabase.from('users').insert(payload).select().single();

          if (!error) {
            const createdUserId = data.user_id || data.id;
            cacheRoleIdsForUser(createdUserId, roleIds);
            await auditSuccess(LogType.USER, `${describeCurrentOperator()} 创建用户：${baseUser.username || baseUser.user_name || createdUserId}`);
            return normalizeUser({ ...data, role_ids: roleIds });
          }

          lastError = error;
          const missingColumn = getMissingColumnName(error);

          if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
            const nextPayload = { ...payload };
            delete nextPayload[missingColumn];
            payload = nextPayload;
            console.warn(`users 表缺少字段 ${missingColumn}，已自动剔除后重试`);
            continue;
          }

          if (isMissingColumn(error, 'type') || isMissingColumn(error, 'user_type')) {
            console.warn('用户类型字段不匹配，自动尝试兼容字段:', error.message);
          } else {
            console.error('创建用户失败:', error);
          }
          break;
        }
      }

      const readableMessage = formatSupabaseWriteError(lastError);
      console.error('创建用户失败:', lastError);
      await auditFailure(LogType.USER, `${describeCurrentOperator()} 创建用户失败：${baseUser.username || baseUser.user_name || '未知用户'}，${readableMessage}`);
      throw new Error(readableMessage);
    } catch (error) {
      console.error('创建用户过程中发生异常:', error);
      await auditFailure(LogType.USER, `${describeCurrentOperator()} 创建用户异常：${error instanceof Error ? error.message : '未知错误'}`);
      throw error instanceof Error ? error : new Error('创建用户失败，请稍后重试');
    }
  },

  async updateUser(id: string, user: any) {
    try {
      const targetId = String(id || '').trim();
      if (!targetId) {
        console.error('更新用户失败：用户 ID 为空');
        return null;
      }

      const targetRow = await resolveUserRowIdentifiers(targetId);
      if (!targetRow?.id) {
        console.error('閺囧瓨鏌婇悽銊﹀煕婢惰精瑙? 閺堫亝澹橀崚鏉垮爱闁板秶娈戦悽銊﹀煕', { targetId });
        return null;
      }

      const baseUser: any = {};
      const roleIds = dedupeStringArray([...(user.role_ids || []), user.role_id]);

      if (user.username || user.user_name) {
        baseUser.user_name = user.user_name || user.username;
      }
      if (user.name || user.user_name) {
        baseUser.name = user.name || user.user_name || user.username;
      }
      if (user.password || user.password_hash) {
        const rawPassword = String(user.password || user.password_hash);
        baseUser.password_hash = isHashedPassword(rawPassword) ? rawPassword : await hashPassword(rawPassword);
      }
      if (user.phone) {
        baseUser.phone = user.phone;
      }
      if (user.email) {
        baseUser.email = user.email;
      }
      if (user.status) {
        baseUser.status = user.status;
      }
      if (roleIds.length) {
        baseUser.role_id = roleIds[0];
        baseUser.role_ids = roleIds;
      }
      if (user.last_login_time) {
        baseUser.last_login_time = user.last_login_time;
      }

      const userType = user.user_type || user.type;
      if (userType && roleIds.length) {
        const roleValidationPassed = await userService.validateUserRoles(targetRow.id, userType, roleIds);
        if (!roleValidationPassed) {
          throw new Error(userType === 'internal' ? '鍐呴儴鐢ㄦ埛鍙兘閫夋嫨鍐呴儴瑙掕壊' : '澶栭儴鐢ㄦ埛鍙兘閫夋嫨澶栭儴瑙掕壊');
        }
      }
      const payloads: any[] = userType
        ? [{ ...baseUser, user_type: userType }, { ...baseUser, type: userType }]
        : [{ ...baseUser }];

      for (const dbUser of payloads) {
        let payload = { ...dbUser };

        while (true) {
          const fallback: any = { error: null };
          const primary = await supabase.from('users').update(payload).eq('id', targetRow.id).select().maybeSingle();
          if (!primary.error && primary.data) {
            const updatedUserId = primary.data?.user_id || primary.data?.id;
            if (roleIds.length) cacheRoleIdsForUser(updatedUserId, roleIds);
            if (!user.last_login_time || Object.keys(baseUser).some((key) => key !== 'last_login_time')) {
              await auditSuccess(LogType.USER, `${describeCurrentOperator()} 更新用户：${primary.data?.username || primary.data?.user_name || updatedUserId}`);
            }
            return normalizeUser({ ...primary.data, role_ids: roleIds.length ? roleIds : undefined });
          }

          const missingColumn = getMissingColumnName(primary.error);
          if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
            const nextPayload = { ...payload };
            delete nextPayload[missingColumn];
            payload = nextPayload;
            console.warn(`users 表缺少字段 ${missingColumn}，已自动剔除后重试`);
            continue;
          }

          if (
            isMissingColumn(primary.error, 'type') ||
            isMissingColumn(primary.error, 'user_type')
          ) {
            console.warn('更新用户类型字段不匹配，自动尝试兼容字段');
            break;
          }

          console.error('更新用户失败:', fallback.error || primary.error);
          await auditFailure(LogType.USER, `${describeCurrentOperator()} 更新用户失败：${targetId}`);
          return null;
        }

        if (!Object.prototype.hasOwnProperty.call(payload, 'type') && !Object.prototype.hasOwnProperty.call(payload, 'user_type')) {
          continue;
        }
      }

      console.error('更新用户失败：无法匹配 users 表的类型字段(type/user_type)');
      await auditFailure(LogType.USER, `${describeCurrentOperator()} 更新用户失败：${targetId}`);
      return null;
    } catch (error) {
      console.error('更新用户过程中发生异常:', error);
      await auditFailure(LogType.USER, `${describeCurrentOperator()} 更新用户异常：${error instanceof Error ? error.message : id}`);
      return null;
    }
  },

  async deleteUser(id: string) {
    try {
      const targetId = String(id || '').trim();
      if (!targetId) {
        console.error('删除用户失败：用户 ID 为空');
        return false;
      }

      const attemptedIds = dedupeStringArray([targetId]);

      // 先查询一次，补齐 id/user_id 双键候选，避免只按单字段删除导致误判。
      const lookup = await supabase
        .from('users')
        .select('id,user_id')
        .or(`id.eq.${targetId},user_id.eq.${targetId}`)
        .limit(1);
      if (lookup.error) {
        console.warn('鍒犻櫎鍓嶆煡璇㈢敤鎴峰け璐ワ紝缁х画灏濊瘯鍒犻櫎:', lookup.error);
      } else if (lookup.data?.length) {
        const row = lookup.data[0] as any;
        attemptedIds.push(...dedupeStringArray([row?.id, row?.user_id]));
      }

      let deletedRows: any[] = [];
      let lastError: any = null;

      for (const candidate of dedupeStringArray(attemptedIds)) {
        const byUserId = await supabase.from('users').delete().eq('user_id', candidate).select('id,user_id');
        if (byUserId.error) {
          lastError = byUserId.error;
        } else if ((byUserId.data || []).length > 0) {
          deletedRows = byUserId.data || [];
          break;
        }

        const byId = await supabase.from('users').delete().eq('id', candidate).select('id,user_id');
        if (byId.error) {
          lastError = byId.error;
        } else if ((byId.data || []).length > 0) {
          deletedRows = byId.data || [];
          break;
        }
      }

      if (!deletedRows.length) {
        if (lastError) {
          console.error('鍒犻櫎鐢ㄦ埛澶辫触:', lastError);
        } else {
          console.warn('鍒犻櫎鐢ㄦ埛鏈敓鏁? 鏈尮閰嶅埌鍙垹闄よ褰曟垨鍙桼LS绛栫暐闄愬埗', { id: targetId });
        }
        await auditFailure(LogType.USER, `${describeCurrentOperator()} 删除用户失败：${targetId}`);
        return false;
      }

      const cacheIds = dedupeStringArray([
        targetId,
        ...deletedRows.map((row) => row?.id),
        ...deletedRows.map((row) => row?.user_id),
      ]);
      cacheIds.forEach((cacheId) => removeCachedRoleIdsForUser(cacheId));
      await auditSuccess(LogType.USER, `${describeCurrentOperator()} 删除用户：${targetId}`);
      return true;
    } catch (error) {
      console.error('鍒犻櫎鐢ㄦ埛杩囩▼涓彂鐢熷紓甯?', error);
      await auditFailure(LogType.USER, `${describeCurrentOperator()} 删除用户异常：${error instanceof Error ? error.message : id}`);
      return false;
    }
  },
};

export const surveyService = {
  async getSurveys() {
    const externalUser = isExternalLocalUser();
    const externalUserIds = externalUser
      ? dedupeStringArray([externalUser.id, ...(Array.isArray((externalUser as any).ids) ? (externalUser as any).ids : [])])
      : [];
    if (externalUserIds.length) {
      const orFilters = externalUserIds
        .flatMap((id) => [`creator_id.eq.${id}`, `submitter_id.eq.${id}`, `pre_sales_responsible_id.eq.${id}`])
        .join(',');
      const requests = [
        supabase.from('survey_forms').select('*').or(orFilters),
        ...externalUserIds.map((id) =>
          supabase.from('survey_forms').select('*').contains('data', { external_access_user_ids: [id] })
        ),
      ];
      const [directResult, ...sharedResults] = await Promise.all(requests);

      const allSharedErrored = sharedResults.length > 0 && sharedResults.every((result) => result.error);
      if (directResult.error && allSharedErrored) {
        console.error('鑾峰彇澶栭儴鐢ㄦ埛琛ㄥ崟鍒楄〃澶辫触:', directResult.error, ...sharedResults.map((r) => r.error));
        return [];
      }

      const merged = new Map<string, any>();
      const sharedData = sharedResults.flatMap((result) => result.data || []);
      [...(directResult.data || []), ...sharedData].forEach((survey: any) => {
        if (!survey?.id) return;
        if (!canExternalAccessSurvey(survey, externalUserIds)) return;
        merged.set(survey.id, survey);
      });
      return Array.from(merged.values()).map(normalizeSurveyRow);
    }

    const { data, error } = await supabase.from('survey_forms').select('*');
    if (error) {
      console.error('鑾峰彇琛ㄥ崟鍒楄〃澶辫触:', error);
      return [];
    }
    return (data || []).map(normalizeSurveyRow);
  },

  async getSurveyById(id: string) {
    const { data, error } = await supabase.from('survey_forms').select('*').eq('id', id).single();
    if (error) {
      console.error('鑾峰彇琛ㄥ崟璇︽儏澶辫触:', error);
      return null;
    }
    const externalUser = isExternalLocalUser();
    const externalUserIds = externalUser
      ? dedupeStringArray([externalUser.id, ...(Array.isArray((externalUser as any).ids) ? (externalUser as any).ids : [])])
      : [];
    if (externalUserIds.length && !canExternalAccessSurvey(data, externalUserIds)) {
      console.warn('澶栭儴鐢ㄦ埛鏃犳潈闄愯闂琛ㄥ崟:', { surveyId: id, userIds: externalUserIds });
      return null;
    }
    return normalizeSurveyRow(data);
  },

  async createAuthorizedLinkToken(id: string) {
    const { data, error } = await supabase.from('survey_forms').select('*').eq('id', id).single();
    if (error || !data) {
      console.error('鍒涘缓澶栭儴鎺堟潈閾炬帴澶辫触:', error);
      return null;
    }

    const rawData = data.data && typeof data.data === 'object' ? data.data : {};
    const existingTokens = Array.isArray(rawData.external_share_tokens) ? rawData.external_share_tokens : [];
    const { token: shareToken, record } = await createExternalShareTokenRecord();
    const { data: updated, error: updateError } = await supabase
      .from('survey_forms')
      .update({
        data: {
          ...rawData,
          external_link_enabled: true,
          external_share_tokens: [...existingTokens.filter((item: any) => !item?.revoked_at), record].slice(-10),
        },
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('淇濆瓨澶栭儴鎺堟潈閾炬帴 token 澶辫触:', updateError);
      await auditFailure(LogType.SURVEY, `${describeCurrentOperator()} 生成外部授权链接失败：${id}`);
      return null;
    }

    await auditSuccess(LogType.SURVEY, `${describeCurrentOperator()} 生成外部授权链接：${updated?.name || id}`);
    return { token: shareToken, survey: normalizeSurveyRow(updated) };
  },

  async grantExternalAccessByAuthorizedLink(id: string, token?: string | null) {
    const externalUser = isExternalLocalUser();
    const externalUserIds = externalUser
      ? dedupeStringArray([externalUser.id, ...(Array.isArray((externalUser as any).ids) ? (externalUser as any).ids : [])])
      : [];
    if (!externalUserIds.length) {
      return surveyService.getSurveyById(id);
    }

    const { data, error } = await supabase.from('survey_forms').select('*').eq('id', id).single();
    if (error || !data) {
      console.error('鎺堟潈閾炬帴鑾峰彇琛ㄥ崟澶辫触:', error);
      return null;
    }

    if (canExternalAccessSurvey(data, externalUserIds)) {
      return normalizeSurveyRow(data);
    }

    if (!isExternalLinkEnabled(data)) {
      console.warn('琛ㄥ崟鏈紑鍚閮ㄦ巿鏉冮摼鎺ヨ闂?', { surveyId: id, userIds: externalUserIds });
      return null;
    }

    if (!(await isExternalShareTokenValid(data, token))) {
      console.warn('外部授权链接 token 无效或已过期:', { surveyId: id, userIds: externalUserIds });
      return null;
    }

    const rawData = data.data && typeof data.data === 'object' ? data.data : {};
    const sharedIds = Array.isArray(rawData.external_access_user_ids) ? rawData.external_access_user_ids : [];
    const nextSharedIds = dedupeStringArray([...sharedIds, ...externalUserIds]);

    const { data: updated, error: updateError } = await supabase
      .from('survey_forms')
      .update({
        data: {
          ...rawData,
          external_link_enabled: true,
          external_access_user_ids: nextSharedIds,
        },
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('鎺堟潈閾炬帴缁戝畾澶栭儴鐢ㄦ埛澶辫触:', updateError);
      await auditFailure(LogType.SURVEY, `${describeCurrentOperator()} 绑定外部授权链接失败：${id}`);
      return null;
    }

    await auditSuccess(LogType.SURVEY, `${describeCurrentOperator()} 通过外部授权链接访问调研表单：${data?.name || id}`);
    return normalizeSurveyRow(updated);
  },

  async createSurvey(survey: Omit<SurveyForm, 'id' | 'create_time'>) {
    const dbSurvey: any = {
      ...survey,
      status: toDbSurveyStatus((survey as any).status),
      report_status: toDbReportStatus((survey as any).reportStatus || (survey as any).report_status),
    };
    delete dbSurvey.reportStatus;

    const [creatorId, submitterId, preSalesResponsibleId] = await Promise.all([
      resolveSurveyUserRefToId(dbSurvey.creator_id),
      resolveSurveyUserRefToId(dbSurvey.submitter_id),
      resolveSurveyUserRefToId(dbSurvey.pre_sales_responsible_id),
    ]);
    dbSurvey.creator_id = creatorId ?? null;
    dbSurvey.submitter_id = submitterId ?? null;
    dbSurvey.pre_sales_responsible_id = preSalesResponsibleId ?? null;

    const { data, error } = await supabase.from('survey_forms').insert(dbSurvey).select().single();
    if (error) {
      console.error('鍒涘缓琛ㄥ崟澶辫触:', error);
      await auditFailure(LogType.SURVEY, `${describeCurrentOperator()} 创建调研表单失败：${dbSurvey.name || dbSurvey.customer_name || '未命名'}`);
      return null;
    }
    await auditSuccess(LogType.SURVEY, `${describeCurrentOperator()} 创建调研表单：${data?.name || data?.customer_name || data?.id}`);
    return normalizeSurveyRow(data);
  },

  async updateSurvey(id: string, survey: any) {
    const externalUser = isExternalLocalUser();
    if (externalUser?.id) {
      const target = await surveyService.getSurveyById(id);
      if (!target) {
        console.warn('澶栭儴鐢ㄦ埛鏇存柊琛ㄥ崟琚嫤鎴?', { surveyId: id, userId: externalUser.id });
        await auditFailure(LogType.SURVEY, `${describeCurrentOperator()} 更新调研表单被拒绝：${id}`);
        return null;
      }
      survey = pickExternalSurveyUpdatePayload(survey);
    }

    const dbSurvey = {
      ...survey,
      status: toDbSurveyStatus(survey.status),
      report_status: survey.reportStatus || survey.report_status,
      customer_name: survey.customerName || survey.customer_name,
      project_name: survey.projectName || survey.project_name,
      pre_sales_responsible_id: survey.preSalesResponsibleId || survey.pre_sales_responsible_id,
    };
    dbSurvey.report_status = toDbReportStatus(dbSurvey.report_status);

    delete dbSurvey.reportStatus;
    delete dbSurvey.customerName;
    delete dbSurvey.projectName;
    delete dbSurvey.preSalesResponsibleId;

    const [creatorId, submitterId, preSalesResponsibleId] = await Promise.all([
      resolveSurveyUserRefToId(dbSurvey.creator_id),
      resolveSurveyUserRefToId(dbSurvey.submitter_id),
      resolveSurveyUserRefToId(dbSurvey.pre_sales_responsible_id),
    ]);
    if (typeof creatorId !== 'undefined') dbSurvey.creator_id = creatorId;
    if (typeof submitterId !== 'undefined') dbSurvey.submitter_id = submitterId;
    if (typeof preSalesResponsibleId !== 'undefined') dbSurvey.pre_sales_responsible_id = preSalesResponsibleId;

    const { data, error } = await supabase.from('survey_forms').update(dbSurvey).eq('id', id).select().single();
    if (error) {
      console.error('鏇存柊琛ㄥ崟澶辫触:', error);
      await auditFailure(LogType.SURVEY, `${describeCurrentOperator()} 更新调研表单失败：${id}`);
      return null;
    }
    await auditSuccess(LogType.SURVEY, `${describeCurrentOperator()} 更新调研表单：${data?.name || data?.customer_name || id}`);
    return normalizeSurveyRow(data);
  },

  async deleteSurvey(id: string) {
    const externalUser = isExternalLocalUser();
    if (externalUser?.id) {
      console.warn('外部用户无权删除调研表单:', { surveyId: id, userId: externalUser.id });
      await auditFailure(LogType.SURVEY, `${describeCurrentOperator()} 删除调研表单被拒绝：${id}`);
      return false;
    }

    const { error } = await supabase.from('survey_forms').delete().eq('id', id);
    if (error) {
      console.error('鍒犻櫎琛ㄥ崟澶辫触:', error);
      await auditFailure(LogType.SURVEY, `${describeCurrentOperator()} 删除调研表单失败：${id}`);
      return false;
    }
    await auditSuccess(LogType.SURVEY, `${describeCurrentOperator()} 删除调研表单：${id}`);
    return true;
  },
};

export const templateService = {
  async getTemplates() {
    const { data, error } = await supabase.from('survey_templates').select('*');
    if (error) {
      console.error('鑾峰彇妯℃澘鍒楄〃澶辫触:', error);
      return [];
    }
    return data;
  },

  async createTemplate(template: Omit<SurveyTemplate, 'id' | 'create_time'>) {
    const { data, error } = await supabase.from('survey_templates').insert(template).select().single();
    if (error) {
      console.error('鍒涘缓妯℃澘澶辫触:', error);
      await auditFailure(LogType.SYSTEM, `${describeCurrentOperator()} 创建调研模板失败：${template.name || '未命名模板'}`);
      return null;
    }
    await auditSuccess(LogType.SYSTEM, `${describeCurrentOperator()} 创建调研模板：${data?.name || data?.id}`);
    return data;
  },

  async upsertTemplateRowByName(params: { name: string; industry: string; sections: any }) {
    const name = String(params?.name || '').trim();
    if (!name) {
      throw new Error('妯℃澘鏁版嵁搴撹鍚嶇О涓嶈兘涓虹┖');
    }

    const { data: existingRows, error: findError } = await supabase
      .from('survey_templates')
      .select('*')
      .eq('name', name)
      .limit(1);
    if (findError) {
      console.error('鏌ヨ妯℃澘琛屽け璐?', findError);
      throw findError;
    }

    if (existingRows && existingRows.length > 0) {
      const { data, error } = await supabase
        .from('survey_templates')
        .update({
          industry: String(params.industry || '閫氱敤'),
          sections: params.sections,
          update_time: new Date().toISOString(),
        })
        .eq('id', existingRows[0].id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('鏇存柊妯℃澘琛屽け璐?', error);
        await auditFailure(LogType.SYSTEM, `${describeCurrentOperator()} 更新导入模板失败：${name}`);
        throw error;
      }
      await auditSuccess(LogType.SYSTEM, `${describeCurrentOperator()} 更新导入模板：${name}`);
      return data || null;
    }

    const { data, error } = await supabase
      .from('survey_templates')
      .insert({
        name,
        industry: String(params.industry || '閫氱敤'),
        sections: params.sections,
      })
      .select()
      .maybeSingle();
    if (error) {
      console.error('鏂板妯℃澘琛屽け璐?', error);
      await auditFailure(LogType.SYSTEM, `${describeCurrentOperator()} 新增导入模板失败：${name}`);
      throw error;
    }
    await auditSuccess(LogType.SYSTEM, `${describeCurrentOperator()} 新增导入模板：${name}`);
    return data || null;
  },

  async deleteTemplateRowByName(nameInput: string) {
    const name = String(nameInput || '').trim();
    if (!name) return false;

    const { error } = await supabase.from('survey_templates').delete().eq('name', name);
    if (error) {
      console.error('鍒犻櫎妯℃澘琛屽け璐?', error);
      await auditFailure(LogType.SYSTEM, `${describeCurrentOperator()} 删除导入模板失败：${name}`);
      return false;
    }
    await auditSuccess(LogType.SYSTEM, `${describeCurrentOperator()} 删除导入模板：${name}`);
    return true;
  },
};

export const dictService = {
  async getDictTypes() {
    const { data, error } = await supabase.from('dict_types').select('*');
    if (error) {
      console.error('鑾峰彇瀛楀吀绫诲瀷鍒楄〃澶辫触:', error);
      return [];
    }
    return data;
  },

  async getDictItems(typeId: string) {
    const { data, error } = await supabase.from('dict_items').select('*').eq('type_id', typeId);
    if (error) {
      console.error('鑾峰彇瀛楀吀椤瑰垪琛ㄥけ璐?', error);
      return [];
    }
    return data;
  },
};

export const logService = {
  async createLog(log: Pick<SystemLog, 'type' | 'content'> & Partial<SystemLog>) {
    return createAuditLog({
      type: log.type,
      content: log.content,
      result: log.result,
      operatorId: log.operator_id,
      ipAddress: log.ip_address || log.ip,
    });
  },

  async getLogs() {
    const { data, error } = await supabase.from('system_logs').select('*').order('create_time', { ascending: false });
    if (error) {
      console.error('鑾峰彇鏃ュ織鍒楄〃澶辫触:', error);
      return [];
    }
    const logs = data || [];
    const operatorIds = dedupeStringArray(logs.map((log: any) => log.operator_id)).filter(isUuid);
    if (!operatorIds.length) return logs;

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id,user_id,username,user_name,name')
      .or(`id.in.(${operatorIds.join(',')}),user_id.in.(${operatorIds.join(',')})`);
    if (usersError) {
      console.warn('补齐日志操作人失败:', usersError);
      return logs;
    }

    const userMap = new Map<string, string>();
    (users || []).forEach((user: any) => {
      const label = user.user_name || user.name || user.username || '未知用户';
      if (user.id) userMap.set(user.id, label);
      if (user.user_id) userMap.set(user.user_id, label);
    });

    return logs.map((log: any) => ({
      ...log,
      operator: userMap.get(log.operator_id) || (log.operator_id ? '未知用户' : '系统/未登录用户'),
    }));
  },
};

const mergeAndSortMessages = (messageGroups: any[][]) => {
  const merged = new Map<string, any>();
  messageGroups.forEach((group) => {
    (group || []).forEach((message: any) => {
      if (!message?.id) return;
      merged.set(message.id, message);
    });
  });

  return Array.from(merged.values()).sort((a: any, b: any) => {
    const aTime = new Date(a?.create_time || 0).getTime();
    const bTime = new Date(b?.create_time || 0).getTime();
    return bTime - aTime;
  });
};

const resolveCurrentUserRoleIds = async (roleIds: string[], roleName?: string) => {
  const existing = dedupeStringArray(roleIds);
  if (existing.length || !roleName) return existing;

  const { data, error } = await supabase.from('roles').select('id').eq('name', roleName).limit(1);
  if (error || !data?.length) {
    return existing;
  }

  return dedupeStringArray([...existing, data[0].id]);
};

const queryMessagesByTargetUser = async (userId: string, limit?: number) => {
  if (!userId) return [];
  let query: any = supabase
    .from('messages')
    .select('*')
    .eq('target_user_id', userId)
    .order('create_time', { ascending: false });

  if (typeof limit === 'number') {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error('鎸夌敤鎴锋煡璇㈡秷鎭け璐?', error);
    return [];
  }
  return data || [];
};

const queryMessagesByTargetRoles = async (roleIds: string[], limit?: number) => {
  if (!roleIds.length) return [];
  let query: any = supabase
    .from('messages')
    .select('*')
    .in('target_role_id', roleIds)
    .order('create_time', { ascending: false });

  if (typeof limit === 'number') {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error('鎸夎鑹叉煡璇㈡秷鎭け璐?', error);
    return [];
  }
  return data || [];
};

const queryBroadcastMessages = async (limit?: number) => {
  let query: any = supabase
    .from('messages')
    .select('*')
    .is('target_user_id', null)
    .is('target_role_id', null)
    .order('create_time', { ascending: false });

  if (typeof limit === 'number') {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error('鏌ヨ骞挎挱娑堟伅澶辫触:', error);
    return [];
  }
  return data || [];
};

const getMessageReadIdsForCurrentUser = async (messageIds: string[]) => {
  const currentUser = getLocalUserContext();
  const ids = dedupeStringArray(messageIds);
  if (!currentUser?.id || !ids.length) return new Set<string>();

  const { data, error } = await supabase
    .from('message_reads')
    .select('message_id')
    .eq('user_id', currentUser.id)
    .in('message_id', ids);

  if (error) {
    if (String(error?.code || '') !== '42P01') {
      console.error('查询用户消息已读状态失败:', error);
    }
    return new Set<string>();
  }

  return new Set((data || []).map((item: any) => item.message_id).filter(Boolean));
};

const applyCurrentUserReadState = async (messages: any[]) => {
  const readIds = await getMessageReadIdsForCurrentUser(messages.map((message: any) => message.id));
  if (!readIds.size) return messages;
  return messages.map((message: any) => ({
    ...message,
    read: Boolean(message.read) || readIds.has(message.id),
  }));
};

export const messageService = {
  async getMessages(userId: string, options?: { roleIds?: string[]; includeBroadcast?: boolean; limit?: number }) {
    const includeBroadcast = options?.includeBroadcast !== false;
    const roleIds = dedupeStringArray(options?.roleIds || []);

    const [userMessages, roleMessages, broadcastMessages] = await Promise.all([
      queryMessagesByTargetUser(userId, options?.limit),
      queryMessagesByTargetRoles(roleIds, options?.limit),
      includeBroadcast ? queryBroadcastMessages(options?.limit) : Promise.resolve([]),
    ]);

    const merged = mergeAndSortMessages([userMessages, roleMessages, broadcastMessages]);
    const withReadState = await applyCurrentUserReadState(merged);
    if (typeof options?.limit === 'number') {
      return withReadState.slice(0, options.limit);
    }
    return withReadState;
  },

  async getCurrentUserMessages(limit?: number) {
    const currentUser = getLocalUserContext();
    if (!currentUser?.id) return [];

    const roleIds = await resolveCurrentUserRoleIds(currentUser.role_ids || [], currentUser.role);
    return messageService.getMessages(currentUser.id, {
      roleIds,
      includeBroadcast: true,
      limit,
    });
  },

  async getCurrentUserUnreadCount() {
    const messages = await messageService.getCurrentUserMessages();
    return messages.filter((message: any) => !message.read).length;
  },

  async markAsRead(id: string) {
    const currentUser = getLocalUserContext();
    if (currentUser?.id) {
      const inserted = await supabase
        .from('message_reads')
        .upsert(
          {
            message_id: id,
            user_id: currentUser.id,
            read_at: new Date().toISOString(),
          },
          { onConflict: 'message_id,user_id' },
        )
        .select()
        .maybeSingle();
      if (!inserted.error) {
        await auditSuccess(LogType.SYSTEM, `${describeCurrentOperator()} 标记消息已读：${id}`);
        return inserted.data || { id, read: true };
      }
      if (String(inserted.error?.code || '') !== '42P01') {
        console.error('保存用户消息已读状态失败:', inserted.error);
      }
    }

    const { data, error } = await supabase.from('messages').update({ read: true }).eq('id', id).select().single();
    if (error) {
      console.error('鏍囪娑堟伅宸茶澶辫触:', error);
      await auditFailure(LogType.SYSTEM, `${describeCurrentOperator()} 标记消息已读失败：${id}`);
      return null;
    }
    await auditSuccess(LogType.SYSTEM, `${describeCurrentOperator()} 标记消息已读：${id}`);
    return data;
  },
};

export const surveyReportService = {
  async getSurveyReportByFormId(formId: string) {
    const targetId = String(formId || '').trim();
    if (!targetId) return null;

    const { data, error } = await supabase
      .from('survey_reports')
      .select('*')
      .eq('form_id', targetId)
      .order('generate_time', { ascending: false })
      .limit(1);

    if (error) {
      console.error('鑾峰彇鎶ュ憡璇︽儏澶辫触:', error);
      return null;
    }
    return data?.[0] || null;
  },

  async saveSurveyReportByFormId(formId: string, reportBundle: any) {
    const targetId = String(formId || '').trim();
    if (!targetId) return null;

    const payload = {
      form_id: targetId,
      content: JSON.stringify(reportBundle || {}),
      generate_time: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('survey_reports')
      .upsert(payload, { onConflict: 'form_id' })
      .select()
      .maybeSingle();

    if (!error) {
      await auditSuccess(LogType.SURVEY, `${describeCurrentOperator()} 保存调研报告：${targetId}`);
      return data || null;
    }

    const conflictConstraintMissing =
      String(error?.code || '') === '42P10'
      || String(error?.message || '').toLowerCase().includes('no unique')
      || String(error?.message || '').toLowerCase().includes('on conflict');

    if (!conflictConstraintMissing) {
      console.error('淇濆瓨鎶ュ憡澶辫触:', error);
      await auditFailure(LogType.SURVEY, `${describeCurrentOperator()} 保存调研报告失败：${targetId}`);
      return null;
    }

    const updated = await supabase
      .from('survey_reports')
      .update({
        content: payload.content,
        generate_time: payload.generate_time,
      })
      .eq('form_id', targetId)
      .select()
      .maybeSingle();
    if (!updated.error && updated.data) {
      await auditSuccess(LogType.SURVEY, `${describeCurrentOperator()} 更新调研报告：${targetId}`);
      return updated.data;
    }

    const inserted = await supabase.from('survey_reports').insert(payload).select().maybeSingle();
    if (inserted.error) {
      console.error('淇濆瓨鎶ュ憡澶辫触(鍏煎璺緞):', inserted.error);
      await auditFailure(LogType.SURVEY, `${describeCurrentOperator()} 保存调研报告失败：${targetId}`);
      return null;
    }
    await auditSuccess(LogType.SURVEY, `${describeCurrentOperator()} 新增调研报告：${targetId}`);
    return inserted.data || null;
  },
};

const SYSTEM_PRESET_ROLE_NAMES = ['超级管理员', '售前工程师', '客户用户', '外部客户'];

const isSystemPresetRoleName = (roleName: string | undefined | null) => {
  const name = String(roleName || '').trim();
  return name ? SYSTEM_PRESET_ROLE_NAMES.includes(name) : false;
};

export const roleService = {
  async getRoles() {
    try {
      const { data, error } = await supabase.from('roles').select('*');
      if (error) {
        console.error('鑾峰彇瑙掕壊鍒楄〃澶辫触:', error);
        throw new Error(formatSupabaseReadError('瑙掕壊鍒楄〃', error));
      }
      return (data || []).map(normalizeRole);
    } catch (error) {
      console.error('Unexpected error while fetching roles:', error);
      throw new Error(formatSupabaseReadError('瑙掕壊鍒楄〃', error));
    }
  },

  async createRole(role: any) {
    const { data, error } = await supabase.from('roles').insert(role).select().single();
    if (error) {
      console.error('鍒涘缓瑙掕壊澶辫触:', error);
      await auditFailure(LogType.USER, `${describeCurrentOperator()} 创建角色失败：${role?.name || '未命名角色'}`);
      return null;
    }
    await auditSuccess(LogType.USER, `${describeCurrentOperator()} 创建角色：${data?.name || data?.id}`);
    return data;
  },

  async updateRole(id: string, role: any) {
    const { data: roleInfo } = await supabase.from('roles').select('name').eq('id', id).maybeSingle();
    const payload = isSystemPresetRoleName(roleInfo?.name)
      ? { permissions: role?.permissions || {} }
      : role;

    const { data, error } = await supabase.from('roles').update(payload).eq('id', id).select().single();
    if (error) {
      console.error('鏇存柊瑙掕壊澶辫触:', error);
      await auditFailure(LogType.USER, `${describeCurrentOperator()} 更新角色失败：${roleInfo?.name || id}`);
      return null;
    }
    await auditSuccess(LogType.USER, `${describeCurrentOperator()} 更新角色：${data?.name || id}`);
    return data;
  },

  async deleteRole(id: string) {
    const { data: roleInfo } = await supabase.from('roles').select('name').eq('id', id).maybeSingle();
    if (isSystemPresetRoleName(roleInfo?.name)) {
      console.warn('棰勭疆瑙掕壊涓嶅彲鍒犻櫎:', roleInfo.name);
      await auditFailure(LogType.USER, `${describeCurrentOperator()} 删除预置角色被拒绝：${roleInfo.name}`);
      return false;
    }
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) {
      console.error('鍒犻櫎瑙掕壊澶辫触:', error);
      await auditFailure(LogType.USER, `${describeCurrentOperator()} 删除角色失败：${roleInfo?.name || id}`);
      return false;
    }
    await auditSuccess(LogType.USER, `${describeCurrentOperator()} 删除角色：${roleInfo?.name || id}`);
    return true;
  },
};

export default {
  userService,
  roleService,
  surveyService,
  surveyReportService,
  templateService,
  dictService,
  logService,
  messageService,
};
