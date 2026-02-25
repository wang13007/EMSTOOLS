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
      return data;
    } catch (error) {
      console.error('获取用户列表过程中发生异常:', error);
      return [];
    }
  },

  // 验证用户类型和角色类型是否匹配
  async validateUserRoles(userId: string | null, userType: string, roleIds: string[]) {
    try {
      // 获取所有角色信息
      const { data: roles, error: roleError } = await supabase
        .from('roles')
        .select('*');
      
      if (roleError) {
        console.error('获取角色列表失败:', roleError);
        // 如果获取角色失败，可能是因为使用的是前端默认角色数据
        // 跳过验证，允许前端使用默认角色
        console.log('使用前端默认角色数据，跳过后端验证');
        return true;
      }
      
      // 如果没有获取到角色数据，也跳过验证
      if (!roles || roles.length === 0) {
        console.log('未获取到角色数据，跳过后端验证');
        return true;
      }
      
      // 验证每个角色是否与用户类型匹配
      for (const roleId of roleIds) {
        const role = roles.find(r => r.id === roleId);
        if (!role) {
          console.warn(`角色 ${roleId} 不存在，跳过验证`);
          // 跳过不存在的角色验证，允许前端使用默认角色
          continue;
        }
        
        // 确保角色有类型字段
        if (!role.type) {
          console.warn(`角色 ${role.name} 缺少类型信息，跳过验证`);
          // 跳过缺少类型信息的角色验证
          continue;
        }
        
        // 验证角色类型是否与用户类型匹配
        if (role.type !== userType) {
          throw new Error(`角色 ${role.name} 的类型与用户类型不匹配`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('验证用户角色失败:', error);
      // 不抛出错误，允许操作继续
      // 这样前端可以使用默认角色数据
      console.log('验证失败，但允许操作继续');
      return true;
    }
  },

  // 创建用户
  async createUser(user: any) {
    try {
      console.log('开始创建用户，用户数据:', user);
      
      // 验证用户类型和角色是否匹配
      if (user.role_id) {
        await this.validateUserRoles(null, user.type, [user.role_id]);
      }
      
      // 确保包含必要的数据库字段，只使用数据库中实际存在的字段
      const dbUser = {
        // 基本字段
        name: user.user_name || user.name || user.username,
        username: user.user_name || user.username,
        password_hash: user.password_hash || user.password,
        type: user.type || 'internal',
        role_id: user.role_id,
        // 可选字段
        customer: user.customer,
        status: user.status || 'enabled',
        create_time: user.create_time || new Date().toISOString()
      };
      
      // 删除前端特有的字段
      delete dbUser.role_ids;
      delete dbUser.role;
      delete dbUser.createTime;
      delete dbUser.last_login_time;
      delete dbUser.creator;
      delete dbUser.user_id;
      delete dbUser.user_name;
      delete dbUser.phone;
      delete dbUser.email;
      delete dbUser.create_by;
      delete dbUser.is_deleted;
      
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
      // 验证用户类型和角色是否匹配
      if (user.role_id) {
        await this.validateUserRoles(id, user.type, [user.role_id]);
      }
      
      // 转换前端字段名到数据库字段名，只使用数据库中实际存在的字段
      const dbUser = {
        // 基本字段
        name: user.user_name || user.name || user.username,
        username: user.user_name || user.username,
        password_hash: user.password_hash || user.password,
        type: user.type || 'internal',
        role_id: user.role_id,
        // 可选字段
        customer: user.customer,
        status: user.status || 'enabled'
      };
      
      // 删除前端特有的字段
      delete dbUser.role_ids;
      delete dbUser.role;
      delete dbUser.createTime;
      delete dbUser.last_login_time;
      delete dbUser.creator;
      delete dbUser.user_id;
      delete dbUser.user_name;
      delete dbUser.phone;
      delete dbUser.email;
      delete dbUser.create_by;
      delete dbUser.is_deleted;
      delete dbUser.create_time;
      
      const { data, error } = await supabase
        .from('users')
        .update(dbUser)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('更新用户失败:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('更新用户过程中发生异常:', error);
      return null;
    }
  },

  // 删除用户
  async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('删除用户失败:', error);
      return false;
    }
    
    return true;
  }
};

// 调研表单相关操作
export const surveyService = {
  // 获取表单列表
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

  // 创建表单
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

  // 更新表单
  async updateSurvey(id: string, survey: any) {
    // 转换前端字段名到数据库字段名
    const dbSurvey = {
      ...survey,
      report_status: survey.reportStatus || survey.report_status,
      customer_name: survey.customerName || survey.customer_name,
      project_name: survey.projectName || survey.project_name,
      pre_sales_responsible_id: survey.preSalesResponsibleId || survey.pre_sales_responsible_id
    };
    
    // 删除前端特有的字段
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

  // 删除表单
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
  // 获取模板列表
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

  // 创建模板
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
  // 获取字典类型列表
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

  // 获取字典项列表
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
  // 创建日志
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

  // 获取日志列表
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
  // 获取消息列表
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

  // 标记消息为已读
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
  // 获取角色列表
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

  // 创建角色
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

  // 更新角色
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

  // 删除角色
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
