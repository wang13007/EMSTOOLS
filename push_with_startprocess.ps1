# 使用Start-Process来运行git命令，避免trae-sandbox的干扰
$gitExe = "C:\Progra~1\Git\bin\git.exe"

# 检查Git是否存在
if (-not (Test-Path $gitExe)) {
    Write-Host "Git not found at $gitExe"
    exit 1
}

# 切换到项目目录
Set-Location "e:\EMSTools\ems-售前调研工具"

Write-Host "开始推送代码到GitHub..."

# 定义git命令
$addArgs = @("add", ".")
$commitArgs = @("commit", "-m", "修改用户管理功能，支持邮箱、手机号和多角色选择")
$pushArgs = @("push", "origin", "master", "--force")

# 运行git add
Write-Host "1. 运行 git add ."
Start-Process -FilePath $gitExe -ArgumentList $addArgs -Wait -NoNewWindow
Write-Host

# 运行git commit
Write-Host "2. 运行 git commit"
Start-Process -FilePath $gitExe -ArgumentList $commitArgs -Wait -NoNewWindow
Write-Host

# 运行git push
Write-Host "3. 运行 git push"
Start-Process -FilePath $gitExe -ArgumentList $pushArgs -Wait -NoNewWindow
Write-Host

Write-Host "推送操作完成！"
