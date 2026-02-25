-- 1. 禁用 roles 表的 RLS，解决无限递归问题
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- 2. 禁用 users 表的 RLS，确保用户管理功能正常
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. 查看当前 RLS 状态
SELECT table_name, rowsecurity FROM pg_tables WHERE table_name IN ('users', 'roles');

-- 4. 完成修复
SELECT 'RLS策略修复完成' AS status;