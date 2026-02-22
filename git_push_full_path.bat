@echo off

REM Git push with full path
REM This script uses the full path to git.exe to avoid PATH issues

REM Set the full path to git.exe
set "GIT_PATH=C:\Program Files\Git\bin\git.exe"

REM Check if git.exe exists
if not exist "%GIT_PATH%" (
    echo ERROR: Git not found at %GIT_PATH%
    echo Please check if Git is installed in the default location
    pause
    exit 1
)

REM Change to project directory
cd /d "E:\EMSTools\ems-售前调研工具"

echo Current directory: %CD%
echo Git path: %GIT_PATH%
echo Repository: https://github.com/wang13007/EMSTOOLS.git
echo.
echo Starting git push...
echo =====================

REM Execute git push with full path
"%GIT_PATH%" push origin master --force

REM Check result
if %ERRORLEVEL% equ 0 (
    echo =====================
    echo SUCCESS! Git push completed
    echo =====================
    echo Your code has been pushed to GitHub
    echo You can now view it at:
    echo https://github.com/wang13007/EMSTOOLS.git
) else (
    echo =====================
    echo FAILED! Git push failed
    echo =====================
    echo Error code: %ERRORLEVEL%
    echo Possible reasons:
    echo 1. Network connection issue
    echo 2. GitHub authentication required
    echo 3. Repository permissions
    echo 4. Git not properly installed
)

echo.
echo Press any key to exit...
pause
