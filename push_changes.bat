@echo off

rem 设置Git可执行文件路径
set "GIT_EXE=C:\Program Files\Git\bin\git.exe"

rem 检查Git是否存在
if not exist "%GIT_EXE%" (
    echo Git可执行文件不存在，请检查路径是否正确
    pause
    exit /b 1
)

echo 开始推送修改后的代码到GitHub...
echo.

rem 切换到项目目录
cd /d "e:\EMSTools\ems-售前调研工具"

rem 检查当前目录状态
echo 1. 检查当前Git状态...
"%GIT_EXE%" status
echo.

rem 添加所有文件
echo 2. 添加所有文件...
"%GIT_EXE%" add .
echo.

rem 提交更改
echo 3. 提交更改...
"%GIT_EXE%" commit -m "修改用户管理功能，支持邮箱、手机号和多角色选择"
echo.

rem 推送到GitHub
echo 4. 推送到GitHub...
"%GIT_EXE%" push origin master --force
echo.

if %ERRORLEVEL% equ 0 (
    echo 代码推送成功！
    echo 您可以在 https://github.com/wang13007/EMSTOOLS.git 查看代码
) else (
    echo 代码推送失败，请检查网络连接或GitHub凭据
)

echo.
echo 操作完成，按任意键退出...
pause >nul
