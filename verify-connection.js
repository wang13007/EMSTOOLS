import { createClient } from '@supabase/supabase-js';

// 使用匿名访问密钥（前端使用的）
const supabaseUrl = 'https://hjehaiqxsekuiwwevpsi.supabase.co';
const supabaseAnonKey = 'sb_publishable_uMjNKMcl2FYKnYz52bBqAw_24x8ootw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyConnection() {
  console.log('验证 Supabase 连接...');
  
  try {
    // 测试查询 roles 表
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .limit(2);
    
    if (error) {
      console.error('连接验证失败:', error);
      return false;
    }
    
    console.log('连接验证成功！获取到角色数据:', data);
    
    // 测试查询 users 表
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(2);
    
    if (usersError) {
      console.error('获取用户数据失败:', usersError);
    } else {
      console.log('获取用户数据成功:', users);
    }
    
    // 测试查询 survey_forms 表
    const { data: surveys, error: surveysError } = await supabase
      .from('survey_forms')
      .select('*')
      .limit(2);
    
    if (surveysError) {
      console.error('获取调研表单数据失败:', surveysError);
    } else {
      console.log('获取调研表单数据成功:', surveys);
    }
    
    return true;
  } catch (error) {
    console.error('验证过程中发生错误:', error);
    return false;
  }
}

verifyConnection();
