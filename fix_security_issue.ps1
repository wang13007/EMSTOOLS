# 检查是否还有其他文件包含Supabase Secret Key
Write-Host "=== 检查敏感信息 ==="
& "C:\Program Files\Git\bin\git.exe" grep -r "sb_secret_" --include="*.js" --include="*.mjs" --include="*.ts" --include="*.json"
Write-Host

# 检查.env文件是否正确配置
Write-Host "=== 检查.env文件 ==="
if (Test-Path ".env") {
    Get-Content ".env"
} else {
    Write-Host ".env文件不存在"
}
Write-Host

# 检查.gitignore文件是否包含.env
Write-Host "=== 检查.gitignore文件 ==="
if (Test-Path ".gitignore") {
    Get-Content ".gitignore"
} else {
    Write-Host ".gitignore文件不存在"
}
Write-Host

# 显示修复后的execute-fix.mjs文件
Write-Host "=== 检查修复后的execute-fix.mjs文件 ==="
Get-Content "execute-fix.mjs"
Write-Host

Write-Host "=== 安全修复完成 ==="
Write-Host "请按照GitHub的建议，前往Supabase控制台重置Secret Key"
Write-Host "路径: Supabase Dashboard → Settings → API → Regenerate service_role key"
