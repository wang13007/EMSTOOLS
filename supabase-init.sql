-- Supabase 数据库初始化脚本

-- 1. 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建表结构

-- 创建角色表
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL CHECK (status IN ('enabled', 'disabled')),
  create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  update_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('internal', 'external')),
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  customer VARCHAR(100),
  status VARCHAR(20) NOT NULL CHECK (status IN ('enabled', 'disabled')),
  create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  update_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建调研模板表
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  industry VARCHAR(100) NOT NULL,
  sections JSONB NOT NULL,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  update_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建调研表单表
CREATE TABLE IF NOT EXISTS survey_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  project_name VARCHAR(200) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  template_id UUID REFERENCES survey_templates(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('草稿', '填写中', '已完成')),
  report_status VARCHAR(20) NOT NULL CHECK (report_status IN ('未生成', '已生成')),
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  submitter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pre_sales_responsible_id UUID REFERENCES users(id) ON DELETE SET NULL,
  data JSONB DEFAULT '{}'::jsonb,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  update_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建调研报告表
CREATE TABLE IF NOT EXISTS survey_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES survey_forms(id) ON DELETE CASCADE UNIQUE,
  content TEXT NOT NULL,
  generate_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建字典类型表
CREATE TABLE IF NOT EXISTS dict_types (
  type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name VARCHAR(100) NOT NULL,
  type_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('enabled', 'disabled')),
  sort_order INTEGER DEFAULT 0,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 创建字典项表
CREATE TABLE IF NOT EXISTS dict_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id UUID REFERENCES dict_types(type_id) ON DELETE CASCADE,
  item_label VARCHAR(100) NOT NULL,
  item_value VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL CHECK (status IN ('enabled', 'disabled')),
  ext1 VARCHAR(100),
  ext2 VARCHAR(100),
  create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 创建区域字典表
CREATE TABLE IF NOT EXISTS region_dicts (
  region_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name VARCHAR(100) NOT NULL,
  region_code VARCHAR(50) UNIQUE NOT NULL,
  parent_id UUID REFERENCES region_dicts(region_id) ON DELETE SET NULL,
  region_level INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL CHECK (status IN ('enabled', 'disabled')),
  is_system BOOLEAN DEFAULT false,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建产品能力表
CREATE TABLE IF NOT EXISTS product_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('软件', '硬件', '咨询')),
  industries JSONB DEFAULT '[]'::jsonb,
  scenarios JSONB DEFAULT '[]'::jsonb,
  description TEXT NOT NULL,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('login', 'survey', 'user', 'system')),
  content TEXT NOT NULL,
  ip_address VARCHAR(50),
  result VARCHAR(20) NOT NULL CHECK (result IN ('成功', '失败')),
  create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('system', 'report')),
  read BOOLEAN DEFAULT false,
  cleared BOOLEAN DEFAULT false,
  target_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES survey_forms(id) ON DELETE SET NULL,
  create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_survey_forms_status ON survey_forms(status);
CREATE INDEX IF NOT EXISTS idx_survey_forms_creator_id ON survey_forms(creator_id);
CREATE INDEX IF NOT EXISTS idx_survey_forms_customer_name ON survey_forms(customer_name);
CREATE INDEX IF NOT EXISTS idx_survey_forms_project_name ON survey_forms(project_name);
CREATE INDEX IF NOT EXISTS idx_dict_items_type_id ON dict_items(type_id);
CREATE INDEX IF NOT EXISTS idx_region_dicts_parent_id ON region_dicts(parent_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_operator_id ON system_logs(operator_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON system_logs(type);
CREATE INDEX IF NOT EXISTS idx_system_logs_create_time ON system_logs(create_time);
CREATE INDEX IF NOT EXISTS idx_messages_target_user_id ON messages(target_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_target_role_id ON messages(target_role_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- 4. 插入默认数据

-- 插入默认角色
INSERT INTO roles (name, description, permissions, status) VALUES
('超级管理员', '系统最高权限', '{"users": true, "roles": true, "surveys": true, "templates": true, "dictionaries": true, "reports": true, "logs": true, "messages": true}', 'enabled'),
('售前工程师', '售前调研管理权限', '{"surveys": true, "reports": true, "messages": true}', 'enabled'),
('客户用户', '客户填写权限', '{"surveys": true, "messages": true}', 'enabled');

-- 插入默认用户（密码哈希值为 'password' 的哈希值）
INSERT INTO users (name, username, password_hash, type, role_id, customer, status) VALUES
('系统管理员', 'admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'internal', (SELECT id FROM roles WHERE name = '超级管理员'), NULL, 'enabled'),
('张三', 'zhangsan', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'internal', (SELECT id FROM roles WHERE name = '售前工程师'), NULL, 'enabled'),
('李四', 'lisi', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'external', (SELECT id FROM roles WHERE name = '客户用户'), '某制造有限公司', 'enabled'),
('王五', 'wangwu', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'external', (SELECT id FROM roles WHERE name = '客户用户'), '某能源公司', 'enabled');

-- 插入默认模板
INSERT INTO survey_templates (name, industry, sections) VALUES
('通用制造业调研模板', '制造业', '[{"id": "section1", "title": "企业基本信息", "fields": [{"id": "company_name", "label": "企业名称", "type": "text", "required": true}, {"id": "company_size", "label": "企业规模", "type": "select", "options": ["小型", "中型", "大型"], "required": true}]}]'),
('能源行业调研模板', '能源', '[{"id": "section1", "title": "能源使用情况", "fields": [{"id": "energy_type", "label": "主要能源类型", "type": "multiselect", "options": ["电力", "天然气", "煤炭", "可再生能源"], "required": true}]}]');

-- 插入默认字典类型
INSERT INTO dict_types (type_name, type_code, description, status, creator_id) VALUES
('行业类型', 'industry', '企业所属行业', 'enabled', (SELECT id FROM users WHERE username = 'admin')),
('区域类型', 'region', '地理区域', 'enabled', (SELECT id FROM users WHERE username = 'admin'));

-- 插入默认字典项
INSERT INTO dict_items (type_id, item_label, item_value, status, creator_id) VALUES
((SELECT type_id FROM dict_types WHERE type_code = 'industry'), '制造业', 'manufacturing', 'enabled', (SELECT id FROM users WHERE username = 'admin')),
((SELECT type_id FROM dict_types WHERE type_code = 'industry'), '能源', 'energy', 'enabled', (SELECT id FROM users WHERE username = 'admin')),
((SELECT type_id FROM dict_types WHERE type_code = 'industry'), '建筑', 'construction', 'enabled', (SELECT id FROM users WHERE username = 'admin')),
((SELECT type_id FROM dict_types WHERE type_code = 'industry'), '交通', 'transportation', 'enabled', (SELECT id FROM users WHERE username = 'admin')),
((SELECT type_id FROM dict_types WHERE type_code = 'region'), '北京市', 'beijing', 'enabled', (SELECT id FROM users WHERE username = 'admin')),
((SELECT type_id FROM dict_types WHERE type_code = 'region'), '上海市', 'shanghai', 'enabled', (SELECT id FROM users WHERE username = 'admin')),
((SELECT type_id FROM dict_types WHERE type_code = 'region'), '广东省', 'guangdong', 'enabled', (SELECT id FROM users WHERE username = 'admin'));

-- 插入默认区域
INSERT INTO region_dicts (region_name, region_code, region_level, status, is_system) VALUES
('中国', 'CN', 1, 'enabled', true),
('北京市', 'CN_BJ', 2, 'enabled', true),
('上海市', 'CN_SH', 2, 'enabled', true),
('广东省', 'CN_GD', 2, 'enabled', true);

-- 插入默认产品能力
INSERT INTO product_capabilities (name, type, industries, scenarios, description) VALUES
('智能能源监控系统', '软件', '["制造业", "能源", "建筑"]', '["工厂", "办公楼", "数据中心"]', '实时监控能源使用情况，提供节能建议'),
('能效分析服务', '咨询', '["制造业", "能源", "建筑", "交通"]', '["企业整体能效提升", "节能改造项目"]', '专业的能效分析和优化方案设计'),
('智能电表', '硬件', '["能源", "建筑"]', '["电力计量", "能耗监测"]', '高精度智能电表，支持远程抄表和数据分析');

-- 插入模拟调研表单
INSERT INTO survey_forms (name, customer_name, project_name, industry, region, template_id, status, report_status, creator_id, submitter_id, pre_sales_responsible_id, data) VALUES
('2024Q1 某工厂能效调研', '某制造有限公司', '工厂能效优化项目', '制造业', '北京市', (SELECT id FROM survey_templates WHERE name = '通用制造业调研模板'), '已完成', '已生成', (SELECT id FROM users WHERE username = 'zhangsan'), (SELECT id FROM users WHERE username = 'lisi'), (SELECT id FROM users WHERE username = 'zhangsan'), '{"company_name": "某制造有限公司", "company_size": "大型"}'),
('2024Q1 某能源公司调研', '某能源公司', '能源管理系统升级', '能源', '上海市', (SELECT id FROM survey_templates WHERE name = '能源行业调研模板'), '填写中', '未生成', (SELECT id FROM users WHERE username = 'zhangsan'), NULL, (SELECT id FROM users WHERE username = 'zhangsan'), '{"energy_type": ["电力", "天然气"]}'),
('2024Q2 新建工厂调研', '某制造有限公司', '新建工厂能效规划', '制造业', '广东省', (SELECT id FROM survey_templates WHERE name = '通用制造业调研模板'), '草稿', '未生成', (SELECT id FROM users WHERE username = 'zhangsan'), NULL, (SELECT id FROM users WHERE username = 'zhangsan'), '{}');

-- 插入模拟调研报告
INSERT INTO survey_reports (form_id, content) VALUES
((SELECT id FROM survey_forms WHERE name = '2024Q1 某工厂能效调研'), '# 数字化转型调研报告

## 一、项目概况
- 项目名称：工厂能效优化项目
- 客户名称：某制造有限公司
- 所属行业：制造业
- 所属区域：北京市

## 二、调研结论
基于对某制造有限公司的深入调研，我们发现客户在数字化转型过程中存在明显的能效管理优化空间。目前系统集成度较低，数据孤岛现象普遍，建议引入 EMS 专家系统进行统一调度与监控。

## 三、建议方案
1. **基础能源监控**：实现全厂区水、电、气、热的实时在线监测。
2. **智能能效分析**：利用 AI 算法识别异常用能，提供节能优化建议。
3. **系统集成**：与现有 ERP、MES 等系统进行集成，实现数据共享。

## 四、预期效果
- 节能率：15-20%
- 运维成本降低：25%
- 能源管理效率提升：60%

报告生成时间：2024-01-15
售前负责人：张三');

-- 插入模拟系统日志
INSERT INTO system_logs (operator_id, type, content, ip_address, result) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'login', '用户 admin 登录系统', '192.168.1.1', '成功'),
((SELECT id FROM users WHERE username = 'zhangsan'), 'survey', '创建调研表单 "2024Q1 某工厂能效调研"', '192.168.1.2', '成功'),
((SELECT id FROM users WHERE username = 'lisi'), 'survey', '提交调研表单 "2024Q1 某工厂能效调研"', '192.168.1.3', '成功'),
((SELECT id FROM users WHERE username = 'admin'), 'user', '创建用户 "王五"', '192.168.1.1', '成功');

-- 插入模拟消息
INSERT INTO messages (title, content, type, target_user_id, project_id) VALUES
('报告生成成功', '您的调研表单 "2024Q1 某工厂能效调研" 已提交成功，报告已生成', 'report', (SELECT id FROM users WHERE username = 'zhangsan'), (SELECT id FROM survey_forms WHERE name = '2024Q1 某工厂能效调研')),
('系统通知', '欢迎使用 EMS 售前调研工具，您已成功登录系统', 'system', (SELECT id FROM users WHERE username = 'admin'), NULL),
('新任务分配', '您有一个新的调研任务需要处理', 'system', (SELECT id FROM users WHERE username = 'zhangsan'), NULL);

-- 5. 启用 Row Level Security (RLS) - 修复无限递归问题

-- 为角色表启用 RLS - 简化版本，避免无限递归
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view roles" ON roles
  FOR SELECT USING (true);

-- 为用户表启用 RLS - 简化版本
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view their own data" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow public select access" ON users
  FOR SELECT USING (true);

-- 为调研表单表启用 RLS
ALTER TABLE survey_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select access" ON survey_forms
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON survey_forms
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON survey_forms
  FOR UPDATE USING (true);

-- 为其他表启用 RLS
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select access" ON survey_templates
  FOR SELECT USING (true);

ALTER TABLE survey_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select access" ON survey_reports
  FOR SELECT USING (true);

ALTER TABLE dict_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select access" ON dict_types
  FOR SELECT USING (true);

ALTER TABLE dict_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select access" ON dict_items
  FOR SELECT USING (true);

ALTER TABLE region_dicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select access" ON region_dicts
  FOR SELECT USING (true);

ALTER TABLE product_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select access" ON product_capabilities
  FOR SELECT USING (true);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select access" ON system_logs
  FOR SELECT USING (true);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select access" ON messages
  FOR SELECT USING (true);
CREATE POLICY "Allow public update access" ON messages
  FOR UPDATE USING (true);

-- 6. 完成初始化
SELECT '数据库初始化完成' AS status;
