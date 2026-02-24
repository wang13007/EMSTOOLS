# 最简单的推送脚本
$gitExe = "C:\Program Files\Git\bin\git.exe"

# 检查Git是否存在
if (-not (Test-Path $gitExe)) {
    Write-Host "Git not found"
    exit 1
}

Write-Host "=== 开始推送代码到GitHub ==="

# 添加所有文件
Write-Host "1. 添加所有文件"
& $gitExe add .

# 提交更改
Write-Host "2. 提交更改"
& $gitExe commit -m "fix: Remove hardcoded Supabase Secret Key and use environment variables" --allow-empty

# 推送到GitHub
Write-Host "3. 推送到GitHub"
& $gitExe push origin master --force

# 检查结果
if ($LASTEXITCODE -eq 0) {
    Write-Host "=== 推送成功 ==="
    Write-Host "代码已成功推送到GitHub"
} else {
    Write-Host "=== 推送失败 ==="
    Write-Host "请检查网络连接或GitHub凭据"
}
