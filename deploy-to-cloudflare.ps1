# Cloudflare Pages 部署脚本
Write-Host "开始部署到 Cloudflare Pages..." -ForegroundColor Green

# 检查构建目录
if (-Not (Test-Path ".\dist")) {
    Write-Host "构建目录不存在，开始构建项目..." -ForegroundColor Yellow
    npm run build
    
    if (-Not (Test-Path ".\dist")) {
        Write-Host "构建失败，无法找到 dist 目录" -ForegroundColor Red
        exit 1
    }
}

Write-Host "构建目录检查完成" -ForegroundColor Green

# 显示部署步骤
Write-Host "
部署步骤：" -ForegroundColor Cyan
Write-Host "1. 登录 Cloudflare 控制台"
Write-Host "2. 选择 Pages -> Create a project"
Write-Host "3. 选择 GitHub 仓库：wang13007/EMSTOOLS"
Write-Host "4. 配置构建参数："
Write-Host "   - Framework preset: React"
Write-Host "   - Build command: npm run build"
Write-Host "   - Build output directory: dist"
Write-Host "5. 配置环境变量："
Write-Host "   - VITE_SUPABASE_URL: https://hjehaiqxsekuiwwevpsi.supabase.co"
Write-Host "   - VITE_SUPABASE_ANON_KEY: sb_publishable_uMjNKMcl2FYKnYz52bBqAw_24x8ootw"
Write-Host "6. 点击 Save and Deploy 开始部署"

# 显示数据库修复步骤
Write-Host "
数据库修复步骤：" -ForegroundColor Cyan
Write-Host "1. 登录 Supabase 控制台"
Write-Host "2. 进入 SQL Editor"
Write-Host "3. 执行以下 SQL 命令来修复 RLS 策略："
Write-Host "   ALTER TABLE roles DISABLE ROW LEVEL SECURITY;"
Write-Host "   ALTER TABLE roles ENABLE ROW LEVEL SECURITY;"
Write-Host "   CREATE POLICY 'Allow all access to roles' ON roles FOR ALL USING (true);"
Write-Host "4. 对其他表执行类似操作，确保 RLS 策略不会导致无限递归"

Write-Host "
部署准备完成，请按照上述步骤在 Cloudflare 和 Supabase 控制台中完成部署和配置。" -ForegroundColor Green
Write-Host "
按 Enter 键退出..." -ForegroundColor Yellow
Read-Host
