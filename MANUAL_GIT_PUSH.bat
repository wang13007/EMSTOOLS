@echo off

rem *********************************************************************
rem * 手动Git推送脚本 - 请双击运行此文件将代码推送到GitHub               *
rem * 此脚本直接使用Git可执行文件，不依赖任何包装器                      *
rem *********************************************************************

echo ======================================================================
echo 正在准备将代码推送到GitHub...
echo ======================================================================
echo.

rem 设置Git可执行文件路径
set "GIT_EXE=C:\Program Files\Git\bin\git.exe"

rem 检查Git是否存在
if not exist "%GIT_EXE%" (
    echo 错误: Git可执行文件不存在于 %GIT_EXE%
    echo 请确保Git已正确安装，或者修改此脚本中的Git路径
    echo.
    echo 按任意键退出...
    pause >nul
    exit /b 1
)

echo 找到Git可执行文件: %GIT_EXE%
echo.

rem 切换到项目目录
cd /d "e:\EMSTools\ems-售前调研工具"

rem 检查当前目录
if not exist "package.json" (
    echo 错误: 未找到package.json文件，可能不在项目目录中
    echo 当前目录: %CD%
    echo.
    echo 按任意键退出...
    pause >nul
    exit /b 1
)

echo 确认在项目目录中: %CD%
echo.

rem 检查Git状态
echo 1. 检查当前Git状态...
"%GIT_EXE%" status
echo.

rem 添加所有文件
echo 2. 添加所有文件到Git...
"%GIT_EXE%" add .
echo.

rem 提交更改
echo 3. 提交更改...
"%GIT_EXE%" commit -m "更新代码并修复问题" --allow-empty
echo.

rem 检查远程仓库配置
echo 4. 检查远程仓库配置...
"%GIT_EXE%" remote -v
echo.

rem 添加远程仓库（如果不存在）
echo 5. 确保远程仓库已配置...
"%GIT_EXE%" remote add origin https://github.com/wang13007/EMSTOOLS.git 2>nul || echo 远程仓库已存在，跳过添加步骤
echo.

rem 推送代码到GitHub
echo 6. 推送代码到GitHub...
echo 注意: 首次推送可能需要输入GitHub凭据
echo.
"%GIT_EXE%" push origin master --force
echo.

rem 检查推送结果
if %ERRORLEVEL% equ 0 (
    echo ======================================================================
    echo 成功: 代码已成功推送到GitHub！
    echo 您可以在以下地址查看代码:
    echo https://github.com/wang13007/EMSTOOLS.git
    echo ======================================================================
) else (
    echo ======================================================================
    echo 失败: 代码推送失败
    echo 可能的原因:
    echo 1. 网络连接问题
    echo 2. GitHub凭据错误
    echo 3. 仓库权限问题
    echo 请检查上述问题后重试
    echo ======================================================================
)

echo.
echo 操作完成，按任意键退出...
pause >nul
