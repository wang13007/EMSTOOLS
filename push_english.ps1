# Simple push script in English
$gitExe = "C:\Program Files\Git\bin\git.exe"

# Check if Git exists
if (-not (Test-Path $gitExe)) {
    Write-Host "Git not found"
    exit 1
}

# Change to project directory
Set-Location "e:\EMSTools\ems-售前调研工具"

Write-Host "=== Starting to push code to GitHub ==="

# Check git status
Write-Host "1. Checking Git status"
& $gitExe status
Write-Host

# Add files
Write-Host "2. Adding modified files"
& $gitExe add execute-fix.mjs .gitignore package.json package-lock.json
Write-Host

# Commit changes
Write-Host "3. Committing changes"
& $gitExe commit -m "fix: Remove hardcoded Supabase Secret Key and use environment variables" --allow-empty
Write-Host

# Push to GitHub
Write-Host "4. Pushing to GitHub"
& $gitExe push origin master --force
Write-Host

if ($LASTEXITCODE -eq 0) {
    Write-Host "=== Push successful ==="
    Write-Host "Code has been successfully pushed to GitHub"
    Write-Host "Repository URL: https://github.com/wang13007/EMSTOOLS.git"
} else {
    Write-Host "=== Push failed ==="
    Write-Host "Please check network connection or GitHub credentials"
}
