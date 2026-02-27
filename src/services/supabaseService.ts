﻿import supabase from '../config/supabase';
import { SurveyForm, SurveyTemplate, SystemLog } from '../../types';

const isMissingColumn = (error: any, column: string) => {
  return error?.code === 'PGRST204' && String(error?.message || '').includes(`'${column}'`);
};

const MULTI_ROLE_CACHE_KEY = 'ems_user_role_ids_map';

const dedupeStringArray = (values: Array<string | undefined | null>) => {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
};

const normalizeUserType = (value: any): 'internal' | 'external' => {
  return value === 'internal' ? 'internal' : 'external';
};

const inferRoleType = (role: any): 'internal' | 'external' => {
  const directType = role?.type || role?.user_type;
  if (directType === 'internal' || directType === 'external') {
    return directType;
  }

  const source = `${role?.name || ''} ${role?.description || ''}`.toLowerCase();
  const externalKeywords = ['外部', '客户', 'customer', 'client', 'external'];
  return externalKeywords.some((keyword) => source.includes(keyword)) ? 'external' : 'internal';
};

const canUseLocalStorage = () => {
  return typeof window !== 'undefined' && !!window.localStorage;
};

const getLocalUserContext = () => {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem('ems_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return {
      id: user?.id || user?.user_id || '',
      type: user?.type || user?.user_type || '',
    };
  } catch {
    return null;
  }
};

const isExternalLocalUser = () => {
  const user = getLocalUserContext();
  return user?.type === 'external' ? user : null;
};

const canExternalAccessSurvey = (survey: any, userId: string) => {
  if (!survey || !userId) return false;
  if (survey.creator_id === userId || survey.submitter_id === userId || survey.pre_sales_responsible_id === userId) {
    return true;
  }
  const data = survey.data && typeof survey.data === 'object' ? survey.data : {};
  const sharedIds = Array.isArray(data.external_access_user_ids) ? data.external_access_user_ids : [];
  return sharedIds.includes(userId);
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
  const userId = user.user_id || user.id;
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
  return {
    id: user.user_id || user.id,
    user_id: user.user_id,
    user_name: user.user_realname || user.user_name || user.username,
    name: user.user_realname || user.user_name || user.username,
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
      console.log('开始获取用户列表');
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('获取用户列表失败:', error);
        return [];
      }
      console.log('获取用户列表成功，用户数量:', data?.length || 0);
      return (data || []).map(normalizeUser);
    } catch (error) {
      console.error('获取用户列表过程中发生异常:', error);
      return [];
    }
  },

  async getRoles() {
    return roleService.getRoles();
  },

  async validateUserRoles(_userId: string | null, userType: string, roleIds: string[]) {
    const selectedRoleIds = dedupeStringArray(roleIds);
    if (!selectedRoleIds.length) return false;

    const { data, error } = await supabase.from('roles').select('*').in('id', selectedRoleIds);
    if (error || !data) {
      console.error('校验用户角色失败:', error);
      return false;
    }

    if (data.length !== selectedRoleIds.length) {
      return false;
    }

    const expectedType = normalizeUserType(userType);
    return data.every((role: any) => inferRoleType(role) === expectedType);
  },

  async createUser(user: any) {
    try {
      console.log('开始创建用户，用户数据:', user);

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
        throw new Error('无法确定用户角色，请先创建角色');
      }

      const roleValidationPassed = await userService.validateUserRoles(null, userType, roleIds);
      if (!roleValidationPassed) {
        throw new Error(userType === 'internal' ? '内部用户只能选择内部角色' : '外部用户只能选择外部角色');
      }

      const baseUser: any = {
        user_id: user.user_id,
        username: user.username || user.user_name,
        user_realname: user.user_name || user.name || user.username,
        password_hash: user.password_hash || user.password,
        role_id: roleId,
        status: user.status || 'enabled',
        create_time: new Date().toISOString(),
        creator: user.creator || 'system',
        is_deleted: false,
      };

      if (user.phone) baseUser.phone = user.phone;
      if (user.email) baseUser.email = user.email;

      const payloads = [
        { ...baseUser, user_type: userType },
        { ...baseUser, type: userType },
      ];

      let lastError: any = null;

      for (const dbUser of payloads) {
        console.log('处理后的数据库用户数据:', dbUser);

        const { data, error } = await supabase.from('users').insert(dbUser).select().single();

        if (!error) {
          const createdUserId = data.user_id || data.id;
          cacheRoleIdsForUser(createdUserId, roleIds);
          console.log('创建用户成功:', data);
          return normalizeUser({ ...data, role_ids: roleIds });
        }

        lastError = error;

        if (isMissingColumn(error, 'type') || isMissingColumn(error, 'user_type')) {
          console.warn('用户类型字段不匹配，自动尝试兼容字段:', error.message);
          continue;
        }

        console.error('创建用户失败:', error);
        return null;
      }

      console.error('创建用户失败:', lastError);
      return null;
    } catch (error) {
      console.error('创建用户过程中发生异常:', error);
      return null;
    }
  },

  async updateUser(id: string, user: any) {
    try {
      const baseUser: any = { status: user.status || 'enabled' };
      const roleIds = dedupeStringArray([...(user.role_ids || []), user.role_id]);

      if (user.username || user.user_name) {
        baseUser.username = user.username || user.user_name;
      }
      if (user.name || user.user_realname || user.user_name) {
        baseUser.user_realname = user.name || user.user_realname || user.user_name;
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
        console.log('处理后的数据库用户数据:', dbUser);

        const primary = await supabase.from('users').update(dbUser).eq('user_id', id).select().single();
        if (!primary.error) {
          const updatedUserId = primary.data?.user_id || primary.data?.id;
          if (roleIds.length) cacheRoleIdsForUser(updatedUserId, roleIds);
          return normalizeUser({ ...primary.data, role_ids: roleIds.length ? roleIds : undefined });
        }

        const fallback = await supabase.from('users').update(dbUser).eq('id', id).select().single();
        if (!fallback.error) {
          const updatedUserId = fallback.data?.user_id || fallback.data?.id;
          if (roleIds.length) cacheRoleIdsForUser(updatedUserId, roleIds);
          return normalizeUser({ ...fallback.data, role_ids: roleIds.length ? roleIds : undefined });
        }

        if (
          isMissingColumn(primary.error, 'type') ||
          isMissingColumn(primary.error, 'user_type') ||
          isMissingColumn(fallback.error, 'type') ||
          isMissingColumn(fallback.error, 'user_type')
        ) {
          console.warn('更新用户类型字段不匹配，自动尝试兼容字段');
          continue;
        }

        console.error('更新用户失败:', fallback.error || primary.error);
        return null;
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
      const { error } = await supabase.from('users').delete().eq('user_id', id);
      if (error) {
        const { error: fallbackError } = await supabase.from('users').delete().eq('id', id);
        if (fallbackError) {
          console.error('删除用户失败:', fallbackError);
          return false;
        }
      }
      removeCachedRoleIdsForUser(id);
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
    if (externalUser?.id) {
      const [directResult, sharedResult] = await Promise.all([
        supabase
          .from('survey_forms')
          .select('*')
          .or(
            `creator_id.eq.${externalUser.id},submitter_id.eq.${externalUser.id},pre_sales_responsible_id.eq.${externalUser.id}`
          ),
        supabase.from('survey_forms').select('*').contains('data', { external_access_user_ids: [externalUser.id] }),
      ]);

      if (directResult.error && sharedResult.error) {
        console.error('获取外部用户表单列表失败:', directResult.error, sharedResult.error);
        return [];
      }

      const merged = new Map<string, any>();
      [...(directResult.data || []), ...(sharedResult.data || [])].forEach((survey: any) => {
        if (!survey?.id) return;
        if (!canExternalAccessSurvey(survey, externalUser.id)) return;
        merged.set(survey.id, survey);
      });
      return Array.from(merged.values());
    }

    const { data, error } = await supabase.from('survey_forms').select('*');
    if (error) {
      console.error('获取表单列表失败:', error);
      return [];
    }
    return data;
  },

  async getSurveyById(id: string) {
    const { data, error } = await supabase.from('survey_forms').select('*').eq('id', id).single();
    if (error) {
      console.error('获取表单详情失败:', error);
      return null;
    }
    const externalUser = isExternalLocalUser();
    if (externalUser?.id && !canExternalAccessSurvey(data, externalUser.id)) {
      console.warn('外部用户无权限访问该表单:', { surveyId: id, userId: externalUser.id });
      return null;
    }
    return data;
  },

  async grantExternalAccessByAuthorizedLink(id: string) {
    const externalUser = isExternalLocalUser();
    if (!externalUser?.id) {
      return surveyService.getSurveyById(id);
    }

    const { data, error } = await supabase.from('survey_forms').select('*').eq('id', id).single();
    if (error || !data) {
      console.error('授权链接获取表单失败:', error);
      return null;
    }

    if (canExternalAccessSurvey(data, externalUser.id)) {
      return data;
    }

    if (!isExternalLinkEnabled(data)) {
      console.warn('表单未开启外部授权链接访问:', { surveyId: id, userId: externalUser.id });
      return null;
    }

    const rawData = data.data && typeof data.data === 'object' ? data.data : {};
    const sharedIds = Array.isArray(rawData.external_access_user_ids) ? rawData.external_access_user_ids : [];
    const nextSharedIds = dedupeStringArray([...sharedIds, externalUser.id]);

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

    return updated;
  },

  async createSurvey(survey: Omit<SurveyForm, 'id' | 'create_time'>) {
    const { data, error } = await supabase.from('survey_forms').insert(survey).select().single();
    if (error) {
      console.error('创建表单失败:', error);
      return null;
    }
    return data;
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
      report_status: survey.reportStatus || survey.report_status,
      customer_name: survey.customerName || survey.customer_name,
      project_name: survey.projectName || survey.project_name,
      pre_sales_responsible_id: survey.preSalesResponsibleId || survey.pre_sales_responsible_id,
    };

    delete dbSurvey.reportStatus;
    delete dbSurvey.customerName;
    delete dbSurvey.projectName;
    delete dbSurvey.preSalesResponsibleId;

    const { data, error } = await supabase.from('survey_forms').update(dbSurvey).eq('id', id).select().single();
    if (error) {
      console.error('更新表单失败:', error);
      return null;
    }
    return data;
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

export const messageService = {
  async getMessages(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('target_user_id', userId)
      .order('create_time', { ascending: false });

    if (error) {
      console.error('获取消息列表失败:', error);
      return [];
    }
    return data;
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
    const { data, error } = await supabase.from('roles').update(role).eq('id', id).select().single();
    if (error) {
      console.error('更新角色失败:', error);
      return null;
    }
    return data;
  },

  async deleteRole(id: string) {
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
  templateService,
  dictService,
  logService,
  messageService,
};
