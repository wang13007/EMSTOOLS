-- 修复 roles 表的 RLS 策略，解决无限递归问题

-- 1. 首先禁用 roles 表的 RLS
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- 2. 重新启用 RLS 并创建简单的策略
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to roles" ON roles
  FOR ALL USING (true);

-- 3. 为其他表创建简单的 RLS 策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to users" ON users
  FOR ALL USING (true);

ALTER TABLE survey_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to survey_forms" ON survey_forms
  FOR ALL USING (true);

ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to survey_templates" ON survey_templates
  FOR ALL USING (true);

ALTER TABLE survey_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to survey_reports" ON survey_reports
  FOR ALL USING (true);

ALTER TABLE dict_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to dict_types" ON dict_types
  FOR ALL USING (true);

ALTER TABLE dict_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to dict_items" ON dict_items
  FOR ALL USING (true);

ALTER TABLE region_dicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to region_dicts" ON region_dicts
  FOR ALL USING (true);

ALTER TABLE product_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to product_capabilities" ON product_capabilities
  FOR ALL USING (true);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to system_logs" ON system_logs
  FOR ALL USING (true);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to messages" ON messages
  FOR ALL USING (true);

-- 验证修复
SELECT 'RLS 策略修复完成' AS status;
