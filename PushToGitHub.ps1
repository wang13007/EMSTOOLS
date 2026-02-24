# 设置Git可执行文件路径
$gitExe = "C:\Program Files\Git\bin\git.exe"

# 检查Git是否存在
if (-not (Test-Path $gitExe)) {
    Write-Host "Git可执行文件不存在，请检查路径是否正确" -ForegroundColor Red
    Read-Host "按Enter键退出..."
    exit 1
}

Write-Host "开始将代码推送到GitHub..." -ForegroundColor Green
Write-Host

# 切换到项目目录
Set-Location "e:\EMSTools\ems-售前调研工具"

# 检查当前目录状态
Write-Host "检查当前Git状态..." -ForegroundColor Yellow
& $gitExe status
Write-Host

# 添加所有文件
Write-Host "添加所有文件..." -ForegroundColor Yellow
& $gitExe add .
Write-Host

# 提交更改
Write-Host "提交更改..." -ForegroundColor Yellow
& $gitExe commit -m "更新代码并修复问题" --allow-empty
Write-Host

# 添加远程仓库
Write-Host "添加GitHub远程仓库..." -ForegroundColor Yellow
& $gitExe remote add origin https://github.com/wang13007/EMSTOOLS.git 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "远程仓库已存在，跳过添加步骤" -ForegroundColor Cyan
}
Write-Host

# 推送到GitHub
Write-Host "推送到GitHub..." -ForegroundColor Yellow
& $gitExe push origin master --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "代码推送成功！" -ForegroundColor Green
    Write-Host "您可以在 https://github.com/wang13007/EMSTOOLS.git 查看代码" -ForegroundColor Green
} else {
    Write-Host "代码推送失败，请检查网络连接或GitHub凭据" -ForegroundColor Red
    Write-Host "请尝试在浏览器中登录GitHub，然后重新运行此脚本" -ForegroundColor Yellow
}

Write-Host
Write-Host "操作完成，按Enter键退出..." -ForegroundColor Yellow
Read-Host
