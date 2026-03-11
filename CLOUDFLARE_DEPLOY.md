# Cloudflare Pages 部署（简版）

## 1. 部署前检查

- 代码已提交到 Git（`master` 或目标分支）
- 本地可执行：

```bash
npm install
npm run build
```

- 已准备环境变量：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `GEMINI_API_KEY`（可选）

## 2. Cloudflare 配置

在 Cloudflare Pages 新建项目并连接仓库，构建参数：

- Framework preset: `React`
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 建议 `18+`

## 3. 环境变量

在 Pages 项目设置中添加：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`（可选）

## 4. 路由与缓存

当前项目使用 HashRouter（`#/path`），静态托管无需额外 rewrite。

仓库包含 `public/_headers`，部署后应确保被正确发布，以启用缓存控制策略。

## 5. 验证

部署完成后验证：

1. 登录与注册页面可访问
2. 调研列表可加载
3. 调研填报与提交可用
4. 报告详情可打开
5. 消息中心未读数可更新
