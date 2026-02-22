# 设置执行策略
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# 定义Git路径
$gitPath = "C:\Program Files\Git\cmd\git.exe"

# 切换到项目目录
Set-Location "E:\EMSTools\ems-售前调研工具"

Write-Host "当前目录: $((Get-Location).Path)" -ForegroundColor Green
Write-Host

# 检查Git是否存在
if (-not (Test-Path $gitPath)) {
    Write-Host "Git未找到，请先安装Git" -ForegroundColor Red
    Read-Host "按Enter键退出..."
    exit 1
}

Write-Host "Git路径: $gitPath" -ForegroundColor Green
Write-Host

# 检查是否已经是Git仓库
if (-not (Test-Path ".git")) {
    Write-Host "初始化Git仓库..." -ForegroundColor Cyan
    & $gitPath init
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
& $gitPath add .
Write-Host

# 提交更改
Write-Host "提交更改..." -ForegroundColor Cyan
& $gitPath commit -m "Initial commit"
Write-Host

# 移除现有远程仓库
Write-Host "移除现有远程仓库..." -ForegroundColor Cyan
try {
    & $gitPath remote remove origin
} catch {}
Write-Host

# 添加远程仓库
Write-Host "添加远程仓库..." -ForegroundColor Cyan
& $gitPath remote add origin https://github.com/wang13007/EMSTOOLS.git
Write-Host

# 推送代码
Write-Host "推送代码到GitHub..." -ForegroundColor Cyan
Write-Host

# 执行推送操作
& $gitPath push -u origin master --force

# 检查推送结果
if ($LASTEXITCODE -eq 0) {
    Write-Host
    Write-Host "推送成功！" -ForegroundColor Green
    Write-Host "请访问 https://github.com/wang13007/EMSTOOLS.git 查看仓库" -ForegroundColor Green
} else {
    Write-Host
    Write-Host "推送失败，请检查网络连接和GitHub仓库权限" -ForegroundColor Red
}

Write-Host
Write-Host "操作完成，按Enter键退出..." -ForegroundColor Yellow
Read-Host
