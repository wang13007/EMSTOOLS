# 技术方案（当前代码同步）

## 1. 架构概览

当前仓库为单体前端应用：

- 前端：React + TypeScript + Vite
- 路由：HashRouter（适配静态托管）
- 数据层：Supabase JS 直连 PostgreSQL
- AI：`@google/genai`（Gemini）

不包含独立 Node/Nest 服务。

## 2. 代码结构

```text
App.tsx                    # 路由入口与鉴权路由
components/Layout.tsx      # 主框架、菜单、消息预览、用户菜单
pages/*                    # 各业务页面
src/services/authService.ts
src/services/supabaseService.ts
services/geminiService.ts
services/reportService.ts
src/config/supabase.ts
supabase-init.sql
supabase-repair-existing.sql
```

## 3. 核心模块

### 3.1 鉴权模块（authService）

- 登录：按用户名查 `users`，校验密码后写入 `localStorage`
- 注册：创建外部用户并写入本地 token
- Token：本地模拟 token（`ems_<timestamp>_<uuid>`）
- 会话：`ems_user` + `ems_token`

### 3.2 数据服务模块（supabaseService）

封装服务：

- `userService`
- `roleService`
- `surveyService`
- `templateService`
- `dictService`
- `logService`
- `messageService`

主要能力：

- 对旧库字段进行兼容（`type/user_type`、`id/user_id` 等）
- 状态中英文映射（草稿/填写中/已完成 与 draft/in_progress/completed）
- 外部用户访问调研数据时做二次权限过滤

### 3.3 报告模块

- `services/geminiService.ts`
  - 负责调用 Gemini，返回结构化报告 JSON
  - API 不可用时自动降级为兜底报告
- `services/reportService.ts`
  - 将 AI 报告与模板渲染合并为 `ReportBundle`
  - 输出建议、图表数据、能力匹配结果

### 3.4 布局与消息

`components/Layout.tsx` 负责：

- 读取当前用户和角色
- 顶栏消息预览与未读数
- 用户菜单和退出登录
- 菜单折叠与高亮

## 4. 路由与访问控制

`App.tsx` 采用 `ProtectedRoute` + `PublicRoute`：

- 未登录统一跳转 `/login`
- 已登录访问 `/login` / `/register` 时跳转首页
- 外部用户仅允许授权路径访问

## 5. 环境与构建

- `vite.config.ts`
  - `base: './'`
  - `server.port: 5173`
  - `build.manifest: true`
- npm scripts：
  - `dev`
  - `build`
  - `preview`
  - `lint`（`tsc --noEmit`）

## 6. 数据库脚本策略

- `supabase-init.sql`：全量初始化 + 兼容修复 + 索引 + RLS + 种子数据
- `supabase-repair-existing.sql`：历史库修复（字段类型、外键、索引）

## 7. 安全注意事项

- 前端 `src/config/supabase.ts` 只允许使用 anon/publishable key；service role key 必须保留在后端或 Supabase Edge Functions
- 生产建议：
  - 移除内置密钥
  - 仅使用环境变量注入
  - 将高权限写操作收敛到服务端
