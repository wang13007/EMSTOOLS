import supabase from '../config/supabase';
import { ReportStatus, SurveyForm, SurveyStatus, SurveyTemplate, SystemLog } from '../../types';

const isMissingColumn = (error: any, column: string) => {
  return error?.code === 'PGRST204' && String(error?.message || '').includes(`'${column}'`);
};

const getMissingColumnName = (error: any): string | null => {
  if (error?.code !== 'PGRST204') return null;
  const message = String(error?.message || '');
  const match = message.match(/'([^']+)'/);
  return match?.[1] || null;
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
    return '用户数据格式错误（UUID字段无效），请刷新页面后重试';
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
  if (normalized === 'internal' || normalized.includes('internal') || raw.includes('内部')) {
    return 'internal';
  }
  if (normalized === 'external' || normalized.includes('external') || raw.includes('外部') || raw.includes('客户')) {
    return 'external';
  }
  return 'external';
};

const normalizeRoleType = (value: any): 'internal' | 'external' | null => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  if (normalized === 'internal' || normalized.includes('internal') || raw.includes('内部')) {
    return 'internal';
  }
  if (normalized === 'external' || normalized.includes('external') || raw.includes('外部') || raw.includes('客户')) {
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
  const externalKeywords = ['外部', '客户', 'customer', 'client', 'external'];
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
    console.warn('解析调研表单用户外键失败:', { candidate, error });
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

export const userService = {
  async getUsers() {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('Failed to fetch users:', error);
        return [];
      }
      return (data || []).map(normalizeUser);
    } catch (error) {
      console.error('Unexpected error while fetching users:', error);
      return [];
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
      console.warn('检测到非UUID角色ID，已拒绝校验:', selectedRoleIds.filter((roleId) => !isUuid(roleId)));
      return false;
    }

    const { data, error } = await supabase.from('roles').select('*').in('id', validRoleIds);
    if (error || !data) {
      console.error('校验用户角色失败:', error);
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
        console.error('获取角色列表失败:', rolesError);
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

      const baseUser: any = {
        user_name: user.username || user.user_name || user.name,
        name: user.name || user.user_name || user.username,
        username: user.username || user.user_name,
        password_hash: user.password_hash || user.password,
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
            return normalizeUser({ ...data, role_ids: roleIds });
          }

          lastError = error;
          const missingColumn = getMissingColumnName(error);

          if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
            const nextPayload = { ...payload };
            delete nextPayload[missingColumn];
            payload = nextPayload;
            console.warn(`users表缺少字段 ${missingColumn}，已自动剔除后重试`);
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
      throw new Error(readableMessage);
    } catch (error) {
      console.error('创建用户过程中发生异常:', error);
      throw error instanceof Error ? error : new Error('创建用户失败，请稍后重试');
    }
  },

  async updateUser(id: string, user: any) {
    try {
      const baseUser: any = { status: user.status || 'enabled' };
      const roleIds = dedupeStringArray([...(user.role_ids || []), user.role_id]);

      if (user.username || user.user_name) {
        baseUser.user_name = user.user_name || user.username;
      }
      if (user.name || user.user_name) {
        baseUser.name = user.name || user.user_name || user.username;
      }
      if (user.password || user.password_hash) {
        baseUser.password_hash = user.password || user.password_hash;
      }
      if (user.phone) {
        baseUser.phone = user.phone;
      }
      if (user.email) {
        baseUser.email = user.email;
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
        const roleValidationPassed = await userService.validateUserRoles(id, userType, roleIds);
        if (!roleValidationPassed) {
          throw new Error(userType === 'internal' ? '内部用户只能选择内部角色' : '外部用户只能选择外部角色');
        }
      }
      const payloads: any[] = userType
        ? [{ ...baseUser, user_type: userType }, { ...baseUser, type: userType }]
        : [{ ...baseUser }];

      for (const dbUser of payloads) {
        let payload = { ...dbUser };

        while (true) {
          const primary = await supabase.from('users').update(payload).eq('user_id', id).select().maybeSingle();
          if (!primary.error && primary.data) {
            const updatedUserId = primary.data?.user_id || primary.data?.id;
            if (roleIds.length) cacheRoleIdsForUser(updatedUserId, roleIds);
            return normalizeUser({ ...primary.data, role_ids: roleIds.length ? roleIds : undefined });
          }

          const fallback = await supabase.from('users').update(payload).eq('id', id).select().maybeSingle();
          if (!fallback.error && fallback.data) {
            const updatedUserId = fallback.data?.user_id || fallback.data?.id;
            if (roleIds.length) cacheRoleIdsForUser(updatedUserId, roleIds);
            return normalizeUser({ ...fallback.data, role_ids: roleIds.length ? roleIds : undefined });
          }

          const missingColumn = getMissingColumnName(primary.error) || getMissingColumnName(fallback.error);
          if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
            const nextPayload = { ...payload };
            delete nextPayload[missingColumn];
            payload = nextPayload;
            console.warn(`users表缺少字段 ${missingColumn}，已自动剔除后重试`);
            continue;
          }

          if (
            isMissingColumn(primary.error, 'type') ||
            isMissingColumn(primary.error, 'user_type') ||
            isMissingColumn(fallback.error, 'type') ||
            isMissingColumn(fallback.error, 'user_type')
          ) {
            console.warn('更新用户类型字段不匹配，自动尝试兼容字段');
            break;
          }

          console.error('更新用户失败:', fallback.error || primary.error);
          return null;
        }

        if (!Object.prototype.hasOwnProperty.call(payload, 'type') && !Object.prototype.hasOwnProperty.call(payload, 'user_type')) {
          continue;
        }
      }

      console.error('更新用户失败: 无法匹配 users 表的类型字段(type/user_type)');
      return null;
    } catch (error) {
      console.error('更新用户过程中发生异常:', error);
      return null;
    }
  },

  async deleteUser(id: string) {
    try {
      const targetId = String(id || '').trim();
      if (!targetId) {
        console.error('删除用户失败: 用户ID为空');
        return false;
      }

      const attemptedIds = dedupeStringArray([targetId]);

      // 先查一遍，补齐 id/user_id 双键候选，避免只按单字段删除导致“0行删除”误判成功
      const lookup = await supabase
        .from('users')
        .select('id,user_id')
        .or(`id.eq.${targetId},user_id.eq.${targetId}`)
        .limit(1);
      if (lookup.error) {
        console.warn('删除前查询用户失败，继续尝试删除:', lookup.error);
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
          console.error('删除用户失败:', lastError);
        } else {
          console.warn('删除用户未生效: 未匹配到可删除记录或受RLS策略限制', { id: targetId });
        }
        return false;
      }

      const cacheIds = dedupeStringArray([
        targetId,
        ...deletedRows.map((row) => row?.id),
        ...deletedRows.map((row) => row?.user_id),
      ]);
      cacheIds.forEach((cacheId) => removeCachedRoleIdsForUser(cacheId));
      return true;
    } catch (error) {
      console.error('删除用户过程中发生异常:', error);
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
        console.error('获取外部用户表单列表失败:', directResult.error, ...sharedResults.map((r) => r.error));
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
      console.error('获取表单列表失败:', error);
      return [];
    }
    return (data || []).map(normalizeSurveyRow);
  },

  async getSurveyById(id: string) {
    const { data, error } = await supabase.from('survey_forms').select('*').eq('id', id).single();
    if (error) {
      console.error('获取表单详情失败:', error);
      return null;
    }
    const externalUser = isExternalLocalUser();
    const externalUserIds = externalUser
      ? dedupeStringArray([externalUser.id, ...(Array.isArray((externalUser as any).ids) ? (externalUser as any).ids : [])])
      : [];
    if (externalUserIds.length && !canExternalAccessSurvey(data, externalUserIds)) {
      console.warn('外部用户无权限访问该表单:', { surveyId: id, userIds: externalUserIds });
      return null;
    }
    return normalizeSurveyRow(data);
  },

  async grantExternalAccessByAuthorizedLink(id: string) {
    const externalUser = isExternalLocalUser();
    const externalUserIds = externalUser
      ? dedupeStringArray([externalUser.id, ...(Array.isArray((externalUser as any).ids) ? (externalUser as any).ids : [])])
      : [];
    if (!externalUserIds.length) {
      return surveyService.getSurveyById(id);
    }

    const { data, error } = await supabase.from('survey_forms').select('*').eq('id', id).single();
    if (error || !data) {
      console.error('授权链接获取表单失败:', error);
      return null;
    }

    if (canExternalAccessSurvey(data, externalUserIds)) {
      return normalizeSurveyRow(data);
    }

    if (!isExternalLinkEnabled(data)) {
      console.warn('表单未开启外部授权链接访问:', { surveyId: id, userIds: externalUserIds });
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
      console.error('授权链接绑定外部用户失败:', updateError);
      return null;
    }

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
      console.error('创建表单失败:', error);
      return null;
    }
    return normalizeSurveyRow(data);
  },

  async updateSurvey(id: string, survey: any) {
    const externalUser = isExternalLocalUser();
    if (externalUser?.id) {
      const target = await surveyService.getSurveyById(id);
      if (!target) {
        console.warn('外部用户更新表单被拦截:', { surveyId: id, userId: externalUser.id });
        return null;
      }
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
      console.error('更新表单失败:', error);
      return null;
    }
    return normalizeSurveyRow(data);
  },

  async deleteSurvey(id: string) {
    const externalUser = isExternalLocalUser();
    if (externalUser?.id) {
      const target = await surveyService.getSurveyById(id);
      if (!target) {
        console.warn('外部用户删除表单被拦截:', { surveyId: id, userId: externalUser.id });
        return false;
      }
    }

    const { error } = await supabase.from('survey_forms').delete().eq('id', id);
    if (error) {
      console.error('删除表单失败:', error);
      return false;
    }
    return true;
  },
};

export const templateService = {
  async getTemplates() {
    const { data, error } = await supabase.from('survey_templates').select('*');
    if (error) {
      console.error('获取模板列表失败:', error);
      return [];
    }
    return data;
  },

  async createTemplate(template: Omit<SurveyTemplate, 'id' | 'create_time'>) {
    const { data, error } = await supabase.from('survey_templates').insert(template).select().single();
    if (error) {
      console.error('创建模板失败:', error);
      return null;
    }
    return data;
  },
};

export const dictService = {
  async getDictTypes() {
    const { data, error } = await supabase.from('dict_types').select('*');
    if (error) {
      console.error('获取字典类型列表失败:', error);
      return [];
    }
    return data;
  },

  async getDictItems(typeId: string) {
    const { data, error } = await supabase.from('dict_items').select('*').eq('type_id', typeId);
    if (error) {
      console.error('获取字典项列表失败:', error);
      return [];
    }
    return data;
  },
};

export const logService = {
  async createLog(log: Omit<SystemLog, 'id' | 'create_time'>) {
    const { data, error } = await supabase.from('system_logs').insert(log).select().single();
    if (error) {
      console.error('创建日志失败:', error);
      return null;
    }
    return data;
  },

  async getLogs() {
    const { data, error } = await supabase.from('system_logs').select('*').order('create_time', { ascending: false });
    if (error) {
      console.error('获取日志列表失败:', error);
      return [];
    }
    return data;
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
    console.error('按用户查询消息失败:', error);
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
    console.error('按角色查询消息失败:', error);
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
    console.error('查询广播消息失败:', error);
    return [];
  }
  return data || [];
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
    if (typeof options?.limit === 'number') {
      return merged.slice(0, options.limit);
    }
    return merged;
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
    const { data, error } = await supabase.from('messages').update({ read: true }).eq('id', id).select().single();
    if (error) {
      console.error('标记消息已读失败:', error);
      return null;
    }
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
      console.error('获取报告详情失败:', error);
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
      return data || null;
    }

    const conflictConstraintMissing =
      String(error?.code || '') === '42P10'
      || String(error?.message || '').toLowerCase().includes('no unique')
      || String(error?.message || '').toLowerCase().includes('on conflict');

    if (!conflictConstraintMissing) {
      console.error('保存报告失败:', error);
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
      return updated.data;
    }

    const inserted = await supabase.from('survey_reports').insert(payload).select().maybeSingle();
    if (inserted.error) {
      console.error('保存报告失败(兼容路径):', inserted.error);
      return null;
    }
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
    const { data, error } = await supabase.from('roles').select('*');
    if (error) {
      console.error('获取角色列表失败:', error);
      return [];
    }
    return (data || []).map(normalizeRole);
  },

  async createRole(role: any) {
    const { data, error } = await supabase.from('roles').insert(role).select().single();
    if (error) {
      console.error('创建角色失败:', error);
      return null;
    }
    return data;
  },

  async updateRole(id: string, role: any) {
    const { data: roleInfo } = await supabase.from('roles').select('name').eq('id', id).maybeSingle();
    const payload = isSystemPresetRoleName(roleInfo?.name)
      ? { permissions: role?.permissions || {} }
      : role;

    const { data, error } = await supabase.from('roles').update(payload).eq('id', id).select().single();
    if (error) {
      console.error('更新角色失败:', error);
      return null;
    }
    return data;
  },

  async deleteRole(id: string) {
    const { data: roleInfo } = await supabase.from('roles').select('name').eq('id', id).maybeSingle();
    if (isSystemPresetRoleName(roleInfo?.name)) {
      console.warn('预置角色不可删除:', roleInfo.name);
      return false;
    }
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) {
      console.error('删除角色失败:', error);
      return false;
    }
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
