# 设置Git可执行文件路径
$gitExe = "C:\Program Files\Git\bin\git.exe"

# 检查Git是否存在
if (-not (Test-Path $gitExe)) {
    Write-Host "Git not found at $gitExe"
    exit 1
}

Write-Host "Current directory: $(Get-Location)"
Write-Host "Git executable: $gitExe"
Write-Host ""

# 检查Git状态
Write-Host "=== Git Status ==="
& $gitExe status
Write-Host ""

# 检查远程仓库
Write-Host "=== Remote Repositories ==="
& $gitExe remote -v
Write-Host ""

# 检查本地分支
Write-Host "=== Local Branches ==="
& $gitExe branch
Write-Host ""

# 检查最近的提交
Write-Host "=== Recent Commits ==="
& $gitExe log --oneline -n 5
Write-Host ""

# 尝试简单的git命令
Write-Host "=== Testing Git Command ==="
& $gitExe --version
Write-Host ""

Write-Host "Debug completed."
