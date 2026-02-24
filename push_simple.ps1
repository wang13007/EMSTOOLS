# 简单可靠的推送脚本
$gitExe = "C:\Program Files\Git\bin\git.exe"

# 检查Git是否存在
if (-not (Test-Path $gitExe)) {
    Write-Host "Git not found"
    exit 1
}

# 切换到项目目录
Set-Location "e:\EMSTools\ems-售前调研工具"

Write-Host "=== 开始推送代码到GitHub ==="

# 检查git状态
Write-Host "1. 检查Git状态"
& $gitExe status
Write-Host

# 添加文件
Write-Host "2. 添加修改的文件"
& $gitExe add execute-fix.mjs .gitignore package.json package-lock.json
Write-Host

# 提交更改
Write-Host "3. 提交更改"
& $gitExe commit -m "fix: Remove hardcoded Supabase Secret Key and use environment variables" --allow-empty
Write-Host

# 推送到GitHub
Write-Host "4. 推送到GitHub"
& $gitExe push origin master --force
Write-Host

if ($LASTEXITCODE -eq 0) {
    Write-Host "=== 推送成功 ==="
    Write-Host "代码已成功推送到GitHub"
    Write-Host "仓库地址: https://github.com/wang13007/EMSTOOLS.git"
} else {
    Write-Host "=== 推送失败 ==="
    Write-Host "请检查网络连接或GitHub凭据"
}
