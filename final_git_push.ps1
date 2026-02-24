# 定义Git可执行文件路径
$gitExe = "C:\Program Files\Git\bin\git.exe"

# 检查Git是否存在
if (-not (Test-Path $gitExe)) {
    Write-Host "Git executable not found at $gitExe"
    exit 1
}

# 进入项目目录
Set-Location "e:\EMSTools\ems-售前调研工具"

# 执行Git命令
Write-Host "Adding files..."
& $gitExe add .

Write-Host "Committing changes..."
& $gitExe commit -m "Final push to GitHub" --allow-empty

Write-Host "Pushing to GitHub..."
& $gitExe push origin master --force

Write-Host "Git push completed."
