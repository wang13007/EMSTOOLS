@echo off

REM 使用完整路径的 git.exe
set GIT_EXE="C:\Program Files\Git\bin\git.exe"

REM 切换到项目目录
cd /d "E:\EMSTools\ems-售前调研工具"

echo 当前目录: %cd%
echo.

REM 添加所有文件
echo 添加所有文件...
%GIT_EXE% add .
echo.

REM 提交更改
echo 提交更改...
%GIT_EXE% commit -m "Fix window position and CRUD operations"
echo.

REM 推送代码
echo 推送代码到GitHub...
%GIT_EXE% push origin master --force
echo.

REM 检查推送结果
if %errorlevel% equ 0 (
    echo 推送成功！
    echo 请访问 https://github.com/wang13007/EMSTOOLS.git 查看仓库
) else (
    echo 推送失败，请检查网络连接和GitHub仓库权限
)

echo.
echo 操作完成，按任意键退出...
pause
