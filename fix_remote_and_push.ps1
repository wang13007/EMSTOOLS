# 定义Git路径
$gitPath = "C:\Program Files\Git\cmd\git.exe"

Write-Host "开始修复远程仓库并推送代码..." -ForegroundColor Green
Write-Host

# 检查远程仓库是否存在
Write-Host "检查远程仓库..." -ForegroundColor Cyan
$remoteExists = $false
& $gitPath remote -v | ForEach-Object {
    if ($_ -match "origin") {
        $remoteExists = $true
        Write-Host "远程仓库origin已存在: $_" -ForegroundColor Yellow
    }
}

Write-Host

# 如果远程仓库存在，移除它
if ($remoteExists) {
    Write-Host "移除现有远程仓库..." -ForegroundColor Cyan
    & $gitPath remote remove origin
    if ($LASTEXITCODE -eq 0) {
        Write-Host "远程仓库已成功移除" -ForegroundColor Green
    } else {
        Write-Host "移除远程仓库失败" -ForegroundColor Red
    }
    Write-Host
}

# 添加远程仓库
Write-Host "添加远程仓库..." -ForegroundColor Cyan
& $gitPath remote add origin https://github.com/wang13007/EMSTOOLS.git
if ($LASTEXITCODE -eq 0) {
    Write-Host "远程仓库添加成功" -ForegroundColor Green
} else {
    Write-Host "远程仓库添加失败" -ForegroundColor Red
    Read-Host "按Enter键退出..."
    exit 1
}

Write-Host

# 验证远程仓库
Write-Host "验证远程仓库..." -ForegroundColor Cyan
& $gitPath remote -v
Write-Host

# 推送代码
Write-Host "推送代码到GitHub..." -ForegroundColor Cyan
Write-Host "这可能需要一些时间，请耐心等待..."
Write-Host

# 执行推送操作
& $gitPath push -u origin master --force

# 检查推送结果
if ($LASTEXITCODE -eq 0) {
    Write-Host
    Write-Host "推送成功！" -ForegroundColor Green
    Write-Host "请访问 https://github.com/wang13007/EMSTOOLS.git 查看仓库" -ForegroundColor Green
} else {
    Write-Host
    Write-Host "推送失败，请检查网络连接和GitHub仓库权限" -ForegroundColor Red
    Write-Host "错误代码: $LASTEXITCODE" -ForegroundColor Red
}

Write-Host
Write-Host "操作完成，按Enter键退出..." -ForegroundColor Yellow
Read-Host
