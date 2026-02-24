# 尝试使用相对路径
Write-Host "Starting git push..."

# 尝试直接运行git命令（假设在PATH中）
try {
    Write-Host "Trying git command from PATH..."
    git --version
    git add .
    git commit -m "修改用户管理功能"
    git push origin master --force
    Write-Host "Push successful!"
} catch {
    Write-Host "Failed to run git from PATH: $_"
}

Write-Host "Push process completed."
