@echo off

rem 设置Git可执行文件路径
set "GIT_EXE=C:\Program Files\Git\bin\git.exe"

rem 检查Git是否存在
if not exist "%GIT_EXE%" (
    echo Git可执行文件不存在，请检查路径是否正确
    pause
    exit /b 1
)

echo 开始将代码推送到GitHub...
echo.

rem 切换到项目目录
cd /d "e:\EMSTools\ems-售前调研工具"

rem 检查当前目录状态
echo 检查当前Git状态...
"%GIT_EXE%" status
echo.

rem 添加所有文件
echo 添加所有文件...
"%GIT_EXE%" add .
echo.

rem 提交更改
echo 提交更改...
"%GIT_EXE%" commit -m "更新代码并修复问题" --allow-empty
echo.

rem 添加远程仓库
echo 添加GitHub远程仓库...
"%GIT_EXE%" remote add origin https://github.com/wang13007/EMSTOOLS.git 2>nul || echo 远程仓库已存在，跳过添加步骤
echo.

rem 推送到GitHub
echo 推送到GitHub...
"%GIT_EXE%" push origin master --force
echo.

if %ERRORLEVEL% equ 0 (
    echo 代码推送成功！
    echo 您可以在 https://github.com/wang13007/EMSTOOLS.git 查看代码
) else (
    echo 代码推送失败，请检查网络连接或GitHub凭据
    echo 请尝试在浏览器中登录GitHub，然后重新运行此脚本
)

echo.
echo 操作完成，按任意键退出...
pause >nul
