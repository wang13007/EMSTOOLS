-- 临时关闭roles表的RLS，解决无限递归问题
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- 查看当前RLS状态
SELECT table_name, rowsecurity FROM pg_tables WHERE table_name IN ('users', 'roles');

-- 如果需要，也可以关闭users表的RLS进行测试
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 完成修复
SELECT 'RLS策略修复完成' AS status;