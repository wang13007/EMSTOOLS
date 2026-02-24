@echo off

rem 直接运行git命令
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "修改用户管理功能"
"C:\Program Files\Git\bin\git.exe" push origin master --force
