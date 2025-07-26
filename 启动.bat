@echo off
chcp 65001 > nul

echo 正在启动 RTMP/HTTP 服务器...
echo.
echo 请勿关闭此窗口，服务器正在运行...
:start_server
node server.js
echo 服务器已关闭，正在尝试重启...
timeout /t 5 /nobreak > nul
goto start_server
