@echo off

REM 直接运行 git push 命令
"C:\Program Files\Git\bin\git.exe" push origin master --force

echo.
if %errorlevel% equ 0 (
    echo Push successful!
    echo Please visit https://github.com/wang13007/EMSTOOLS.git
) else (
    echo Push failed, error code: %errorlevel%
)

echo.
echo Press any key to exit...
pause
