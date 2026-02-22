const { createClient } = require('@supabase/supabase-js');

// 使用 service key 以获得管理员权限
const supabaseUrl = 'https://hjehaiqxsekuiwwevpsi.supabase.co';
const supabaseServiceKey = 'sb_service_24x8ootw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('开始修复 RLS 策略...');
  
  try {
    // 1. 首先尝试删除所有现有的 roles 表策略
    console.log('1. 删除所有现有的 roles 表策略...');
    const { error: dropError } = await supabase
      .rpc('execute_sql', {
        sql: `
          DROP POLICY IF EXISTS "Allow all users to view roles" ON roles;
          DROP POLICY IF EXISTS "Admin can manage roles" ON roles;
          DROP POLICY IF EXISTS "Allow select for authenticated users" ON roles;
        `
      });
    
    if (dropError) {
      console.error('删除策略失败:', dropError);
    } else {
      console.log('删除策略成功');
    }
    
    // 2. 禁用 roles 表的 RLS
    console.log('\n2. 禁用 roles 表的 RLS...');
    const { error: disableError } = await supabase
      .rpc('execute_sql', {
        sql: 'ALTER TABLE roles DISABLE ROW LEVEL SECURITY;'
      });
    
    if (disableError) {
      console.error('禁用 RLS 失败:', disableError);
    } else {
      console.log('禁用 RLS 成功');
    }
    
    // 3. 重新启用 roles 表的 RLS 并创建最简单的策略
    console.log('\n3. 重新启用 roles 表的 RLS 并创建简单策略...');
    const { error: enableError } = await supabase
      .rpc('execute_sql', {
        sql: `
          ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Allow all access to roles" ON roles
            FOR ALL USING (true);
        `
      });
    
    if (enableError) {
      console.error('启用 RLS 并创建策略失败:', enableError);
    } else {
      console.log('启用 RLS 并创建策略成功');
    }
    
    // 4. 测试连接
    console.log('\n4. 测试连接...');
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
