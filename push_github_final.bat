@echo off

REM 禁用批处理文件的中断
SETLOCAL DISABLEDELAYEDEXPANSION

REM 使用完整的Git路径
SET "GIT_CMD=C:\Program Files\Git\cmd\git.exe"

REM 切换到项目目录
cd /d "E:\EMSTools\ems-售前调研工具" >nul 2>&1
if %errorlevel% neq 0 (
    echo Failed to change directory
    pause
    exit /b 1
)

echo Current directory: %cd%
echo.

REM 检查Git是否存在
if not exist "%GIT_CMD%" (
    echo Git not found at %GIT_CMD%
    echo Please install Git first
    pause
    exit /b 1
)

REM 检查远程仓库
%GIT_CMD% remote -v >nul 2>&1
if %errorlevel% equ 0 (
    echo Remote repository already exists
    REM 删除现有远程仓库
    %GIT_CMD% remote remove origin >nul 2>&1
)

REM 添加远程仓库
%GIT_CMD% remote add origin https://github.com/wang13007/EMSTOOLS.git >nul 2>&1
if %errorlevel% neq 0 (
    echo Failed to add remote repository
    pause
    exit /b 1
)

echo Remote repository added successfully

REM 推送代码
echo Pushing code to GitHub...
echo.

REM 执行推送操作
%GIT_CMD% push -u origin master --force

REM 检查推送结果
if %errorlevel% equ 0 (
    echo.
    echo 推送成功！
    echo 请访问 https://github.com/wang13007/EMSTOOLS.git 查看仓库
) else (
    echo.
    echo 推送失败，请检查网络连接和GitHub仓库权限
)

echo.
echo 操作完成，按任意键退出...
pause

ENDLOCAL
