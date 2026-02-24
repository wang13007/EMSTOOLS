@echo off

REM ===============================================
REM Final Git Push to GitHub
REM Simplified version focused on pushing code
REM ===============================================

REM Set full path to git.exe
set "GIT_EXE=C:\Program Files\Git\bin\git.exe"

REM GitHub repository
set "REPO=https://github.com/wang13007/EMSTOOLS.git"

REM Check if git exists
if not exist "%GIT_EXE%" (
    echo ERROR: Git not found at %GIT_EXE%
    echo Please install Git from https://git-scm.com/downloads
    pause
    exit 1
)

REM Change to project directory
cd /d "E:\EMSTools\ems-售前调研工具"

echo ===============================================
echo Final Git Push to GitHub
echo ===============================================
echo Project: E:\EMSTools\ems-售前调研工具
echo Git: %GIT_EXE%
echo GitHub: %REPO%
echo ===============================================
echo.

REM Step 1: Check git status
echo Step 1: Checking git status...
"%GIT_EXE%" status
echo.

REM Step 2: Add all files
echo Step 2: Adding all files...
"%GIT_EXE%" add .
echo.

REM Step 3: Commit changes
echo Step 3: Committing changes...
"%GIT_EXE%" commit -m "Final push to GitHub" --allow-empty
echo.

REM Step 4: Add remote if not exists
echo Step 4: Adding GitHub remote...
"%GIT_EXE%" remote remove origin 2>nul
"%GIT_EXE%" remote add origin %REPO%
echo.

REM Step 5: Push to GitHub
echo Step 5: Pushing to GitHub...
echo ===============================================
echo This is the final step. Please wait...
echo If prompted, enter your GitHub username and password.
echo ===============================================
"%GIT_EXE%" push origin master --force

echo ===============================================
if %ERRORLEVEL% equ 0 (
    echo SUCCESS! Code pushed to GitHub
    echo ===============================================
    echo Your code is now at: %REPO%
    echo.
    echo Please verify by visiting:
    echo https://github.com/wang13007/EMSTOOLS
) else (
    echo FAILED: Push to GitHub failed
    echo ===============================================
    echo Error code: %ERRORLEVEL%
    echo.
    echo Manual command to try:
    echo "%GIT_EXE%" push origin master --force
    echo.
    echo If prompted for credentials, enter your GitHub username and password.
)
echo ===============================================
echo.
echo Press any key to exit...
pause
