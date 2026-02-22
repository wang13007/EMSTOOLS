@echo off

REM 使用完整的Git路径
SET GIT_CMD="C:\Program Files\Git\cmd\git.exe"

REM 切换到项目目录
cd /d "E:\EMSTools\ems-售前调研工具"

echo Current directory: %cd%
echo.

REM 检查远程仓库
%GIT_CMD% remote -v
echo.

REM 推送代码
echo Pushing code to GitHub...
%GIT_CMD% push -u origin master --force

REM 检查推送结果
if %errorlevel% equ 0 (
    echo.
    echo Push successful!
    echo Please visit https://github.com/wang13007/EMSTOOLS.git to view the repository
) else (
    echo.
    echo Push failed, please check network connection and GitHub repository permissions
)

echo.
echo Operation completed, press any key to exit...
pause
