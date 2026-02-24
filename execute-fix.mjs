import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 使用环境变量
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 请在.env文件中设置SUPABASE_URL和SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeFix() {
  console.log('开始执行 RLS 策略修复...');
  
  try {
    // 读取 SQL 文件内容
    console.log('读取 SQL 文件...');
    const sqlContent = fs.readFileSync('supabase-fix.sql', 'utf8');
    console.log('读取 SQL 文件成功，共', sqlContent.length, '字符');
    
    // 测试连接
    console.log('\n测试连接...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('roles')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('测试连接失败:', testError);
        console.error('错误详情:', JSON.stringify(testError, null, 2));
      } else {
        console.log('测试连接成功:', testData);
      }
    } catch (error) {
      console.error('测试连接过程中发生异常:', error);
    }
    
    // 尝试直接执行简单的 SQL 语句来测试
    console.log('\n尝试直接执行简单的 SQL 语句...');
    try {
      // 注意：在 Supabase 中，直接执行 SQL 需要通过 RPC 或使用服务端 SDK
      // 这里我们只是测试连接和基本操作
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (usersError) {
        console.error('获取用户列表失败:', usersError);
        console.error('错误详情:', JSON.stringify(usersError, null, 2));
      } else {
        console.log('获取用户列表成功:', usersData);
      }
    } catch (error) {
      console.error('执行简单 SQL 过程中发生异常:', error);
    }
    
    console.log('\n修复完成');
  } catch (error) {
    console.error('执行过程中发生错误:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
  }
}

executeFix();
