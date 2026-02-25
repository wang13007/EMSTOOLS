// 执行Supabase SQL脚本，修复RLS策略问题
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从环境变量获取Supabase连接信息
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hjehaiqxsekuiwwevpsi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_uMjNKMcl2FYKnYz52bBqAw_24x8ootw';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 读取SQL文件
const sqlPath = path.join(__dirname, 'fix-rls-policy.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

console.log('开始执行SQL脚本...');
console.log('SQL内容:', sqlContent);

// 执行SQL脚本
async function executeSQL() {
  try {
    // 执行SQL语句
    const { data, error } = await supabase
      .rpc('execute_sql', { sql: sqlContent });
    
    if (error) {
      console.error('执行SQL失败:', error);
      return;
    }
    
    console.log('执行SQL成功:', data);
    console.log('RLS策略修复完成');
  } catch (error) {
    console.error('执行SQL过程中发生异常:', error);
    console.error('注意：如果rpc方法不可用，请直接在Supabase SQL Editor中执行fix-rls-policy.sql文件的内容');
  }
}

// 执行SQL
executeSQL();