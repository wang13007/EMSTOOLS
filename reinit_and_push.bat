@echo off

REM Reinitialize git repository and push to GitHub
REM This script uses full path to git.exe to avoid PATH issues

REM Set full path to git.exe
set "GIT_EXE=C:\Program Files\Git\bin\git.exe"

REM Check if git exists
if not exist "%GIT_EXE%" (
    echo ERROR: Git not found at %GIT_EXE%
    echo Please install Git from https://git-scm.com/downloads
    pause
    exit 1
)

REM Change to project directory
cd /d "E:\EMSTools\ems-售前调研工具"

echo ============================
echo Reinitializing Git Repository
echo ============================
echo Current directory: %CD%
echo Git executable: %GIT_EXE%
echo GitHub repository: https://github.com/wang13007/EMSTOOLS.git
echo.

REM Initialize git repository (if not already initialized)
if not exist ".git" (
    echo Initializing new Git repository...
    "%GIT_EXE%" init
    if %ERRORLEVEL% neq 0 (
        echo FAILED: Git init failed
        pause
        exit 1
    )
    echo Git repository initialized successfully
) else (
    echo Git repository already exists
)
echo.

REM Add GitHub remote
"%GIT_EXE%" remote remove origin 2>nul
"%GIT_EXE%" remote add origin https://github.com/wang13007/EMSTOOLS.git
if %ERRORLEVEL% neq 0 (
    echo FAILED: Failed to add remote repository
    pause
    exit 1
)
echo GitHub remote added: origin -> https://github.com/wang13007/EMSTOOLS.git
echo.

REM Configure git user (if not already configured)
"%GIT_EXE%" config user.name "wang13007"
"%GIT_EXE%" config user.email "wang13007@example.com"
echo Git user configured
echo.

REM Add all files
"%GIT_EXE%" add .
if %ERRORLEVEL% neq 0 (
    echo FAILED: Failed to add files
    pause
    exit 1
)
echo All files added
echo.

REM Commit changes
"%GIT_EXE%" commit -m "Reinitialize and push code" --allow-empty
if %ERRORLEVEL% neq 0 (
    echo FAILED: Failed to commit changes
    pause
    exit 1
)
echo Changes committed
echo.

REM Push to GitHub
echo Pushing to GitHub...
echo ================
"%GIT_EXE%" push origin master --force

if %ERRORLEVEL% equ 0 (
    echo ================
    echo SUCCESS! Code pushed to GitHub
    echo ================
    echo Your code is now available at:
    echo https://github.com/wang13007/EMSTOOLS.git
) else (
    echo ================
    echo FAILED: Push to GitHub failed
    echo ================
    echo Error code: %ERRORLEVEL%
    echo Possible reasons:
    echo 1. Network connection issue
    echo 2. GitHub authentication required
    echo 3. Invalid GitHub repository URL
    echo 4. Repository permissions
)

echo.
echo Press any key to exit...
pause
