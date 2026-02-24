# 使用短路径格式避免空格问题
$gitExe = "C:\Progra~1\Git\bin\git.exe"

# 检查Git是否存在
if (-not (Test-Path $gitExe)) {
    Write-Host "Git not found"
    exit 1
}

# 推送代码
& $gitExe add .
& $gitExe commit -m "修改用户管理功能"
& $gitExe push origin master --force
