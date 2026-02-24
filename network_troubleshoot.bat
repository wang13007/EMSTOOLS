@echo off

echo === 网络连接故障排除 ===
echo.

rem 检查网络连接
echo 1. 检查网络连接...
ping github.com -n 4
echo.

rem 检查DNS解析
echo 2. 检查DNS解析...
nslookup github.com
echo.

rem 检查代理设置
echo 3. 检查代理设置...
netsh winhttp show proxy
echo.

rem 检查防火墙状态
echo 4. 检查Windows防火墙状态...
netsh advfirewall show allprofiles state
echo.

rem 检查TLS版本
echo 5. 检查TLS版本支持...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol"
echo.

echo === 故障排除完成 ===
echo.
echo 请检查上述输出，确认网络连接状态。
echo 如果仍然无法连接，请尝试以下方法：
echo 1. 检查网络连接是否稳定
echo 2. 禁用防火墙或代理服务器
echo 3. 尝试使用VPN连接
echo 4. 等待一段时间后重试
echo 5. 检查GitHub服务器状态：https://www.githubstatus.com/
echo.
pause
