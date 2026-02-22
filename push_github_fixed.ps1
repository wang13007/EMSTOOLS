# 定义Git路径
$gitPath = "C:\Program Files\Git\cmd\git.exe"

Write-Host "开始推送代码到GitHub..." -ForegroundColor Green
Write-Host

# 检查Git是否存在
if (-not (Test-Path $gitPath)) {
    Write-Host "错误: Git未找到，请先安装Git" -ForegroundColor Red
    Read-Host "按Enter键退出..."
    exit 1
}

Write-Host "Git路径: $gitPath" -ForegroundColor Green
Write-Host

# 检查网络连接
Write-Host "检查网络连接..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://github.com" -UseBasicParsing -TimeoutSec 10
    Write-Host "网络连接正常" -ForegroundColor Green
} catch {
    Write-Host "警告: 无法连接到GitHub，请检查网络连接" -ForegroundColor Yellow
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "将继续尝试推送，可能会失败..." -ForegroundColor Yellow
}

Write-Host

# 检查远程仓库
Write-Host "检查远程仓库..." -ForegroundColor Cyan
try {
    $remoteOutput = & $gitPath remote -v 2>&1
    $remoteExists = $false
    $remoteOutput | ForEach-Object {
        if ($_ -match "origin") {
            $remoteExists = $true
            Write-Host "远程仓库origin已存在" -ForegroundColor Yellow
        }
    }
    
    # 如果远程仓库存在，移除它
    if ($remoteExists) {
        Write-Host "移除现有远程仓库..." -ForegroundColor Cyan
        & $gitPath remote remove origin 2>&1
        Write-Host "远程仓库已移除" -ForegroundColor Green
    }
} catch {
    Write-Host "检查远程仓库时出错: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host

# 添加远程仓库
Write-Host "添加远程仓库..." -ForegroundColor Cyan
try {
    & $gitPath remote add origin https://github.com/wang13007/EMSTOOLS.git 2>&1
    Write-Host "远程仓库添加成功" -ForegroundColor Green
} catch {
    Write-Host "添加远程仓库失败: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "按Enter键退出..."
    exit 1
}

Write-Host

# 验证远程仓库
Write-Host "验证远程仓库..." -ForegroundColor Cyan
try {
    & $gitPath remote -v
} catch {
    Write-Host "验证远程仓库失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host

# 推送代码
Write-Host "推送代码到GitHub..." -ForegroundColor Cyan
Write-Host "这可能需要一些时间，请耐心等待..." -ForegroundColor Yellow
Write-Host

try {
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
} catch {
    Write-Host
    Write-Host "推送时出错: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host
Write-Host "操作完成，按Enter键退出..." -ForegroundColor Yellow
Read-Host
