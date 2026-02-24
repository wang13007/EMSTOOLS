# 检查Git状态
& "C:\Program Files\Git\bin\git.exe" status

# 添加所有修改的文件
& "C:\Program Files\Git\bin\git.exe" add .

# 提交更改
& "C:\Program Files\Git\bin\git.exe" commit -m "修改用户管理功能，支持邮箱、手机号和多角色选择"

# 推送到GitHub
& "C:\Program Files\Git\bin\git.exe" push origin master --force
