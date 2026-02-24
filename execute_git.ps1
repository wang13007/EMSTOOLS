# 直接执行git命令
& 'C:\Program Files\Git\bin\git.exe' add .
& 'C:\Program Files\Git\bin\git.exe' commit -m 'Update code' --allow-empty
& 'C:\Program Files\Git\bin\git.exe' remote add origin https://github.com/wang13007/EMSTOOLS.git 2>$null
& 'C:\Program Files\Git\bin\git.exe' push origin master --force
