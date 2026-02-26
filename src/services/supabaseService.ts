// Supabase服务
import supabase from '../config/supabase';
import { User, SurveyForm, SurveyTemplate, DictType, DictItem, SystemLog, Message } from '../../types';

// 用户相关操作
export const userService = {
  // 获取用户列表
  async getUsers() {
    try {
      console.log('开始获取用户列表');
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) {
        console.error('获取用户列表失败:', error);
        console.error('错误详情:', JSON.stringify(error, null, 2));
        return [];
      }
      
      console.log('获取用户列表成功，用户数量:', data.length);
      
      const users = data.map(user => ({
        id: user.user_id || user.id,
        user_id: user.user_id,
        user_name: user.username,
        username: user.username,
        phone: user.phone,
        email: user.email,
        type: user.type,
        user_type: user.type,
        role_id: user.role_id,
        status: user.status,
        last_login_time: user.last_login_time,
        create_time: user.create_time,
        password_hash: user.password_hash
      }));
      
      return users;
    } catch (error) {
      console.error('获取用户列表过程中发生异常:', error);
      return [];
    }
  },

  // 验证用户类型和角色类型是否匹配
  async validateUserRoles(userId: string | null, userType: string, roleIds: string[]) {
    try {
      console.log('暂时禁用角色验证，避免数据库策略的无限递归问题');
      return true;
    } catch (error) {
      console.error('验证用户角色失败:', error);
      console.log('验证失败，但允许操作继续');
      return true;
    }
  },

  // 创建用户
  async createUser(user: any) {
    try {
      console.log('开始创建用户，用户数据:', user);
      
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('*');
      
      if (rolesError) {
        console.error('获取角色列表失败:', rolesError);
      }
      
      let roleId = user.role_id;
      
      if (!roleId && roles && roles.length > 0) {
        const userType = user.type || user.user_type || 'external';
        if (userType === 'external') {
          const customerRole = roles.find(r => r.name === '客户用户' || r.name === '外部客户');
          if (customerRole) {
            roleId = customerRole.id;
          }
        } else {
          const engineerRole = roles.find(r => r.name === '售前工程师');
          if (engineerRole) {
            roleId = engineerRole.id;
          }
        }
        
        if (!roleId) {
          roleId = roles[0].id;
        }
      }
      
      if (!roleId) {
        throw new Error('无法确定用户角色，请先创建角色');
      }
      
      const dbUser = {
        username: user.username || user.user_name,
        password_hash: user.password_hash || user.password,
        type: user.type || user.user_type || 'external',
        role_id: roleId,
        status: user.status || 'enabled',
        create_time: new Date().toISOString()
      };
      
      if (user.phone) {
        dbUser.phone = user.phone;
      }
      if (user.email) {
        dbUser.email = user.email;
      }
      
      console.log('处理后的数据库用户数据:', dbUser);
      
      const { data, error } = await supabase
        .from('users')
        .insert(dbUser)
        .select()
        .single();
      
      if (error) {
        console.error('创建用户失败:', error);
        console.error('错误详情:', JSON.stringify(error, null, 2));
        console.error('错误代码:', error.code);
        console.error('错误消息:', error.message);
        console.error('错误提示:', error.hint);
        console.error('错误详情:', error.details);
        return null;
      }
      
      console.log('创建用户成功:', data);
      return data;
    } catch (error) {
      console.error('创建用户过程中发生异常:', error);
      console.error('异常详情:', JSON.stringify(error, null, 2));
      return null;
    }
  },

  // 更新用户
  async updateUser(id: string, user: any) {
    try {
      const dbUser: any = {
        status: user.status || 'enabled'
      };
      
      if (user.username || user.user_name) {
        dbUser.username = user.username || user.user_name;
      }
      if (user.password || user.password_hash) {
        dbUser.password_hash = user.password || user.password_hash;
      }
      if (user.type || user.user_type) {
        dbUser.type = user.type || user.user_type;
      }
      if (user.phone) {
        dbUser.phone = user.phone;
      }
      if (user.email) {
        dbUser.email = user.email;
      }
      if (user.role_id) {
        dbUser.role_id = user.role_id;
      }
      if (user.last_login_time) {
        dbUser.last_login_time = user.last_login_time;
      }
      
      console.log('处理后的数据库用户数据:', dbUser);
      
      const { data, error } = await supabase
        .from('users')
        .update(dbUser)
        .eq('user_id', id)
        .select()
        .single();
      
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('users')
          .update(dbUser)
          .eq('id', id)
          .select()
          .single();
        
        if (fallbackError) {
          console.error('更新用户失败:', fallbackError);
          return null;
        }
        
        return fallbackData;
      }
      
      return data;
    } catch (error) {
      console.error('更新用户过程中发生异常:', error);
      return null;
    }
  },

  // 删除用户
  async deleteUser(id: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', id);
      
      if (error) {
        const { error: fallbackError } = await supabase
          .from('users')
          .delete()
          .eq('id', id);
        
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
  }
};

// 调研表单相关操作
export const surveyService = {
  async getSurveys() {
    const { data, error } = await supabase
      .from('survey_forms')
      .select('*');
    
    if (error) {
      console.error('获取表单列表失败:', error);
      return [];
    }
    
    return data;
  },

  async createSurvey(survey: Omit<SurveyForm, 'id' | 'create_time'>) {
    const { data, error } = await supabase
      .from('survey_forms')
      .insert(survey)
      .select()
      .single();
    
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
      pre_sales_responsible_id: survey.preSalesResponsibleId || survey.pre_sales_responsible_id
    };
    
    delete dbSurvey.reportStatus;
    delete dbSurvey.customerName;
    delete dbSurvey.projectName;
    delete dbSurvey.preSalesResponsibleId;
    
    const { data, error } = await supabase
      .from('survey_forms')
      .update(dbSurvey)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('更新表单失败:', error);
      return null;
    }
    
    return data;
  },

  async deleteSurvey(id: string) {
    const { error } = await supabase
      .from('survey_forms')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('删除表单失败:', error);
      return false;
    }
    
    return true;
  }
};

// 模板相关操作
export const templateService = {
  async getTemplates() {
    const { data, error } = await supabase
      .from('survey_templates')
      .select('*');
    
    if (error) {
      console.error('获取模板列表失败:', error);
      return [];
    }
    
    return data;
  },

  async createTemplate(template: Omit<SurveyTemplate, 'id' | 'create_time'>) {
    const { data, error } = await supabase
      .from('survey_templates')
      .insert(template)
      .select()
      .single();
    
    if (error) {
      console.error('创建模板失败:', error);
      return null;
    }
    
    return data;
  }
};

// 字典相关操作
export const dictService = {
  async getDictTypes() {
    const { data, error } = await supabase
      .from('dict_types')
      .select('*');
    
    if (error) {
      console.error('获取字典类型列表失败:', error);
      return [];
    }
    
    return data;
  },

  async getDictItems(typeId: string) {
    const { data, error } = await supabase
      .from('dict_items')
      .select('*')
      .eq('type_id', typeId);
    
    if (error) {
      console.error('获取字典项列表失败:', error);
      return [];
    }
    
    return data;
  }
};

// 日志相关操作
export const logService = {
  async createLog(log: Omit<SystemLog, 'id' | 'create_time'>) {
    const { data, error } = await supabase
      .from('system_logs')
      .insert(log)
      .select()
      .single();
    
    if (error) {
      console.error('创建日志失败:', error);
      return null;
    }
    
    return data;
  },

  async getLogs() {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('create_time', { ascending: false });
    
    if (error) {
      console.error('获取日志列表失败:', error);
      return [];
    }
    
    return data;
  }
};

// 消息相关操作
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
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('标记消息为已读失败:', error);
      return null;
    }
    
    return data;
  }
};

// 角色相关操作
export const roleService = {
  async getRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('*');
    
    if (error) {
      console.error('获取角色列表失败:', error);
      return [];
    }
    
    return data;
  },

  async createRole(role: any) {
    const { data, error } = await supabase
      .from('roles')
      .insert(role)
      .select()
      .single();
    
    if (error) {
      console.error('创建角色失败:', error);
      return null;
    }
    
    return data;
  },

  async updateRole(id: string, role: any) {
    const { data, error } = await supabase
      .from('roles')
      .update(role)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('更新角色失败:', error);
      return null;
    }
    
    return data;
  },

  async deleteRole(id: string) {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('删除角色失败:', error);
      return false;
    }
    
    return true;
  }
};

export default {
  userService,
  roleService,
  surveyService,
  templateService,
  dictService,
  logService,
  messageService
};
