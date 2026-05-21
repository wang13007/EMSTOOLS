# 数据库设计（基于 [`supabase-init.sql`](../../supabase/sql/supabase-init.sql)）

更新时间：2026-03-11

## 1. 设计说明

| 项目 | 内容 |
| --- | --- |
| 数据库 | Supabase PostgreSQL |
| 结构来源 | [`supabase-init.sql`](../../supabase/sql/supabase-init.sql)（并兼容 [`supabase-repair-existing.sql`](../../supabase/sql/supabase-repair-existing.sql)） |
| 兼容策略 | 兼容历史字段、历史状态值、中英文字段差异 |
| 安全策略 | 主要业务表已启用 RLS（Authenticated 基础策略） |

## 2. 主要数据表（字段级）

### 2.1 `roles`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | 角色主键 |
| `name` | `varchar(50)` | NOT NULL, UNIQUE | 角色名称 |
| `description` | `text` | NULL | 角色描述 |
| `permissions` | `jsonb` | NOT NULL, DEFAULT `'{}'::jsonb` | 权限矩阵 |
| `type` | `varchar(20)` | NOT NULL, CHECK(`internal`,`external`) | 角色类型 |
| `user_type` | `varchar(20)` | NOT NULL, CHECK(`internal`,`external`) | 兼容字段 |
| `status` | `varchar(20)` | NOT NULL, DEFAULT `enabled`, CHECK(`enabled`,`disabled`) | 状态 |
| `create_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 创建时间 |
| `update_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 更新时间 |

### 2.2 `users`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | 用户主键 |
| `user_id` | `uuid` | NOT NULL, DEFAULT `gen_random_uuid()` | 业务用户ID（兼容） |
| `username` | `varchar(50)` | NULL | 登录名 |
| `user_name` | `varchar(50)` | NULL | 显示名/兼容字段 |
| `user_realname` | `varchar(100)` | NULL | 真实姓名（兼容） |
| `name` | `varchar(100)` | NULL | 姓名 |
| `password_hash` | `varchar(255)` | NOT NULL | 密码摘要字段；新写入使用 `sha256:<digest>`，历史明文记录需迁移 |
| `type` | `varchar(20)` | NOT NULL, DEFAULT `external`, CHECK(`internal`,`external`) | 用户类型 |
| `user_type` | `varchar(20)` | NOT NULL, DEFAULT `external`, CHECK(`internal`,`external`) | 兼容类型字段 |
| `role_id` | `uuid` | FK -> `roles.id`, NULL | 主角色 |
| `role_ids` | `uuid[]` | NOT NULL, DEFAULT `'{}'::uuid[]` | 多角色 |
| `phone` | `varchar(20)` | NULL | 手机号 |
| `email` | `varchar(100)` | NULL | 邮箱 |
| `status` | `varchar(20)` | NOT NULL, DEFAULT `enabled`, CHECK(`enabled`,`disabled`) | 账号状态 |
| `last_login_time` | `timestamptz` | NULL | 最近登录时间 |
| `creator` | `varchar(100)` | NULL | 创建者 |
| `create_by` | `varchar(100)` | NULL | 兼容创建者字段 |
| `is_deleted` | `boolean` | NOT NULL, DEFAULT `false` | 软删除标记 |
| `create_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 创建时间 |
| `update_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 更新时间 |

### 2.3 `survey_templates`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | 模板ID |
| `name` | `varchar(100)` | NOT NULL, UNIQUE | 模板名 |
| `industry` | `varchar(100)` | NOT NULL | 行业 |
| `sections` | `jsonb` | NOT NULL, DEFAULT `'[]'::jsonb` | 模板结构 |
| `create_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 创建时间 |
| `update_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 更新时间 |

### 2.4 `survey_forms`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | 表单ID |
| `name` | `varchar(200)` | NOT NULL | 表单名称 |
| `customer_name` | `varchar(200)` | NOT NULL | 客户名称 |
| `project_name` | `varchar(200)` | NOT NULL | 项目名称 |
| `industry` | `varchar(100)` | NOT NULL | 行业 |
| `region` | `varchar(100)` | NOT NULL | 区域 |
| `template_id` | `uuid` | FK -> `survey_templates.id`, NULL | 模板ID |
| `status` | `varchar(20)` | NOT NULL, DEFAULT `draft`, CHECK(`draft`,`in_progress`,`completed` + 中文兼容值) | 调研状态 |
| `report_status` | `varchar(20)` | NOT NULL, DEFAULT `pending`, CHECK(`pending`,`generated` + 中文兼容值) | 报告状态 |
| `creator_id` | `uuid` | FK -> `users.id`, NULL | 创建人 |
| `submitter_id` | `uuid` | FK -> `users.id`, NULL | 提交人 |
| `pre_sales_responsible_id` | `uuid` | FK -> `users.id`, NULL | 售前负责人 |
| `data` | `jsonb` | NOT NULL, DEFAULT `'{}'::jsonb` | 调研结构化数据 |
| `create_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 创建时间 |
| `update_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 更新时间 |

### 2.5 `survey_reports`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | 报告ID |
| `form_id` | `uuid` | NOT NULL, UNIQUE, FK -> `survey_forms.id` | 对应表单ID |
| `content` | `text` | NOT NULL | 报告正文 |
| `generate_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 生成时间 |

### 2.6 `dict_types`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `type_id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | 字典类型ID |
| `type_name` | `varchar(100)` | NOT NULL | 类型名称 |
| `type_code` | `varchar(50)` | NOT NULL, UNIQUE | 类型编码 |
| `description` | `text` | NULL | 描述 |
| `status` | `varchar(20)` | NOT NULL, DEFAULT `enabled`, CHECK(`enabled`,`disabled`) | 状态 |
| `sort_order` | `integer` | NOT NULL, DEFAULT `0` | 排序 |
| `create_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 创建时间 |
| `creator_id` | `uuid` | NULL | 创建者 |

### 2.7 `dict_items`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `item_id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | 字典项ID |
| `type_id` | `uuid` | NOT NULL, FK -> `dict_types.type_id` | 类型ID |
| `item_label` | `varchar(100)` | NOT NULL | 显示值 |
| `item_value` | `varchar(100)` | NOT NULL | 存储值 |
| `sort_order` | `integer` | NOT NULL, DEFAULT `0` | 排序 |
| `status` | `varchar(20)` | NOT NULL, DEFAULT `enabled`, CHECK(`enabled`,`disabled`) | 状态 |
| `ext1` | `varchar(255)` | NULL | 扩展字段1 |
| `ext2` | `varchar(255)` | NULL | 扩展字段2 |
| `create_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 创建时间 |
| `creator_id` | `uuid` | NULL | 创建者 |

### 2.8 `region_dicts`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `region_id` | `varchar(64)` | PK, NOT NULL | 区域ID |
| `region_name` | `varchar(100)` | NOT NULL | 区域名称 |
| `region_code` | `varchar(50)` | NOT NULL, UNIQUE | 区域编码 |
| `parent_id` | `varchar(64)` | NULL | 上级区域ID |
| `region_level` | `integer` | NOT NULL | 层级 |
| `sort_order` | `integer` | NOT NULL, DEFAULT `0` | 排序 |
| `status` | `varchar(20)` | NOT NULL, DEFAULT `enabled` | 状态 |
| `is_system` | `boolean` | NOT NULL, DEFAULT `false` | 是否系统预置 |
| `create_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 创建时间 |

### 2.9 `product_capabilities`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | 能力ID |
| `name` | `varchar(100)` | NOT NULL, UNIQUE | 能力名称 |
| `type` | `varchar(20)` | NOT NULL, DEFAULT `software`, CHECK(`software`,`hardware`,`consulting`,`retrofit_construction`) | 能力类型 |
| `industries` | `jsonb` | NOT NULL, DEFAULT `'[]'::jsonb` | 适用行业 |
| `scenarios` | `jsonb` | NOT NULL, DEFAULT `'[]'::jsonb` | 适用场景 |
| `description` | `text` | NOT NULL, DEFAULT `''` | 描述 |
| `create_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 创建时间 |

### 2.10 `system_logs`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | 日志ID |
| `operator_id` | `uuid` | NULL, FK -> `users.id` | 操作人 |
| `type` | `varchar(20)` | NOT NULL, CHECK(`login`,`survey`,`user`,`system`) | 日志类型 |
| `content` | `text` | NOT NULL | 日志内容 |
| `ip_address` | `varchar(64)` | NULL | IP地址 |
| `result` | `varchar(20)` | NOT NULL, DEFAULT `成功`, CHECK(`成功`,`失败`) | 操作结果 |
| `request_id` | `uuid` | NULL, UNIQUE WHERE NOT NULL | Edge Function 请求ID |
| `user_agent` | `text` | NULL | 服务端采集的 User-Agent |
| `source` | `varchar(40)` | NOT NULL, DEFAULT `browser-fallback` | 日志来源 |
| `metadata` | `jsonb` | NOT NULL, DEFAULT `{}` | 审计扩展元数据 |
| `previous_hash` | `text` | NULL | 前一条加固审计日志哈希 |
| `integrity_hash` | `text` | NULL | 服务端 HMAC-SHA256 完整性哈希 |
| `create_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 创建时间 |

### 2.11 `messages`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, NOT NULL, DEFAULT `gen_random_uuid()` | 消息ID |
| `title` | `varchar(150)` | NOT NULL | 标题 |
| `content` | `text` | NOT NULL | 正文 |
| `type` | `varchar(20)` | NOT NULL, DEFAULT `system`, CHECK(`system`,`report`) | 消息类型 |
| `read` | `boolean` | NOT NULL, DEFAULT `false` | 已读标记 |
| `cleared` | `boolean` | NOT NULL, DEFAULT `false` | 清理标记 |
| `target_role_id` | `uuid` | NULL, FK -> `roles.id` | 目标角色 |
| `target_user_id` | `uuid` | NULL, FK -> `users.id` | 目标用户 |
| `project_id` | `uuid` | NULL, FK -> `survey_forms.id` | 关联项目 |
| `create_time` | `timestamptz` | NOT NULL, DEFAULT `now()` | 创建时间 |

## 3. 外键关系

| 子表.字段 | 父表.字段 | 关系说明 |
| --- | --- | --- |
| `users.role_id` | `roles.id` | 用户主角色 |
| `survey_forms.template_id` | `survey_templates.id` | 表单模板 |
| `survey_forms.creator_id` | `users.id` | 表单创建人 |
| `survey_forms.submitter_id` | `users.id` | 表单提交人 |
| `survey_forms.pre_sales_responsible_id` | `users.id` | 售前负责人 |
| `survey_reports.form_id` | `survey_forms.id` | 一表单一报告 |
| `dict_items.type_id` | `dict_types.type_id` | 字典项从属类型 |
| `messages.target_role_id` | `roles.id` | 角色定向消息 |
| `messages.target_user_id` | `users.id` | 用户定向消息 |
| `messages.project_id` | `survey_forms.id` | 项目关联消息 |
| `system_logs.operator_id` | `users.id` | 日志操作人 |

## 4. 关键约束

| 对象 | 约束 |
| --- | --- |
| `roles.status` / `users.status` / `dict_types.status` / `dict_items.status` | `enabled` / `disabled` |
| `roles.type` / `roles.user_type` / `users.type` / `users.user_type` | `internal` / `external` |
| `survey_forms.status` | `draft` / `in_progress` / `completed`（兼容中文值） |
| `survey_forms.report_status` | `pending` / `generated`（兼容中文值） |
| `product_capabilities.type` | `software` / `hardware` / `consulting` / `retrofit_construction` |
| `system_logs.type` | `login` / `survey` / `user` / `system` |
| `system_logs.result` | `成功` / `失败` |
| `messages.type` | `system` / `report` |
| `survey_reports.form_id` | UNIQUE（一个调研对应一个报告） |

## 5. 索引与唯一性（核心）

| 表 | 索引/唯一项 | 说明 |
| --- | --- | --- |
| `users` | `id`, `user_id` 唯一相关索引 | 兼容双主键语义查询 |
| `users` | `username` / `user_name` 唯一约束（脚本含兼容处理） | 防止账号重复 |
| `roles` | `name` UNIQUE | 角色名唯一 |
| `survey_templates` | `name` UNIQUE | 模板名唯一 |
| `survey_reports` | `form_id` UNIQUE | 一表单一报告 |
| `dict_types` | `type_code` UNIQUE | 类型编码唯一 |
| `region_dicts` | `region_code` UNIQUE | 区域编码唯一 |
| `product_capabilities` | `name` UNIQUE | 能力名唯一 |

## 6. RLS 策略

| 项目 | 当前实现 |
| --- | --- |
| 启用范围 | `roles`, `users`, `survey_forms`, `survey_reports`, `dict_types`, `dict_items`, `region_dicts`, `product_capabilities`, `system_logs`, `messages` |
| 基础策略 | 以 `auth.role() = 'authenticated'` 作为访问门槛 |
| 风险提示 | 当前为基础放行策略，生产建议按角色与数据归属细分 |

## 7. 种子数据

| 类别 | 内容 |
| --- | --- |
| 预置角色 | 超级管理员、售前工程师、外部客户等角色 |
| 管理员账号 | 若不存在则创建默认管理员记录 |
| 字典数据 | 初始化字典类型与字典项 |

## 8. 升级与修复

| 场景 | 脚本 | 作用 |
| --- | --- | --- |
| 新环境部署 | [`supabase-init.sql`](../../supabase/sql/supabase-init.sql) | 一次性建表、约束、RLS、种子数据 |
| 老环境修复 | [`supabase-repair-existing.sql`](../../supabase/sql/supabase-repair-existing.sql) | 历史字段修复、UUID转型、外键重建、脏数据清理、索引补齐 |
