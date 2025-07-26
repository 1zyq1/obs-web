const NodeMediaServer = require('node-media-server');
const express = require('express'); // 引入 express
const path = require('path'); // 引入 path 模块
const fs = require('fs'); // 引入 fs 模块
const config = require('./config.json'); // 引入配置文件

const app = express(); // 创建 express 应用

// NodeMediaServer 配置
const nmsConfig = {
  rtmp: config.rtmp,
  http: config.http,
  webSocket: config.webSocket,
  trans: {
    ffmpeg: config.trans.ffmpegPath,
    tasks: config.trans.tasks
  }
};

var nms = new NodeMediaServer(nmsConfig);
nms.run();

app.get('/', (req, res) => {
  // 读取 index.html 内容并替换占位符
  const indexPath = path.join(__dirname, 'index.html');
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      console.error('读取 index.html 错误:', err);
      return res.status(500).send('加载播放器页面错误。');
    }
    console.log('--- index.html 原始内容片段 (前200字符) ---');
    console.log(data.substring(0, 200));
    console.log('--- 占位符是否存在:', data.includes('[[FLV_STREAM_URL]]'));
    const modifiedHtml = data.replace('[[FLV_STREAM_URL]]', config.flvStreamUrl);
    console.log('--- 替换后的 HTML 内容片段 (前200字符) ---');
    console.log(modifiedHtml.substring(0, 200));
    res.send(modifiedHtml);
  });
});

app.listen(config.webPlayerPort, () => { // 使用配置文件中的网页播放器端口
  console.log(`HTTP server for static files listening on http://localhost:${config.webPlayerPort}`);
});

console.log('NodeMediaServer 正在运行！');
console.log(`RTMP 服务器正在监听：rtmp://localhost:${config.rtmp.port}/live`);
console.log(`HTTP 服务器（用于FLV/HLS流）正在监听：http://localhost:${config.http.port}`);
console.log(`您可以从OBS推流到：rtmp://localhost:${config.rtmp.port}/live/${config.streamKey}`);
console.log(`您可以在浏览器中查看流：http://localhost:${config.http.port}/live/${config.streamKey}.flv (FLV格式)`);
console.log(`访问网页播放器：http://localhost:${config.webPlayerPort}`);
