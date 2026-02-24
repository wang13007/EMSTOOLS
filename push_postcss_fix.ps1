# 使用完整路径的 git 命令
$gitExe = "C:\Program Files\Git\bin\git.exe"

# 切换到项目目录
Set-Location "E:\EMSTools\ems-售前调研工具"

# 查看当前状态
Write-Host "=== Git Status ==="
& $gitExe status

# 添加更改
Write-Host "=== Adding Changes ==="
& $gitExe add postcss.config.cjs

# 提交更改
Write-Host "=== Committing Changes ==="
& $gitExe commit -m "fix: rename postcss config to cjs"

# 推送更改
Write-Host "=== Pushing Changes ==="
& $gitExe push origin master --force

# 查看结果
Write-Host "=== Final Status ==="
& $gitExe status

Write-Host "\n=== Done ==="
