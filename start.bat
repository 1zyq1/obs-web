@echo off
chcp 65001 > nul
echo 正在安装 Node.js 模块...
call npm install node-media-server express

echo 正在启动 RTMP/HTTP 服务器...
echo.
echo 请勿关闭此窗口，服务器正在运行...
node server.js

echo 正在打开网页播放器...
start http://localhost:8002

echo 设置完成。请在OBS中开始推流。
echo.
echo 按任意键退出此窗口...
pause
