@echo off

REM 切换到项目目录
cd /d "E:\EMSTools\ems-售前调研工具"

echo 当前目录: %cd%
echo.

REM 检查Git是否安装
where git > nul 2> nul
if %errorlevel% neq 0 (
    echo Git未安装，请先安装Git
    pause
    exit /b 1
)

echo Git版本:
git --version
echo.

REM 检查是否已经是Git仓库
if not exist ".git" (
    echo 初始化Git仓库...
    git init
    echo.
)

REM 检查.gitignore文件
if not exist ".gitignore" (
    echo 创建.gitignore文件...
    echo node_modules/ > .gitignore
    echo dist/ >> .gitignore
    echo .env.local >> .gitignore
    echo *.log >> .gitignore
    echo.
)

REM 添加所有文件
echo 添加所有文件...
git add .
echo.

REM 提交更改
echo 提交更改...
git commit -m "Initial commit" --allow-empty
echo.

REM 添加远程仓库
echo 添加远程仓库...
git remote remove origin 2> nul
git remote add origin https://github.com/wang13007/EMSTOOLS.git
echo.

REM 推送代码
echo 推送代码到GitHub...
git push -u origin master --force

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
pause > nul
