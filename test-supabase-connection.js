// 测试Supabase连接和基本操作
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 获取Supabase连接信息
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey);

// 检查环境变量是否存在
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('错误: 缺少Supabase环境变量');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 测试连接
async function testConnection() {
  console.log('\n测试Supabase连接...');
  
  try {
    // 测试基本查询
    const { data, error } = await supabase
      .from('users')
      .select('id, name, username')
      .limit(1);
    
    if (error) {
      console.error('连接测试失败:', error);
      return false;
    }
    
    console.log('连接测试成功! 获取到用户数据:', data);
    return true;
  } catch (err) {
    console.error('连接测试异常:', err);
    return false;
  }
}

// 测试创建操作
async function testCreate() {
  console.log('\n测试创建操作...');
  
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .insert({
        type: 'system',
        content: '测试日志',
        result: '成功'
      })
      .select()
      .single();
    
    if (error) {
      console.error('创建操作失败:', error);
      return false;
    }
    
    console.log('创建操作成功! 创建的日志:', data);
    return data;
  } catch (err) {
    console.error('创建操作异常:', err);
    return false;
  }
}

// 测试更新操作
async function testUpdate(logId) {
  if (!logId) {
    console.log('跳过更新操作测试，因为没有有效的日志ID');
    return false;
  }
  
  console.log('\n测试更新操作...');
  
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .update({ content: '更新后的测试日志' })
      .eq('id', logId)
      .select()
      .single();
    
    if (error) {
      console.error('更新操作失败:', error);
      return false;
    }
    
    console.log('更新操作成功! 更新后的日志:', data);
    return true;
  } catch (err) {
    console.error('更新操作异常:', err);
    return false;
  }
}

// 测试删除操作
async function testDelete(logId) {
  if (!logId) {
    console.log('跳过删除操作测试，因为没有有效的日志ID');
    return false;
  }
  
  console.log('\n测试删除操作...');
  
  try {
    const { error } = await supabase
      .from('system_logs')
      .delete()
      .eq('id', logId);
    
    if (error) {
      console.error('删除操作失败:', error);
      return false;
    }
    
    console.log('删除操作成功!');
    return true;
  } catch (err) {
    console.error('删除操作异常:', err);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  console.log('开始测试Supabase连接和操作...');
  
  const connectionOk = await testConnection();
  const createdLog = await testCreate();
  const logId = createdLog ? createdLog.id : null;
  const updateOk = await testUpdate(logId);
  const deleteOk = await testDelete(logId);
  
  console.log('\n测试结果汇总:');
  console.log('连接测试:', connectionOk ? '通过' : '失败');
  console.log('创建测试:', createdLog ? '通过' : '失败');
  console.log('更新测试:', updateOk ? '通过' : '失败');
  console.log('删除测试:', deleteOk ? '通过' : '失败');
  
  if (connectionOk) {
    console.log('\nSupabase连接正常，问题可能出在前端代码或认证方面');
  } else {
    console.log('\nSupabase连接失败，需要检查连接信息和数据库配置');
  }
}

// 执行测试
runTests().catch(console.error);
