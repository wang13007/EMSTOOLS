@echo off

REM Final push script
set GIT_EXE="C:\Program Files\Git\bin\git.exe"

cd /d "E:\EMSTools\ems-售前调研工具"

echo Final push attempt...
echo Repository: https://github.com/wang13007/EMSTOOLS.git
echo ------------------------

REM Try git push
%GIT_EXE% push origin master --force

if %errorlevel% equ 0 (
    echo ------------------------
    echo SUCCESS! Push completed
    echo ------------------------
    echo Your code is now on GitHub
    echo Visit: https://github.com/wang13007/EMSTOOLS.git
) else (
    echo ------------------------
    echo FAILED! Push did not complete
    echo ------------------------
    echo Error code: %errorlevel%
    echo Possible reasons:
    echo 1. Network connection issue
    echo 2. GitHub repository permissions
    echo 3. Authentication required
)

echo ------------------------
echo Press any key to exit...
pause
