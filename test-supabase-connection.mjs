import { createClient } from '@supabase/supabase-js';

// 从环境变量或配置文件中获取 Supabase 配置
const supabaseUrl = 'https://hjehaiqxsekuiwwevpsi.supabase.co';
const supabaseAnonKey = 'sb_publishable_uMjNKMcl2FYKnYz52bBqAw_24x8ootw';

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey);
console.log('开始测试Supabase连接和操作...\n');

// 测试1: 测试连接
async function testConnection() {
  console.log('测试Supabase连接...');
  try {
    // 尝试查询一个简单的表
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('连接测试失败:', error);
      return false;
    }
    
    console.log('连接测试成功:', data);
    return true;
  } catch (error) {
    console.error('连接测试异常:', error);
    return false;
  }
}

// 测试2: 测试创建操作
async function testCreate() {
  console.log('\n测试创建操作...');
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .insert({
        type: 'test',
        content: '测试创建操作',
        result: '成功'
      })
      .select();
    
    if (error) {
      console.error('创建操作失败:', error);
      return null;
    }
    
    console.log('创建操作成功:', data);
    return data[0].id;
  } catch (error) {
    console.error('创建操作异常:', error);
    return null;
  }
}

// 测试3: 测试更新操作
async function testUpdate(logId) {
  if (!logId) {
    console.log('跳过更新操作测试，因为没有有效的日志ID');
    return false;
  }
  
  console.log('\n测试更新操作...');
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .update({ content: '测试更新操作' })
      .eq('id', logId)
      .select();
    
    if (error) {
      console.error('更新操作失败:', error);
      return false;
    }
    
    console.log('更新操作成功:', data);
    return true;
  } catch (error) {
    console.error('更新操作异常:', error);
    return false;
  }
}

// 测试4: 测试删除操作
async function testDelete(logId) {
  if (!logId) {
    console.log('跳过删除操作测试，因为没有有效的日志ID');
    return false;
  }
  
  console.log('\n测试删除操作...');
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .delete()
      .eq('id', logId);
    
    if (error) {
      console.error('删除操作失败:', error);
      return false;
    }
    
    console.log('删除操作成功');
    return true;
  } catch (error) {
    console.error('删除操作异常:', error);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  const test1Result = await testConnection();
  const logId = await testCreate();
  const test3Result = await testUpdate(logId);
  const test4Result = await testDelete(logId);
  
  console.log('\n测试结果汇总:');
  console.log('连接测试:', test1Result ? '成功' : '失败');
  console.log('创建测试:', logId ? '成功' : '失败');
  console.log('更新测试:', test3Result ? '成功' : '失败');
  console.log('删除测试:', test4Result ? '成功' : '失败');
  
  if (test1Result) {
    console.log('\nSupabase连接成功，数据库配置正常');
  } else {
    console.log('\nSupabase连接失败，需要检查连接信息和数据库配置');
  }
}

runAllTests();
