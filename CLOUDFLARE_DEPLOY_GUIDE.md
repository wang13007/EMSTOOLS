# Cloudflare Pages 部署指南

## 项目状态

- ✅ 代码已推送到 GitHub：https://github.com/wang13007/EMSTOOLS.git
- ✅ 项目已成功构建，生成了 dist 目录
- ✅ 依赖项已正确配置

## 部署方式

### 方式一：通过 Cloudflare 控制台手动部署（推荐）

1. **登录 Cloudflare 控制台**
   - 访问 https://dash.cloudflare.com/
   - 使用您的 Cloudflare 账号登录

2. **创建 Pages 项目**
   - 在左侧导航栏中选择 "Pages"
   - 点击 "Create a project"

3. **选择 GitHub 仓库**
   - 选择 "Connect to Git"
   - 选择 GitHub 作为代码源
   - 授权 Cloudflare 访问您的 GitHub 账号
   - 从仓库列表中选择 `wang13007/EMSTOOLS`

4. **配置构建参数**
   - **Project name**: 保留默认值或自定义
   - **Production branch**: `master`
   - **Framework preset**: 选择 `React`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: 留空（使用默认值）

5. **配置环境变量**
   - 点击 "Environment variables (advanced)"
   - 添加以下环境变量：
     - **VITE_SUPABASE_URL**: `https://hjehaiqxsekuiwwevpsi.supabase.co`
     - **VITE_SUPABASE_ANON_KEY**: `sb_publishable_uMjNKMcl2FYKnYz52bBqAw_24x8ootw`

6. **开始部署**
   - 点击 "Save and Deploy"
   - 等待部署完成（通常需要 1-3 分钟）

7. **访问部署的网站**
   - 部署完成后，Cloudflare 会提供一个唯一的 URL
   - 类似于：`https://emstools.pages.dev`

### 方式二：使用 Cloudflare CLI 自动部署

如果您安装了 Cloudflare CLI (`wrangler`)，可以使用以下命令部署：

```bash
# 登录 Cloudflare
wrangler login

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name emstools
```

## 部署前检查

### 1. 确认构建状态

```bash
# 检查构建目录是否存在
ls -la dist

# 重新构建（如果需要）
npm run build
```

### 2. 确认环境变量配置

检查 `.env` 文件中的环境变量配置：

```bash
cat .env
```

确保包含以下内容：

```
VITE_SUPABASE_URL=https://hjehaiqxsekuiwwevpsi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_uMjNKMcl2FYKnYz52bBqAw_24x8ootw
```

### 3. 确认 GitHub 仓库状态

```bash
# 检查远程仓库配置
git remote -v

# 确认代码已推送到 GitHub
git log --oneline -n 5
```

## 常见问题解决

### 1. 部署失败 - 构建错误

- **原因**：依赖项安装失败或构建命令执行失败
- **解决方法**：
  - 确保 `package.json` 中的依赖项配置正确
  - 在本地运行 `npm install` 和 `npm run build` 确保构建成功
  - 检查 Cloudflare 构建日志中的详细错误信息

### 2. 部署成功但网站无法访问

- **原因**：环境变量配置错误或 Supabase 连接问题
- **解决方法**：
  - 检查 Cloudflare Pages 项目中的环境变量配置
  - 确认 Supabase 项目的 API URL 和密钥正确
  - 检查浏览器控制台中的错误信息

### 3. Supabase 数据库连接问题

- **原因**：Row Level Security (RLS) 策略配置错误
- **解决方法**：
  1. 登录 Supabase 控制台
  2. 进入 SQL Editor
  3. 执行以下 SQL 命令：

```sql
-- 修复 roles 表的 RLS 策略
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY 'Allow all access to roles' ON roles FOR ALL USING (true);

-- 修复 users 表的 RLS 策略
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY 'Allow all access to users' ON users FOR ALL USING (true);

-- 修复 surveys 表的 RLS 策略
ALTER TABLE surveys DISABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY 'Allow all access to surveys' ON surveys FOR ALL USING (true);

-- 修复 templates 表的 RLS 策略
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY 'Allow all access to templates' ON templates FOR ALL USING (true);

-- 修复 dictionaries 表的 RLS 策略
ALTER TABLE dictionaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE dictionaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY 'Allow all access to dictionaries' ON dictionaries FOR ALL USING (true);

-- 修复 logs 表的 RLS 策略
ALTER TABLE logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY 'Allow all access to logs' ON logs FOR ALL USING (true);

-- 修复 messages 表的 RLS 策略
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY 'Allow all access to messages' ON messages FOR ALL USING (true);
```

## 部署后验证

部署完成后，验证以下功能：

1. **网站访问**：确认网站可以正常加载
2. **Supabase 连接**：确认可以连接到 Supabase 数据库
3. **用户管理**：尝试创建、编辑和删除用户
4. **调研表单**：尝试创建和管理调研表单
5. **角色管理**：尝试创建和管理角色

## 技术支持

如果遇到部署问题，请参考以下资源：

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Supabase 文档](https://supabase.com/docs)
- [React 文档](https://react.dev/docs)

## 部署状态

- ✅ 代码已准备就绪
- ✅ 项目已成功构建
- ✅ GitHub 仓库已配置
- ✅ 部署指南已准备完成

现在您可以按照上述步骤将项目部署到 Cloudflare Pages。
