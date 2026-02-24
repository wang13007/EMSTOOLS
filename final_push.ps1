# 使用短路径格式避免空格问题
$gitExe = "C:\Progra~1\Git\bin\git.exe"

# 检查Git是否存在
if (-not (Test-Path $gitExe)) {
    Write-Host "Git not found at $gitExe"
    exit 1
}

Write-Host "Starting git push process..."

# 切换到项目目录
Set-Location "e:\EMSTools\ems-售前调研工具"

# 添加所有文件
Write-Host "Adding all files..."
& $gitExe add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "Files added successfully"
} else {
    Write-Host "Failed to add files"
    exit 1
}

# 提交更改
Write-Host "Committing changes..."
& $gitExe commit -m "修改用户管理功能，支持邮箱、手机号和多角色选择"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Changes committed successfully"
} else {
    Write-Host "Failed to commit changes"
    # 继续执行，即使没有新更改
}

# 推送到GitHub
Write-Host "Pushing to GitHub..."
& $gitExe push origin master --force
if ($LASTEXITCODE -eq 0) {
    Write-Host "Push successful!"
    Write-Host "Code is now available at: https://github.com/wang13007/EMSTOOLS.git"
} else {
    Write-Host "Push failed!"
    exit 1
}

Write-Host "Git push process completed."
