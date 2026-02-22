# Direct git push script
$gitPath = "C:\Program Files\Git\bin\git.exe"

Write-Host "Pushing to GitHub..."
Write-Host "Command: $gitPath push origin master --force"
Write-Host ""

# Run git push and capture output
$output = & $gitPath push origin master --force 2>&1

# Display output
Write-Host $output
Write-Host ""

# Check result
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Push completed successfully!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/wang13007/EMSTOOLS.git" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Push failed with exit code $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Please check network connection and GitHub permissions" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host
