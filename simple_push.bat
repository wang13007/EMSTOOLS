@echo off
cd /d "E:\EMSTools\ems-售前调研工具"
git init
echo node_modules/ > .gitignore
echo dist/ >> .gitignore
echo .env.local >> .gitignore
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/wang13007/EMSTOOLS.git
git push -u origin master --force
echo Push completed.
pause
