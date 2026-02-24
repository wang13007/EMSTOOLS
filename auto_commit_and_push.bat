@echo off

REM ===============================================
REM Automatic Git Commit and Push to GitHub
REM This script handles the entire process automatically
REM ===============================================

REM Set full path to git.exe
set "GIT_PATH=C:\Program Files\Git\bin\git.exe"

REM GitHub repository details
set "REPO_URL=https://github.com/wang13007/EMSTOOLS.git"
set "REPO_NAME=EMSTOOLS"
set "BRANCH=master"

REM Check if git is installed
if not exist "%GIT_PATH%" (
    echo ERROR: Git is not installed!
    echo Please download and install Git from:
    echo https://git-scm.com/downloads
    echo.
    echo After installation, run this script again.
    pause
    exit 1
)

REM Change to project directory
cd /d "E:\EMSTools\ems-售前调研工具"

REM Display welcome message
echo ===============================================
echo Automatic Git Commit and Push to GitHub
echo ===============================================
echo Project: E:\EMSTools\ems-售前调研工具
echo Git: %GIT_PATH%
echo GitHub: %REPO_URL%
echo Branch: %BRANCH%
echo ===============================================
echo.

REM Step 1: Initialize git repository
if not exist ".git" (
    echo Step 1: Initializing Git repository...
    "%GIT_PATH%" init
    if %ERRORLEVEL% neq 0 (
        echo FAILED: Git init failed
        goto EndWithError
    )
    echo ✓ Git repository initialized
) else (
    echo Step 1: Git repository already exists
)
echo.

REM Step 2: Configure git user
"%GIT_PATH%" config user.name "wang13007"
"%GIT_PATH%" config user.email "wang13007@example.com"
echo Step 2: Git user configured

REM Step 3: Add GitHub remote
echo Step 3: Adding GitHub remote repository...
"%GIT_PATH%" remote remove origin 2>nul
"%GIT_PATH%" remote add origin %REPO_URL%
if %ERRORLEVEL% neq 0 (
    echo FAILED: Failed to add remote repository
    goto EndWithError
)
echo ✓ GitHub remote added: origin -> %REPO_URL%
echo.

REM Step 4: Check git status
echo Step 4: Checking git status...
"%GIT_PATH%" status
echo.

REM Step 5: Add all files
echo Step 5: Adding all files...
"%GIT_PATH%" add .
if %ERRORLEVEL% neq 0 (
    echo FAILED: Failed to add files
    goto EndWithError
)
echo ✓ All files added
echo.

REM Step 6: Commit changes
echo Step 6: Committing changes...
"%GIT_PATH%" commit -m "Auto commit: Latest changes" --allow-empty
if %ERRORLEVEL% neq 0 (
    echo FAILED: Failed to commit changes
    goto EndWithError
)
echo ✓ Changes committed successfully
echo.

REM Step 7: Push to GitHub
echo Step 7: Pushing to GitHub...
echo This may take a moment...
echo ===============================================
"%GIT_PATH%" push origin %BRANCH% --force
if %ERRORLEVEL% neq 0 (
    echo ===============================================
    echo FAILED: Push to GitHub failed
    goto EndWithError
)
echo ===============================================
echo ✓ SUCCESS! Code pushed to GitHub
echo ===============================================
echo.
echo Your code is now available at:
echo %REPO_URL%
echo.
echo You can view and manage your repository on GitHub.
echo ===============================================
goto EndWithSuccess

:EndWithError
echo ===============================================
echo ❌ OPERATION FAILED
echo ===============================================
echo Error code: %ERRORLEVEL%
echo.
echo Possible reasons:
 echo 1. No network connection
 echo 2. GitHub authentication required
 echo 3. No write permission to repository
 echo 4. GitHub is temporarily unavailable
 echo 5. Git installation issue
 echo.
echo Manual solution:
 echo 1. Open Command Prompt as Administrator
 echo 2. Type: cd /d E:\EMSTools\ems-售前调研工具
 echo 3. Type: "C:\Program Files\Git\bin\git.exe" push origin master --force
 echo 4. Enter GitHub username and password if prompted
 echo.
echo Or use GitHub Desktop:
 echo 1. Download from https://desktop.github.com/
 echo 2. Clone the repository
 echo 3. Add your files and commit
 echo 4. Push to origin
echo ===============================================
goto End

:EndWithSuccess
echo ===============================================
echo ✅ OPERATION COMPLETED SUCCESSFULLY
echo ===============================================
echo Your code has been successfully pushed to GitHub!
echo ===============================================

:End
echo.
echo Press any key to exit...
pause
