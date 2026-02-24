@echo off

rem 使用短路径格式
set g="C:\Progra~1\Git\bin\git.exe"

rem 推送代码
%g% add .
%g% commit -m "修改用户管理功能"
%g% push origin master --force
