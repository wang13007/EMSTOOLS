# 使用完整路径
$gitExe = "C:\Program Files\Git\bin\git.exe"

# 检查Git是否存在
if (-not (Test-Path $gitExe)) {
    Write-Host "Git not found at $gitExe"
    exit 1
}

# 切换到项目目录
Set-Location "e:\EMSTools\ems-售前调研工具"

Write-Host "开始推送代码到GitHub..."

# 运行git add
Write-Host "1. 运行 git add ."
& $gitExe add .
Write-Host

# 运行git commit
Write-Host "2. 运行 git commit"
& $gitExe commit -m "修改用户管理功能，支持邮箱、手机号和多角色选择"
Write-Host

# 运行git push
Write-Host "3. 运行 git push"
& $gitExe push origin master --force
Write-Host

Write-Host "推送操作完成！"
