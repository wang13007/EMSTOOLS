@echo off

rem 设置Git可执行文件路径
set "GIT_EXE=C:\Program Files\Git\bin\git.exe"

rem 检查Git是否存在
if not exist "%GIT_EXE%" (
    echo Git可执行文件不存在，请检查路径是否正确
    pause
    exit /b 1
)

echo 检查当前Git状态...
echo.

rem 切换到项目目录
cd /d "e:\EMSTools\ems-售前调研工具"

rem 检查当前目录状态
"%GIT_EXE%" status
echo.

rem 检查远程仓库配置
"%GIT_EXE%" remote -v
echo.

rem 检查本地分支
"%GIT_EXE%" branch
echo.

rem 检查最近的提交
"%GIT_EXE%" log --oneline -n 5
echo.

echo 检查完成，请查看输出信息。
echo.
pause
