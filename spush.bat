@echo off

rem 使用短路径格式避免空格问题
set "GIT_EXE=C:\Progra~1\Git\bin\git.exe"

rem 检查Git是否存在
if not exist "%GIT_EXE%" (
    echo Git not found
    pause
    exit /b 1
)

rem 切换到项目目录
cd /d "e:\EMSTools\ems-售前调研工具"

rem 推送代码
%GIT_EXE% add .
%GIT_EXE% commit -m "修改用户管理功能"
%GIT_EXE% push origin master --force

rem 检查结果
if %ERRORLEVEL% equ 0 (
    echo Push successful!
) else (
    echo Push failed!
)

pause
