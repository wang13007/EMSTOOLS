@echo off

rem 推送代码到GitHub
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "修改用户管理功能，支持邮箱、手机号和多角色选择"
"C:\Program Files\Git\bin\git.exe" push origin master --force
