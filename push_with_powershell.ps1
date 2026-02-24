# 使用短路径格式避免空格问题
$gitExe = "C:\Progra~1\Git\bin\git.exe"

# 检查Git是否存在
if (-not (Test-Path $gitExe)) {
    Write-Host "Git not found at $gitExe"
    exit 1
}

# 切换到项目目录
Set-Location "e:\EMSTools\ems-售前调研工具"

Write-Host "=== 开始推送代码到GitHub ==="

# 检查当前状态
Write-Host "1. 检查Git状态..."
& $gitExe status
Write-Host

# 添加所有文件
Write-Host "2. 添加所有文件..."
& $gitExe add .
Write-Host

# 提交更改
Write-Host "3. 提交更改..."
& $gitExe commit -m "修改用户管理功能，支持邮箱、手机号和多角色选择"
Write-Host

# 检查远程仓库
Write-Host "4. 检查远程仓库配置..."
& $gitExe remote -v
Write-Host

# 推送代码
Write-Host "5. 推送到GitHub..."
& $gitExe push origin master --force
Write-Host

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 推送成功！"
    Write-Host "代码已更新到: https://github.com/wang13007/EMSTOOLS.git"
} else {
    Write-Host "❌ 推送失败！"
    Write-Host "请检查网络连接或GitHub凭据"
}

Write-Host "=== 操作完成 ==="
