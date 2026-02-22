# 切换到项目目录
Set-Location "E:\EMSTools\ems-售前调研工具"

Write-Host "当前目录: $((Get-Location).Path)" -ForegroundColor Green
Write-Host

# 检查Git是否安装
try {
    $gitVersion = git --version
    Write-Host "Git版本: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git未安装，请先安装Git" -ForegroundColor Red
    Read-Host "按Enter键退出..."
    exit 1
}

Write-Host

# 检查是否已经是Git仓库
if (-not (Test-Path ".git")) {
    Write-Host "初始化Git仓库..." -ForegroundColor Cyan
    git init
    Write-Host
}

# 检查.gitignore文件
if (-not (Test-Path ".gitignore")) {
    Write-Host "创建.gitignore文件..." -ForegroundColor Cyan
    "node_modules/" | Out-File -FilePath ".gitignore" -Encoding UTF8
    "dist/" | Out-File -FilePath ".gitignore" -Encoding UTF8 -Append
    ".env.local" | Out-File -FilePath ".gitignore" -Encoding UTF8 -Append
    "*.log" | Out-File -FilePath ".gitignore" -Encoding UTF8 -Append
    Write-Host
}

# 添加所有文件
Write-Host "添加所有文件..." -ForegroundColor Cyan
git add .
Write-Host

# 提交更改
Write-Host "提交更改..." -ForegroundColor Cyan
git commit -m "Initial commit" --allow-empty
Write-Host

# 添加远程仓库
Write-Host "添加远程仓库..." -ForegroundColor Cyan
try {
    git remote remove origin
} catch {}
git remote add origin https://github.com/wang13007/EMSTOOLS.git
Write-Host

# 推送代码
Write-Host "推送代码到GitHub..." -ForegroundColor Cyan
try {
    git push -u origin master --force
    Write-Host
    Write-Host "推送成功！" -ForegroundColor Green
    Write-Host "请访问 https://github.com/wang13007/EMSTOOLS.git 查看仓库" -ForegroundColor Green
} catch {
    Write-Host
    Write-Host "推送失败，请检查网络连接和GitHub仓库权限" -ForegroundColor Red
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host
Write-Host "操作完成，按Enter键退出..." -ForegroundColor Yellow
Read-Host
