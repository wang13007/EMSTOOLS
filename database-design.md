# EMS 售前调研工具 - 数据库设计

## 1. 数据库表结构

### 1.1 用户表 (`users`)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | 用户ID |
| `name` | `varchar(100)` | `NOT NULL` | 用户姓名 |
| `username` | `varchar(50)` | `UNIQUE NOT NULL` | 用户名/账号 |
| `password_hash` | `varchar(255)` | `NOT NULL` | 密码哈希值 |
| `type` | `varchar(20)` | `NOT NULL CHECK (type IN ('internal', 'external'))` | 用户类型 |
| `role_id` | `uuid` | `REFERENCES roles(id)` | 角色ID |
| `customer` | `varchar(100)` | | 所属客户（外部用户） |
| `status` | `varchar(20)` | `NOT NULL CHECK (status IN ('enabled', 'disabled'))` | 用户状态 |
| `create_time` | `timestamp with time zone` | `DEFAULT NOW()` | 创建时间 |
| `update_time` | `timestamp with time zone` | `DEFAULT NOW()` | 更新时间 |

### 1.2 角色表 (`roles`)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | 角色ID |
| `name` | `varchar(50)` | `UNIQUE NOT NULL` | 角色名称 |
| `description` | `text` | | 角色描述 |
| `permissions` | `jsonb` | `DEFAULT '{}'::jsonb` | 权限配置 |
| `status` | `varchar(20)` | `NOT NULL CHECK (status IN ('enabled', 'disabled'))` | 角色状态 |
| `create_time` | `timestamp with time zone` | `DEFAULT NOW()` | 创建时间 |
| `update_time` | `timestamp with time zone` | `DEFAULT NOW()` | 更新时间 |

### 1.3 调研表单表 (`survey_forms`)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | 表单ID |
| `name` | `varchar(200)` | `NOT NULL` | 表单名称 |
| `customer_name` | `varchar(200)` | `NOT NULL` | 客户名称 |
| `project_name` | `varchar(200)` | `NOT NULL` | 项目名称 |
| `industry` | `varchar(100)` | `NOT NULL` | 所属行业 |
| `region` | `varchar(100)` | `NOT NULL` | 所属区域 |
| `template_id` | `uuid` | `REFERENCES survey_templates(id)` | 模板ID |
| `status` | `varchar(20)` | `NOT NULL CHECK (status IN ('草稿', '填写中', '已完成'))` | 表单状态 |
| `report_status` | `varchar(20)` | `NOT NULL CHECK (report_status IN ('未生成', '已生成'))` | 报告状态 |
| `creator_id` | `uuid` | `REFERENCES users(id)` | 创建人ID |
| `submitter_id` | `uuid` | `REFERENCES users(id)` | 提交人ID |
| `pre_sales_responsible_id` | `uuid` | `REFERENCES users(id)` | 售前负责人ID |
| `data` | `jsonb` | `DEFAULT '{}'::jsonb` | 表单数据 |
| `create_time` | `timestamp with time zone` | `DEFAULT NOW()` | 创建时间 |
| `update_time` | `timestamp with time zone` | `DEFAULT NOW()` | 更新时间 |

### 1.4 调研报告表 (`survey_reports`)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | 报告ID |
| `form_id` | `uuid` | `REFERENCES survey_forms(id) UNIQUE` | 关联表单ID |
| `content` | `text` | `NOT NULL` | 报告内容 |
| `generate_time` | `timestamp with time zone` | `DEFAULT NOW()` | 生成时间 |

### 1.5 调研模板表 (`survey_templates`)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | 模板ID |
| `name` | `varchar(100)` | `UNIQUE NOT NULL` | 模板名称 |
| `industry` | `varchar(100)` | `NOT NULL` | 适用行业 |
| `sections` | `jsonb` | `NOT NULL` | 模板 sections 配置 |
| `create_time` | `timestamp with time zone` | `DEFAULT NOW()` | 创建时间 |
| `update_time` | `timestamp with time zone` | `DEFAULT NOW()` | 更新时间 |

### 1.6 字典类型表 (`dict_types`)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `type_id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | 类型ID |
| `type_name` | `varchar(100)` | `NOT NULL` | 类型名称 |
| `type_code` | `varchar(50)` | `UNIQUE NOT NULL` | 类型编码 |
| `description` | `text` | | 类型描述 |
| `status` | `varchar(20)` | `NOT NULL CHECK (status IN ('enabled', 'disabled'))` | 状态 |
| `sort_order` | `integer` | `DEFAULT 0` | 排序顺序 |
| `create_time` | `timestamp with time zone` | `DEFAULT NOW()` | 创建时间 |
| `creator_id` | `uuid` | `REFERENCES users(id)` | 创建人ID |

### 1.7 字典项表 (`dict_items`)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `item_id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | 项ID |
| `type_id` | `uuid` | `REFERENCES dict_types(type_id)` | 类型ID |
| `item_label` | `varchar(100)` | `NOT NULL` | 显示标签 |
| `item_value` | `varchar(100)` | `NOT NULL` | 实际值 |
| `sort_order` | `integer` | `DEFAULT 0` | 排序顺序 |
| `status` | `varchar(20)` | `NOT NULL CHECK (status IN ('enabled', 'disabled'))` | 状态 |
| `ext1` | `varchar(100)` | | 扩展字段1 |
| `ext2` | `varchar(100)` | | 扩展字段2 |
| `create_time` | `timestamp with time zone` | `DEFAULT NOW()` | 创建时间 |
| `creator_id` | `uuid` | `REFERENCES users(id)` | 创建人ID |

### 1.8 区域字典表 (`region_dicts`)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `region_id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | 区域ID |
| `region_name` | `varchar(100)` | `NOT NULL` | 区域名称 |
| `region_code` | `varchar(50)` | `UNIQUE NOT NULL` | 区域编码 |
| `parent_id` | `uuid` | `REFERENCES region_dicts(region_id)` | 父区域ID |
| `region_level` | `integer` | `NOT NULL` | 区域级别 |
| `sort_order` | `integer` | `DEFAULT 0` | 排序顺序 |
| `status` | `varchar(20)` | `NOT NULL CHECK (status IN ('enabled', 'disabled'))` | 状态 |
| `is_system` | `boolean` | `DEFAULT false` | 是否系统内置 |
| `create_time` | `timestamp with time zone` | `DEFAULT NOW()` | 创建时间 |

### 1.9 产品能力表 (`product_capabilities`)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | 能力ID |
| `name` | `varchar(100)` | `UNIQUE NOT NULL` | 能力名称 |
| `type` | `varchar(20)` | `NOT NULL CHECK (type IN ('软件', '硬件', '咨询'))` | 产品类型 |
| `industries` | `jsonb` | `DEFAULT '[]'::jsonb` | 适用行业 |
| `scenarios` | `jsonb` | `DEFAULT '[]'::jsonb` | 适用场景 |
| `description` | `text` | `NOT NULL` | 能力描述 |
| `create_time` | `timestamp with time zone` | `DEFAULT NOW()` | 创建时间 |

### 1.10 系统日志表 (`system_logs`)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | 日志ID |
| `operator_id` | `uuid` | `REFERENCES users(id)` | 操作人ID |
| `type` | `varchar(20)` | `NOT NULL CHECK (type IN ('login', 'survey', 'user', 'system'))` | 日志类型 |
| `content` | `text` | `NOT NULL` | 日志内容 |
| `ip_address` | `varchar(50)` | | IP地址 |
| `result` | `varchar(20)` | `NOT NULL CHECK (result IN ('成功', '失败'))` | 操作结果 |
| `create_time` | `timestamp with time zone` | `DEFAULT NOW()` | 日志时间 |

### 1.11 消息表 (`messages`)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | 消息ID |
| `title` | `varchar(100)` | `NOT NULL` | 消息标题 |
| `content` | `text` | `NOT NULL` | 消息内容 |
| `type` | `varchar(20)` | `NOT NULL CHECK (type IN ('system', 'report'))` | 消息类型 |
| `read` | `boolean` | `DEFAULT false` | 是否已读 |
| `cleared` | `boolean` | `DEFAULT false` | 是否已清除 |
| `target_role_id` | `uuid` | `REFERENCES roles(id)` | 目标角色ID |
| `target_user_id` | `uuid` | `REFERENCES users(id)` | 目标用户ID |
| `project_id` | `uuid` | `REFERENCES survey_forms(id)` | 关联项目ID |
| `create_time` | `timestamp with time zone` | `DEFAULT NOW()` | 创建时间 |

## 2. 索引设计

### 2.1 用户表索引
- `CREATE INDEX idx_users_username ON users(username);`
- `CREATE INDEX idx_users_type ON users(type);`
- `CREATE INDEX idx_users_status ON users(status);`

### 2.2 调研表单索引
- `CREATE INDEX idx_survey_forms_status ON survey_forms(status);`
- `CREATE INDEX idx_survey_forms_creator_id ON survey_forms(creator_id);`
- `CREATE INDEX idx_survey_forms_customer_name ON survey_forms(customer_name);`
- `CREATE INDEX idx_survey_forms_project_name ON survey_forms(project_name);`

### 2.3 字典表索引
- `CREATE INDEX idx_dict_items_type_id ON dict_items(type_id);`
- `CREATE INDEX idx_region_dicts_parent_id ON region_dicts(parent_id);`

### 2.4 日志表索引
- `CREATE INDEX idx_system_logs_operator_id ON system_logs(operator_id);`
- `CREATE INDEX idx_system_logs_type ON system_logs(type);`
- `CREATE INDEX idx_system_logs_create_time ON system_logs(create_time);`

### 2.5 消息表索引
- `CREATE INDEX idx_messages_target_user_id ON messages(target_user_id);`
- `CREATE INDEX idx_messages_target_role_id ON messages(target_role_id);`
- `CREATE INDEX idx_messages_read ON messages(read);`

## 3. 外键关系

| 外键字段 | 引用表 | 引用字段 | 约束 |
|---------|-------|---------|------|
| `users.role_id` | `roles` | `id` | `ON DELETE SET NULL` |
| `survey_forms.template_id` | `survey_templates` | `id` | `ON DELETE SET NULL` |
| `survey_forms.creator_id` | `users` | `id` | `ON DELETE SET NULL` |
| `survey_forms.submitter_id` | `users` | `id` | `ON DELETE SET NULL` |
| `survey_forms.pre_sales_responsible_id` | `users` | `id` | `ON DELETE SET NULL` |
| `survey_reports.form_id` | `survey_forms` | `id` | `ON DELETE CASCADE` |
| `dict_items.type_id` | `dict_types` | `type_id` | `ON DELETE CASCADE` |
| `dict_types.creator_id` | `users` | `id` | `ON DELETE SET NULL` |
| `region_dicts.parent_id` | `region_dicts` | `region_id` | `ON DELETE SET NULL` |
| `system_logs.operator_id` | `users` | `id` | `ON DELETE SET NULL` |
| `messages.target_role_id` | `roles` | `id` | `ON DELETE SET NULL` |
| `messages.target_user_id` | `users` | `id` | `ON DELETE SET NULL` |
| `messages.project_id` | `survey_forms` | `id` | `ON DELETE SET NULL` |

## 4. 数据库初始化脚本

### 4.1 创建扩展

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 4.2 创建表

```sql
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

-- 创建索引
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
```

### 4.3 初始化数据

```sql
-- 插入默认角色
INSERT INTO roles (name, description, permissions, status) VALUES
('超级管理员', '系统最高权限', '{"users": true, "roles": true, "surveys": true, "templates": true, "dictionaries": true, "reports": true, "logs": true, "messages": true}', 'enabled'),
('售前工程师', '售前调研管理权限', '{"surveys": true, "reports": true, "messages": true}', 'enabled'),
('客户用户', '客户填写权限', '{"surveys": true, "messages": true}', 'enabled');

-- 插入默认模板
INSERT INTO survey_templates (name, industry, sections) VALUES
('通用制造业调研模板', '制造业', '[{"id": "section1", "title": "企业基本信息", "fields": [{"id": "company_name", "label": "企业名称", "type": "text", "required": true}, {"id": "company_size", "label": "企业规模", "type": "select", "options": ["小型", "中型", "大型"], "required": true}]}]'),
('能源行业调研模板', '能源', '[{"id": "section1", "title": "能源使用情况", "fields": [{"id": "energy_type", "label": "主要能源类型", "type": "multiselect", "options": ["电力", "天然气", "煤炭", "可再生能源"], "required": true}]}]');

-- 插入默认字典类型
INSERT INTO dict_types (type_name, type_code, description, status) VALUES
('行业类型', 'industry', '企业所属行业', 'enabled'),
('区域类型', 'region', '地理区域', 'enabled');

-- 插入默认字典项
INSERT INTO dict_items (type_id, item_label, item_value, status) VALUES
((SELECT type_id FROM dict_types WHERE type_code = 'industry'), '制造业', 'manufacturing', 'enabled'),
((SELECT type_id FROM dict_types WHERE type_code = 'industry'), '能源', 'energy', 'enabled'),
((SELECT type_id FROM dict_types WHERE type_code = 'industry'), '建筑', 'construction', 'enabled'),
((SELECT type_id FROM dict_types WHERE type_code = 'industry'), '交通', 'transportation', 'enabled');

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
```
