// Supabase配置文件
import { createClient } from '@supabase/supabase-js';

// 类型声明以支持import.meta.env
declare interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

declare interface ImportMeta {
  env: ImportMetaEnv;
}

// 从环境变量中获取Supabase连接信息
// 注意：在生产环境中，这些值应该存储在环境变量中
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
