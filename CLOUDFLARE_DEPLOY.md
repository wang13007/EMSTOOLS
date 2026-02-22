# Cloudflare Pages 部署指南

本指南将帮助您将 EMS 售前调研工具部署到 Cloudflare Pages，使其可以通过互联网访问。

## 1. 前提条件

- Cloudflare 账号（如果没有，请到 [Cloudflare 官网](https://www.cloudflare.com) 注册）
- 前端项目已推送到 Git 仓库（GitHub、GitLab 或 Bitbucket）
- 项目已成功构建（`npm run build`）
- Supabase 项目已配置完成，并且 `.env.local` 文件已正确设置

## 2. 部署步骤

### 2.1 登录 Cloudflare 控制台

1. 打开浏览器，访问 [Cloudflare 控制台](https://dash.cloudflare.com)
2. 使用您的 Cloudflare 账号登录

### 2.2 创建 Pages 项目

1. 在 Cloudflare 控制台左侧导航栏中，点击 "Pages"
2. 点击 "Create a project" 按钮
3. 选择您的 Git 仓库（GitHub、GitLab 或 Bitbucket）
4. 授权 Cloudflare 访问您的 Git 仓库
5. 选择要部署的仓库和分支（通常是 `main` 或 `master`）

### 2.3 配置构建参数

1. 在 "Build settings" 部分，配置以下参数：
   - **Framework preset**: 选择 "React"
   - **Build command**: 输入 `npm run build`
   - **Build output directory**: 输入 `dist`
   - **Root directory**: 保持默认值（通常为空）

### 2.4 配置环境变量

1. 在 "Environment variables (advanced)" 部分，点击 "Add variable"
2. 添加以下环境变量（与 `.env.local` 文件中的值相同）：
   
   | 变量名 | 值 |
   |-------|-----|
   | `VITE_SUPABASE_URL` | 您的 Supabase 项目 URL |
   | `VITE_SUPABASE_ANON_KEY` | 您的 Supabase 匿名访问密钥 |
   | `VITE_GEMINI_API_KEY` | 您的 Google Gemini API 密钥（可选） |

3. 确保环境变量的作用域设置为 "Build"

### 2.5 开始部署

1. 点击 "Save and Deploy" 按钮
2. Cloudflare Pages 会开始构建和部署您的项目
3. 部署过程中，您可以查看构建日志
4. 部署完成后，Cloudflare 会显示部署成功的消息

### 2.6 访问部署后的网站

1. 部署完成后，Cloudflare 会分配一个默认域名，格式为 `your-project.pages.dev`
2. 点击该域名，即可访问部署后的网站
3. 测试网站的各项功能，确保一切正常

## 3. 配置自定义域名（可选）

如果您想使用自己的域名访问网站，可以按照以下步骤配置：

### 3.1 在 Cloudflare 中添加自定义域名

1. 在 Pages 项目的 "Settings" 选项卡中，点击 "Custom domains"
2. 点击 "Set up a custom domain"
3. 输入您的自定义域名（例如 `ems-tool.your-domain.com`）
4. 点击 "Continue"

### 3.2 配置 DNS 记录

1. Cloudflare 会提示您在域名的 DNS 设置中添加 CNAME 记录
2. 登录您的域名注册商或 DNS 提供商的控制台
3. 添加 CNAME 记录，将您的自定义域名指向 Cloudflare 提供的目标域名
4. 保存 DNS 设置

### 3.3 验证域名

1. 返回 Cloudflare Pages 控制台
2. 点击 "Done" 完成配置
3. Cloudflare 会自动为您的自定义域名配置 SSL 证书
4. 等待几分钟，然后使用您的自定义域名访问网站

## 4. 持续部署

Cloudflare Pages 支持持续部署，当您向 Git 仓库推送新的代码时，它会自动重新构建和部署您的网站。

### 4.1 配置部署触发器

1. 在 Pages 项目的 "Settings" 选项卡中，点击 "Builds & deployments"
2. 确保 "Automatic deployments" 选项已启用
3. 选择要监听的分支（通常是 `main` 或 `master`）

### 4.2 测试持续部署

1. 对您的项目进行一些修改
2. 提交并推送这些修改到 Git 仓库
3. 回到 Cloudflare Pages 控制台，查看构建状态
4. 构建完成后，访问网站，验证修改是否已生效

## 5. 故障排查

### 5.1 构建失败

- 检查构建日志，查看具体的错误信息
- 确保 `package.json` 文件中的依赖项正确
- 确保构建命令 `npm run build` 在本地可以正常执行
- 检查环境变量是否正确设置

### 5.2 部署后网站无法访问

- 检查 Cloudflare Pages 控制台中的部署状态
- 检查 Supabase 项目的状态和配置
- 检查浏览器控制台中的错误信息
- 确保环境变量中的 Supabase URL 和密钥正确

### 5.3 功能无法正常使用

- 检查浏览器控制台中的错误信息
- 确保 Supabase 数据库已正确初始化
- 确保所有必要的环境变量都已设置
- 检查网络连接是否正常

## 6. 最佳实践

- 使用不同的环境变量配置不同的环境（开发、测试、生产）
- 定期备份您的 Supabase 数据库
- 监控网站的访问情况和性能
- 及时更新依赖项，修复安全漏洞
- 启用 Cloudflare 的安全功能，保护网站免受攻击

## 7. 联系支持

如果遇到部署问题，可以通过以下方式获取支持：

- **Cloudflare 支持**：在 Cloudflare 控制台中提交支持工单
- **Supabase 支持**：访问 [Supabase 文档](https://supabase.com/docs) 或提交支持工单
- **技术支持邮箱**：support@ems-tool.com

---

**版本信息**：
- 文档版本：v1.0.0
- 发布日期：2024-05-20
- 最后更新：2024-05-20