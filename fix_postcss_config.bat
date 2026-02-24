@echo off

rem 使用完整路径
set "GIT_EXE=C:\Program Files\Git\bin\git.exe"

rem 切换到项目目录
cd /d "e:\EMSTools\ems-售前调研工具"

rem 查看当前状态
%GIT_EXE% status

rem 添加更改
%GIT_EXE% add postcss.config.cjs

rem 提交更改
%GIT_EXE% commit -m "fix: rename postcss config to cjs"

rem 推送更改
%GIT_EXE% push origin master --force

rem 查看结果
%GIT_EXE% status

pause