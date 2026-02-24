import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 使用环境变量
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 请在.env文件中设置SUPABASE_URL和SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeFix() {
  console.log('开始执行 RLS 策略修复...');
  
  try {
    // 读取 SQL 文件内容
    const sqlContent = fs.readFileSync('supabase-fix.sql', 'utf8');
    console.log('读取 SQL 文件成功，共', sqlContent.length, '字符');
    
    // 执行 SQL 语句
    console.log('\n执行 SQL 语句...');
    const { data, error } = await supabase
      .rpc('execute_sql', {
        sql: sqlContent
      });
    
    if (error) {
      console.error('执行 SQL 失败:', error);
    } else {
      console.log('执行 SQL 成功:', data);
    }
    
    // 测试连接
    console.log('\n测试连接...');
    const { data: testData, error: testError } = await supabase
      .from('roles')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('测试连接失败:', testError);
    } else {
      console.log('测试连接成功:', testData);
    }
    
    console.log('\n修复完成');
  } catch (error) {
    console.error('执行过程中发生错误:', error);
  }
}

executeFix();
