$gitPath = "C:\Program Files\Git\bin\git.exe"
$projectPath = "e:\EMSTools\ems-售前调研工具"

# 检查Git是否存在
if (-not (Test-Path $gitPath)) {
    Write-Host "Git not found at $gitPath"
    exit 1
}

# 检查项目目录
if (-not (Test-Path $projectPath)) {
    Write-Host "Project directory not found at $projectPath"
    exit 1
}

# 切换到项目目录
Set-Location $projectPath

# 初始化Git仓库（如果尚未初始化）
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..."
    & $gitPath init
}

# 添加所有文件
Write-Host "Adding all files..."
& $gitPath add .

# 提交更改
Write-Host "Committing changes..."
& $gitPath commit -m "Update code" --allow-empty

# 添加远程仓库
Write-Host "Adding remote repository..."
& $gitPath remote add origin https://github.com/wang13007/EMSTOOLS.git 2>$null

# 推送代码
Write-Host "Pushing code to GitHub..."
& $gitPath push origin master --force

Write-Host "Git push operation completed."
