import supabase from '../config/supabase';
import { SurveyForm, SurveyTemplate, SystemLog } from '../../types';

const isMissingColumn = (error: any, column: string) => {
  return error?.code === 'PGRST204' && String(error?.message || '').includes(`'${column}'`);
};

const normalizeUser = (user: any) => {
  const userType = user.user_type || user.type || 'external';
  return {
    id: user.user_id || user.id,
    user_id: user.user_id,
    user_name: user.user_realname || user.user_name || user.username,
    username: user.username,
    phone: user.phone,
    email: user.email,
    type: userType,
    user_type: userType,
    role_id: user.role_id,
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

  async validateUserRoles(_userId: string | null, _userType: string, _roleIds: string[]) {
    return true;
  },

  async createUser(user: any) {
    try {
      console.log('开始创建用户，用户数据:', user);

      const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
      if (rolesError) {
        console.error('获取角色列表失败:', rolesError);
      }

      let roleId = user.role_id;
      const userType = user.user_type || user.type || 'external';

      if (!roleId && roles && roles.length > 0) {
        if (userType === 'external') {
          const customerRole = roles.find((r: any) => r.name === '客户用户' || r.name === '外部客户');
          if (customerRole) roleId = customerRole.id;
        } else {
          const engineerRole = roles.find((r: any) => r.name === '售前工程师' || r.name === '超级管理员');
          if (engineerRole) roleId = engineerRole.id;
        }
        if (!roleId) roleId = roles[0].id;
      }

      if (!roleId) {
        throw new Error('无法确定用户角色，请先创建角色');
      }

      const baseUser: any = {
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
          console.log('创建用户成功:', data);
          return normalizeUser(data);
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
      if (user.role_id) {
        baseUser.role_id = user.role_id;
      }
      if (user.last_login_time) {
        baseUser.last_login_time = user.last_login_time;
      }

      const userType = user.user_type || user.type;
      const payloads: any[] = userType
        ? [{ ...baseUser, user_type: userType }, { ...baseUser, type: userType }]
        : [{ ...baseUser }];

      for (const dbUser of payloads) {
        console.log('处理后的数据库用户数据:', dbUser);

        const primary = await supabase.from('users').update(dbUser).eq('user_id', id).select().single();
        if (!primary.error) return normalizeUser(primary.data);

        const fallback = await supabase.from('users').update(dbUser).eq('id', id).select().single();
        if (!fallback.error) return normalizeUser(fallback.data);

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
      return true;
    } catch (error) {
      console.error('删除用户过程中发生异常:', error);
      return false;
    }
  },
};

export const surveyService = {
  async getSurveys() {
    const { data, error } = await supabase.from('survey_forms').select('*');
    if (error) {
      console.error('获取表单列表失败:', error);
      return [];
    }
    return data;
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
    return data;
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
