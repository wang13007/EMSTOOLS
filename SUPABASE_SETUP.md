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
3. （生产审计加固）`supabase-audit-hardening.sql`，用于补齐审计哈希链字段与索引

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
- 日志页中新增记录的来源为 `edge-function`，完整性列显示哈希前缀

## 5. RLS 说明

`supabase-init.sql` 已启用 RLS 并创建基础策略（authenticated 全放行）。

上线建议：

1. 按角色细化策略
2. 对外部用户限制数据范围
3. 将高权限写入迁移至服务端

## 6. 审计 Edge Function

生产环境建议部署 `audit-log` Edge Function，由服务端写入 `system_logs`：

```bash
supabase functions deploy audit-log
```

需要在 Supabase Edge Functions Secrets 中配置：

```env
SUPABASE_URL="https://<your-project>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<server-only-service-role-key>"
AUDIT_LOG_HMAC_SECRET="<32+ bytes random secret>"
AUDIT_ALLOWED_ORIGINS="https://<your-production-domain>"
```

前端生产环境建议增加：

```env
VITE_AUDIT_LOG_STRICT=true
```

开启严格模式后，Edge Function 不可用时不会降级为浏览器直写日志。当前项目仍使用自定义 localStorage 会话，`operator_id` 由前端上报；若要强身份审计，需要把登录态迁移到 Supabase Auth 或后端会话。

## 7. 常见问题

### 7.1 查询失败 / 权限报错

- 检查表结构是否与脚本一致
- 检查 RLS policy 是否被误删
- 检查当前 key 是否正确

### 7.2 UUID 类型错误

执行 `supabase-repair-existing.sql` 修复历史字符串字段。

### 7.3 调研状态显示异常

确认 `survey_forms.status` 和 `report_status` 保留脚本定义的兼容取值。

### 7.4 日志仍显示未加固

- 确认已执行 `supabase-audit-hardening.sql`
- 确认 `audit-log` Edge Function 已部署
- 确认 `AUDIT_LOG_HMAC_SECRET` 已配置
- 若前端未启用 `VITE_AUDIT_LOG_STRICT=true`，函数失败时会降级为浏览器直写，来源会显示 `browser-fallback`
