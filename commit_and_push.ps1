# PowerShell script to commit and push code

Write-Host "Starting to commit code..." -ForegroundColor Green

# Set Git executable path
$gitPath = "C:\Program Files\Git\bin\git.exe"

# Check if Git exists
if (-Not (Test-Path $gitPath)) {
    Write-Host "Git not found, please ensure Git is installed in default path" -ForegroundColor Red
    Read-Host "Press any key to exit..."
    exit 1
}

# Switch to project directory
Set-Location "E:\EMSTools\ems-售前调研工具"

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan

# Check Git status
Write-Host "\nChecking Git status..." -ForegroundColor Yellow
& $gitPath status

# Add all files
Write-Host "\nAdding all files..." -ForegroundColor Yellow
& $gitPath add .

# Commit changes
Write-Host "\nCommitting changes..." -ForegroundColor Yellow
& $gitPath commit -m "Fix window position and CRUD operations"

# Push code
Write-Host "\nPushing code to GitHub..." -ForegroundColor Yellow
& $gitPath push origin master --force

# Check push result
if ($LASTEXITCODE -eq 0) {
    Write-Host "\nPush successful!" -ForegroundColor Green
    Write-Host "Please visit https://github.com/wang13007/EMSTOOLS.git to view the repository" -ForegroundColor Cyan
} else {
    Write-Host "\nPush failed, please check network connection and GitHub repository permissions" -ForegroundColor Red
}

Write-Host "\nOperation completed, press Enter to exit..." -ForegroundColor Yellow
Read-Host
