@echo off

REM 直接运行 git push 命令并将输出重定向到文件
"C:\Program Files\Git\bin\git.exe" push origin master --force > push.log 2>&1

echo Push completed. Checking result...
echo.

REM 显示输出文件内容
type push.log
echo.

REM 检查错误级别
if %errorlevel% equ 0 (
    echo SUCCESS: Push completed successfully!
    echo Repository: https://github.com/wang13007/EMSTOOLS.git
) else (
    echo ERROR: Push failed with exit code %errorlevel%
    echo Please check push.log for details
)

echo.
echo Press any key to exit...
pause
