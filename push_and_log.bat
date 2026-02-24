@echo off

rem 使用短路径格式
set "GIT_EXE=C:\Progra~1\Git\bin\git.exe"

rem 执行git命令并将输出重定向到文件
echo 执行git add . > push_output.txt
%GIT_EXE% add . >> push_output.txt 2>&1
echo. >> push_output.txt

echo 执行git commit >> push_output.txt
%GIT_EXE% commit -m "修改用户管理功能" >> push_output.txt 2>&1
echo. >> push_output.txt

echo 执行git push >> push_output.txt
%GIT_EXE% push origin master --force >> push_output.txt 2>&1
echo. >> push_output.txt

echo 执行完成 >> push_output.txt
