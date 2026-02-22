import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 从环境变量或配置文件中获取 Supabase 配置
const supabaseUrl = 'https://hjehaiqxsekuiwwevpsi.supabase.co';
const supabaseServiceKey = 'sb_service_24x8ootw'; // 使用 service key 以获得管理员权限

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 读取 SQL 文件内容
const sqlContent = fs.readFileSync('supabase-init.sql', 'utf8');

// 执行 SQL 命令
async function executeSql() {
  try {
    console.log('开始执行 SQL 脚本...');
    
    // 分割 SQL 语句
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`共 ${sqlStatements.length} 条 SQL 语句`);
    
    // 执行每条 SQL 语句
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`执行语句 ${i + 1}/${sqlStatements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('execute_sql', { sql: statement });
        if (error) {
          console.error(`执行语句 ${i + 1} 失败:`, error.message);
        } else {
          console.log(`执行语句 ${i + 1} 成功`);
        }
      } catch (err) {
        console.error(`执行语句 ${i + 1} 异常:`, err.message);
      }
    }
    
    console.log('SQL 脚本执行完成');
  } catch (error) {
    console.error('执行过程中发生错误:', error);
  }
}

executeSql();
