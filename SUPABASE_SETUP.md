# Supabase 配置指南（同步当前代码）

## 1. 创建 Supabase 项目

1. 登录 https://supabase.com
2. 创建项目并记录：
   - Project URL
   - Anon key
   - （可选）Service role key

## 2. 环境变量

在项目根目录创建 `.env.local`：

```env
VITE_SUPABASE_URL="https://<your-project>.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-anon-key>"
GEMINI_API_KEY="<optional>"
```

说明：

- 前端只允许使用 anon/publishable key。
- 不要在浏览器端配置或打包 service role key；高权限操作应放在后端或 Supabase Edge Functions。

## 3. 初始化数据库

在 Supabase SQL Editor 执行：

1. `supabase-init.sql`
2. （可选）`supabase-repair-existing.sql`，用于旧库修复

## 4. 验证点

执行后至少确认以下表存在：

- `users`
- `roles`
- `survey_forms`
- `survey_templates`
- `survey_reports`
- `dict_types`
- `dict_items`
- `product_capabilities`
- `system_logs`
- `messages`

并验证：

- 能正常登录
- 能新建调研
- 能保存/提交调研
- 能读取消息与日志

## 5. RLS 说明

`supabase-init.sql` 已启用 RLS 并创建基础策略（authenticated 全放行）。

上线建议：

1. 按角色细化策略
2. 对外部用户限制数据范围
3. 将高权限写入迁移至服务端

## 6. 常见问题

### 6.1 查询失败 / 权限报错

- 检查表结构是否与脚本一致
- 检查 RLS policy 是否被误删
- 检查当前 key 是否正确

### 6.2 UUID 类型错误

执行 `supabase-repair-existing.sql` 修复历史字符串字段。

### 6.3 调研状态显示异常

确认 `survey_forms.status` 和 `report_status` 保留脚本定义的兼容取值。
