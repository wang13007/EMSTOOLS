# Cloudflare Pages 部署指南（详细版）

## 1. 目标

将当前前端项目稳定部署到 Cloudflare Pages，并保证与 Supabase 正常联通。

## 2. 项目关键配置（与代码一致）

- 构建工具：Vite
- 构建命令：`npm run build`
- 产物目录：`dist`
- 路由模式：HashRouter
- `vite.config.ts`：`base: './'`，适配静态托管

## 3. 首次部署流程

### 3.1 连接仓库

1. 登录 Cloudflare Dashboard
2. 进入 Pages -> Create project
3. 选择并授权 Git 仓库
4. 选择部署分支（建议 `master`）

### 3.2 构建参数

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: 留空（仓库根目录）

### 3.3 环境变量

至少配置：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

可选：

- `GEMINI_API_KEY`

## 4. 发布后验证清单

- 首页看板加载正常
- 调研模块 CRUD 正常
- 报告生成与查看正常
- 用户/角色/字典模块可用
- 消息中心与日志管理正常

## 5. 持续部署

Cloudflare 会在分支更新后自动重新构建。

建议：

1. 先在本地执行 `npm run lint`、`npm run build`
2. 再推送到主分支触发部署

## 6. 常见故障处理

### 6.1 构建失败

- 检查 Node 版本（18+）
- 检查 `package-lock.json` 与依赖一致性
- 查看构建日志定位失败包

### 6.2 页面空白或接口失败

- 检查 Pages 环境变量是否存在
- 检查 Supabase URL/Key 是否对应同一项目
- 浏览器控制台查看网络错误

### 6.3 权限异常

- 检查 Supabase RLS policy
- 检查所用 key 权限级别

## 7. 安全建议

- 不在前端公开 service role key
- 生产环境使用最小权限 key
- 定期轮换密钥并更新 Pages 环境变量
