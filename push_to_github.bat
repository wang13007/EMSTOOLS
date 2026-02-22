@echo off

REM 使用完整路径的 git.exe
set GIT_EXE="C:\Program Files\Git\bin\git.exe"

REM 切换到项目目录
cd /d "E:\EMSTools\ems-售前调研工具"

echo Current directory: %cd%
echo.

REM 推送代码到GitHub
echo Pushing code to GitHub...
%GIT_EXE% push origin master --force
echo.

REM 检查推送结果
if %errorlevel% equ 0 (
    echo Push successful!
    echo Please visit https://github.com/wang13007/EMSTOOLS.git to view the repository
) else (
    echo Push failed, please check network connection and GitHub repository permissions
)

echo.
echo Operation completed, press any key to exit...
pause
