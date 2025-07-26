@echo off
chcp 65001 > nul
echo 正在安装 Node.js 模块...
call npm install node-media-server express
echo 安装完成
pause