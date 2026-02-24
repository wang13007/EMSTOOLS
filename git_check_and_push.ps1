# 使用短路径格式
$gitPath = "C:\Progra~1\Git\bin\git.exe"

# 检查Git是否存在
if (-not (Test-Path $gitPath)) {
    Write-Host "Git not found at $gitPath"
    exit 1
}

# 检查当前目录
Write-Host "Current directory: $(Get-Location)"

# 尝试运行git命令
Write-Host "Testing git command..."
try {
    # 检查Git版本
    & $gitPath --version
    
    # 检查Git状态
    Write-Host "\nGit status:"
    & $gitPath status
    
    # 检查远程仓库
    Write-Host "\nRemote repositories:"
    & $gitPath remote -v
    
    # 尝试推送代码
    Write-Host "\nTrying to push code..."
    & $gitPath add .
    & $gitPath commit -m "修改用户管理功能" --allow-empty
    & $gitPath push origin master --force
    
    Write-Host "\nPush completed!"
} catch {
    Write-Host "Error: $_"
}
