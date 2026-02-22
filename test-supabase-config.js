// Supabase 配置测试脚本
import { createClient } from '@supabase/supabase-js';

// 从环境变量文件中读取配置
import fs from 'fs';

console.log('=== Supabase 配置测试 ===\n');

// 读取 .env.local 文件
const envContent = fs.readFileSync('.env.local', 'utf8');
console.log('读取 .env.local 文件内容:');
console.log(envContent);

// 简单解析环境变量
const lines = envContent.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';

lines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].replace(/"/g, '');
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].replace(/"/g, '');
  }
});

console.log('\n解析结果:');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? '✓ 已配置' : '✗ 未配置');

if (supabaseUrl && supabaseAnonKey) {
  console.log('\n=== 测试 Supabase 连接 ===');
  
  // 创建 Supabase 客户端
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // 测试连接
  async function testConnection() {
    try {
      console.log('测试连接中...');
      
      // 尝试获取一些数据
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .limit(5);
      
      if (error) {
        console.log('连接测试结果:', '❌ 失败');
        console.log('错误信息:', error.message);
        console.log('\n可能的原因:');
        console.log('1. 数据库表结构尚未创建');
        console.log('2. Row Level Security 配置问题');
        console.log('3. 网络连接问题');
        console.log('4. API 密钥配置错误');
      } else {
        console.log('连接测试结果:', '✅ 成功');
        console.log('获取到的角色数量:', data.length);
        console.log('角色数据:', data);
      }
    } catch (error) {
      console.log('连接测试结果:', '❌ 失败');
      console.log('错误信息:', error.message);
    }
  }
  
  testConnection();
} else {
  console.log('\n❌ 配置不完整，请检查 .env.local 文件');
}
