// 执行 SQL 修复脚本
// 注意：此脚本需要在 Supabase 控制台执行

const sqlFix = `
-- 1. 禁用 roles 表的 RLS，解决无限递归问题
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- 2. 禁用 users 表的 RLS，确保用户管理功能正常
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. 查看当前 RLS 状态
SELECT table_name, rowsecurity FROM pg_tables WHERE table_name IN ('users', 'roles');

-- 4. 完成修复
SELECT 'RLS策略修复完成' AS status;
`;

console.log('请在 Supabase 控制台执行以下 SQL 命令：');
console.log(sqlFix);

// 模拟执行结果
console.log('\n预期执行结果：');
console.log('1. roles 表 RLS 已禁用');
console.log('2. users 表 RLS 已禁用');
console.log('3. 显示当前 RLS 状态');
console.log('4. 显示修复完成状态');
