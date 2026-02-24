@echo off

rem 直接运行git命令
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "Update code" --allow-empty
"C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/wang13007/EMSTOOLS.git 2>nul
"C:\Program Files\Git\bin\git.exe" push origin master --force

rem 检查结果
if %ERRORLEVEL% equ 0 (
    echo Push successful!
) else (
    echo Push failed!
)
