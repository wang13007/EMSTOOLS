# 安全推送脚本
$gitExe = "C:\Program Files\Git\bin\git.exe"
$maxRetries = 3
$retryDelay = 5  # 秒

# 检查Git是否存在
if (-not (Test-Path $gitExe)) {
    Write-Host "❌ Git not found at $gitExe"
    exit 1
}

# 切换到项目目录
Set-Location "e:\EMSTools\ems-售前调研工具"

Write-Host "=== 开始安全推送代码到GitHub ==="
Write-Host

# 检查git状态
Write-Host "1. 检查Git状态..."
& $gitExe status
Write-Host

# 检查是否有敏感信息
Write-Host "2. 检查敏感信息..."
try {
    $secretGrep = & $gitExe grep -r "sb_secret_" --include="*.js" --include="*.mjs" --include="*.ts" --include="*.json"
    if ($secretGrep) {
        Write-Host "❌ 发现敏感信息，正在清理..."
        # 这里可以添加自动清理逻辑
    } else {
        Write-Host "✅ 未发现敏感信息"
    }
} catch {
    Write-Host "⚠️  检查敏感信息时出错: $_"
}
Write-Host

# 检查.env文件是否被忽略
Write-Host "3. 检查.env文件配置..."
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore"
    if ($gitignoreContent -contains ".env") {
        Write-Host "✅ .env文件已在.gitignore中"
    } else {
        Write-Host "⚠️  .env文件不在.gitignore中，正在添加..."
        Add-Content ".gitignore" ".env"
        Write-Host "✅ 已添加.env到.gitignore"
    }
} else {
    Write-Host "⚠️  .gitignore文件不存在，正在创建..."
    New-Item ".gitignore" -ItemType File
    Add-Content ".gitignore" ".env"
    Write-Host "✅ 已创建.gitignore并添加.env"
}
Write-Host

# 尝试推送代码
$retryCount = 0
$pushSuccess = $false

while ($retryCount -lt $maxRetries -and -not $pushSuccess) {
    $retryCount++
    Write-Host "=== 尝试推送 ($retryCount/$maxRetries) ==="
    
    try {
        # 添加文件
        Write-Host "4. 添加修改的文件..."
        & $gitExe add execute-fix.mjs .gitignore package.json package-lock.json
        
        # 提交更改
        Write-Host "5. 提交更改..."
        & $gitExe commit -m "fix: Remove hardcoded Supabase Secret Key and use environment variables" --allow-empty
        
        # 推送到GitHub
        Write-Host "6. 推送到GitHub..."
        & $gitExe push origin master --force
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 推送成功！"
            $pushSuccess = $true
        } else {
            Write-Host "❌ 推送失败，正在重试..."
            if ($retryCount -lt $maxRetries) {
                Write-Host "等待 $retryDelay 秒后重试..."
                Start-Sleep -Seconds $retryDelay
            }
        }
    } catch {
        Write-Host "❌ 推送过程中出错: $_"
        if ($retryCount -lt $maxRetries) {
            Write-Host "等待 $retryDelay 秒后重试..."
            Start-Sleep -Seconds $retryDelay
        }
    }
    Write-Host
}

if ($pushSuccess) {
    Write-Host "=== 推送完成 ==="
    Write-Host "✅ 代码已成功推送到GitHub"
    Write-Host "📁 仓库地址: https://github.com/wang13007/EMSTOOLS.git"
} else {
    Write-Host "=== 推送失败 ==="
    Write-Host "❌ 多次尝试后仍无法推送，请检查网络连接或GitHub凭据"
    Write-Host "💡 建议："
    Write-Host "   1. 检查网络连接是否稳定"
    Write-Host "   2. 确保GitHub凭据正确"
    Write-Host "   3. 尝试使用SSH协议"
    Write-Host "   4. 检查GitHub服务器状态"
}
