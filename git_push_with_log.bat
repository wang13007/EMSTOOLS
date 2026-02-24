@echo off

rem 设置Git可执行文件路径
set "GIT_EXE=C:\Program Files\Git\bin\git.exe"

rem 检查Git是否存在
if not exist "%GIT_EXE%" (
    echo Git可执行文件不存在，请检查路径是否正确
    pause
    exit /b 1
)

echo 开始推送代码到GitHub...
echo 执行时间: %date% %time%
echo. > git_push_log.txt
echo 执行时间: %date% %time% >> git_push_log.txt
echo. >> git_push_log.txt

rem 切换到项目目录
cd /d "e:\EMSTools\ems-售前调研工具"
echo 当前目录: %CD% >> git_push_log.txt
echo. >> git_push_log.txt

rem 检查当前目录状态
echo 1. 检查当前Git状态...
echo 1. 检查当前Git状态... >> git_push_log.txt
"%GIT_EXE%" status >> git_push_log.txt 2>&1
echo. >> git_push_log.txt

rem 添加所有文件
echo 2. 添加所有文件...
echo 2. 添加所有文件... >> git_push_log.txt
"%GIT_EXE%" add . >> git_push_log.txt 2>&1
echo. >> git_push_log.txt

rem 提交更改
echo 3. 提交更改...
echo 3. 提交更改... >> git_push_log.txt
"%GIT_EXE%" commit -m "修改用户管理功能，支持邮箱、手机号和多角色选择" >> git_push_log.txt 2>&1
echo. >> git_push_log.txt

rem 检查远程仓库配置
echo 4. 检查远程仓库配置...
echo 4. 检查远程仓库配置... >> git_push_log.txt
"%GIT_EXE%" remote -v >> git_push_log.txt 2>&1
echo. >> git_push_log.txt

rem 推送到GitHub
echo 5. 推送到GitHub...
echo 5. 推送到GitHub... >> git_push_log.txt
"%GIT_EXE%" push origin master --force >> git_push_log.txt 2>&1
echo. >> git_push_log.txt

rem 检查推送结果
if %ERRORLEVEL% equ 0 (
    echo 代码推送成功！
    echo 代码推送成功！ >> git_push_log.txt
    echo 您可以在 https://github.com/wang13007/EMSTOOLS.git 查看代码 >> git_push_log.txt
) else (
    echo 代码推送失败，请查看日志文件了解详细信息。
    echo 代码推送失败！ >> git_push_log.txt
)

echo.
echo 操作完成，详细日志已保存到 git_push_log.txt 文件中。
echo 操作完成 >> git_push_log.txt

rem 显示日志文件内容
echo.
echo 日志内容:
echo.
type git_push_log.txt

echo.
pause
