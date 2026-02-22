import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('开始执行Supabase初始化脚本...');

// 直接从.env.local文件读取配置
console.log('读取.env.local文件...');
const envContent = fs.readFileSync('.env.local', 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
  // 修复正则表达式，正确解析带引号的环境变量
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    const value = valueParts.join('=').replace(/^"|"$/g, '');
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('缺少Supabase连接信息，请检查.env.local文件');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 测试连接
async function testConnection() {
  try {
    console.log('测试Supabase连接...');
    const { data, error } = await supabase.from('roles').select('*').limit(1);
    
    if (error) {
      console.log('连接测试结果: 需要初始化数据库');
      console.log('错误信息:', error.message);
      console.log('\n📋 数据库初始化步骤:');
      console.log('1. 登录 Supabase 仪表板: https://app.supabase.com');
      console.log('2. 选择您的项目: hjehaiqxsekuiwwevpsi');
      console.log('3. 进入 SQL Editor 页面');
      console.log('4. 复制粘贴 supabase-init.sql 文件的内容');
      console.log('5. 点击 "Run" 执行脚本');
      console.log('\n✅ 脚本执行完成后，数据库将包含:');
      console.log('- 11个完整的数据表结构');
      console.log('- 默认角色和用户数据');
      console.log('- 调研模板和示例表单');
      console.log('- 字典数据和区域信息');
      console.log('- 产品能力数据');
      console.log('- 系统日志和消息');
      console.log('- 启用的Row Level Security');
      console.log('\n📁 supabase-init.sql 文件位置:', __dirname + '\\supabase-init.sql');
    } else {
      console.log('连接测试结果: 数据库已初始化');
      console.log('检测到角色数据:', data.length > 0 ? '✅ 存在' : '❌ 不存在');
      console.log('\n🎉 数据库连接正常！');
    }
  } catch (error) {
    console.error('测试连接时发生错误:', error);
  }
}

// 执行测试
testConnection();
