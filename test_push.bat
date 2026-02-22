@echo off

echo Testing git push...
echo ------------------

REM 直接运行 git push 命令
"C:\Program Files\Git\bin\git.exe" push origin master --force

echo ------------------
echo Command completed with error code: %errorlevel%
echo.
echo Press any key to exit...
pause
