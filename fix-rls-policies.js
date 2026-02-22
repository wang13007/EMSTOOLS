import { createClient } from '@supabase/supabase-js';

// 使用 service key 以获得管理员权限
const supabaseUrl = 'https://hjehaiqxsekuiwwevpsi.supabase.co';
const supabaseServiceKey = 'sb_service_24x8ootw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('开始修复 RLS 策略...');
  
  try {
    // 1. 禁用 roles 表的 RLS
    console.log('1. 禁用 roles 表的 RLS...');
    const { error: disableError } = await supabase
      .rpc('execute_sql', {
        sql: 'ALTER TABLE roles DISABLE ROW LEVEL SECURITY;'
      });
    
    if (disableError) {
      console.error('禁用 RLS 失败:', disableError);
    } else {
      console.log('禁用 RLS 成功');
    }
    
    // 2. 重新启用 roles 表的 RLS 并创建简单策略
    console.log('\n2. 重新启用 roles 表的 RLS 并创建简单策略...');
    const { error: enableError } = await supabase
      .rpc('execute_sql', {
        sql: `
          ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Allow all users to view roles" ON roles
            FOR SELECT USING (true);
        `
      });
    
    if (enableError) {
      console.error('启用 RLS 并创建策略失败:', enableError);
    } else {
      console.log('启用 RLS 并创建策略成功');
    }
    
    // 3. 测试连接
    console.log('\n3. 测试连接...');
    const { data, error: testError } = await supabase
      .from('roles')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('测试连接失败:', testError);
    } else {
      console.log('测试连接成功:', data);
    }
    
    console.log('\nRLS 策略修复完成');
  } catch (error) {
    console.error('执行过程中发生错误:', error);
  }
}

fixRLSPolicies();
