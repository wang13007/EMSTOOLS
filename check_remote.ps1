# Check git remote configuration
$gitPath = "C:\Program Files\Git\bin\git.exe"

Write-Host "Checking git remote configuration..."
Write-Host ""

# Check current remotes
Write-Host "Current remotes:"
& $gitPath remote -v
Write-Host ""

# Check if origin exists
Write-Host "Checking origin remote..."
$originExists = $false
try {
    $originUrl = & $gitPath config --get remote.origin.url
    $originExists = $true
    Write-Host "Origin URL: $originUrl"
} catch {
    Write-Host "Origin remote not found"
}
Write-Host ""

# If origin doesn't exist, set it
if (-Not $originExists) {
    Write-Host "Setting origin remote..."
    & $gitPath remote add origin https://github.com/wang13007/EMSTOOLS.git
    Write-Host "Origin set to: https://github.com/wang13007/EMSTOOLS.git"
} else {
    Write-Host "Origin remote already exists"
}

Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host
