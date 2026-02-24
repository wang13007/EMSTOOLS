@echo off

rem 使用完整路径
set "GIT_EXE=C:\Program Files\Git\bin\git.exe"

rem 切换到项目目录
cd /d "e:\EMSTools\ems-售前调研工具"

rem 推送代码
%GIT_EXE% add .
%GIT_EXE% commit -m "修改用户管理功能，支持邮箱、手机号和多角色选择"
%GIT_EXE% push origin master --force
