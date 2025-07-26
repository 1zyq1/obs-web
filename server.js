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

app.use(express.json()); // 用于解析 JSON 请求体

// 验证管理员密码的中间件
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: '未提供授权令牌' });
  }
  const token = authHeader.split(' ')[1]; // 假设格式为 "Bearer your_password"

  // 重新读取 config.json 以获取最新的 adminPassword
  fs.readFile(path.join(__dirname, 'config.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('读取 config.json 错误:', err);
      return res.status(500).json({ message: '服务器内部错误' });
    }
    const currentConfig = JSON.parse(data);
    if (token === currentConfig.adminPassword) {
      next();
    } else {
      res.status(401).json({ message: '密码错误' });
    }
  });
};

app.get('/', (req, res) => {
  // 读取 index.html 内容并替换占位符
  const indexPath = path.join(__dirname, 'index.html');
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      console.error('读取 index.html 错误:', err);
      return res.status(500).send('加载播放器页面错误。');
    }
    const modifiedHtml = data.replace('[[FLV_STREAM_URL]]', config.flvStreamUrl);
    res.send(modifiedHtml);
  });
});

// 管理页面路由
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// 登录 API
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  fs.readFile(path.join(__dirname, 'config.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('读取 config.json 错误:', err);
      return res.status(500).json({ message: '服务器内部错误' });
    }
    const currentConfig = JSON.parse(data);
    if (password === currentConfig.adminPassword) {
      res.json({ message: '登录成功' });
    } else {
      res.status(401).json({ message: '密码错误' });
    }
  });
});

// 获取配置 API (需要认证)
app.get('/api/config', authenticateAdmin, (req, res) => {
  fs.readFile(path.join(__dirname, 'config.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('读取 config.json 错误:', err);
      return res.status(500).json({ message: '服务器内部错误' });
    }
    const currentConfig = JSON.parse(data);
    // 不发送 adminPassword 到前端
    const { adminPassword, _comment_adminPassword, ...configWithoutPassword } = currentConfig;
    res.json(configWithoutPassword);
  });
});

// 保存配置 API (需要认证)
app.post('/api/config', authenticateAdmin, (req, res) => {
  const newConfig = req.body;
  const currentPassword = req.headers['authorization'].split(' ')[1]; // 从认证头获取当前密码

  fs.readFile(path.join(__dirname, 'config.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('读取 config.json 错误:', err);
      return res.status(500).json({ message: '服务器内部错误' });
    }
    const oldConfig = JSON.parse(data);

    // 如果前端提供了新密码，则更新密码；否则保留旧密码
    if (newConfig.adminPassword && newConfig.adminPassword !== oldConfig.adminPassword) {
      oldConfig.adminPassword = newConfig.adminPassword;
    }
    // 移除前端可能发送的注释字段，并合并新配置
    for (const key in newConfig) {
      if (key.startsWith('_comment_')) {
        delete newConfig[key];
      }
    }

    // 合并新配置到旧配置，保留旧的注释
    const finalConfig = { ...oldConfig };
    for (const key in newConfig) {
        if (key !== 'adminPassword') { // adminPassword 已经单独处理
            if (typeof newConfig[key] === 'object' && newConfig[key] !== null && !Array.isArray(newConfig[key])) {
                // 递归合并对象，保留注释
                finalConfig[key] = { ...oldConfig[key], ...newConfig[key] };
            } else {
                finalConfig[key] = newConfig[key];
            }
        }
    }

    // 确保注释被保留
    for (const key in oldConfig) {
        if (key.startsWith('_comment_')) {
            finalConfig[key] = oldConfig[key];
        }
    }
    // 确保新添加的 adminPassword 注释被保留
    if (oldConfig._comment_adminPassword) {
        finalConfig._comment_adminPassword = oldConfig._comment_adminPassword;
    }


    fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(finalConfig, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('写入 config.json 错误:', err);
        return res.status(500).json({ message: '保存配置失败' });
      }
      res.json({ message: '配置保存成功' });
    });
  });
});

// 重启服务器 API (需要认证)
app.post('/api/restart', authenticateAdmin, (req, res) => {
  res.json({ message: '服务器正在重启...' });
  console.log('接收到重启请求，服务器将在短时间内重启。');
  // 延迟退出，确保响应已发送
  setTimeout(() => {
    process.exit(0); // 优雅地退出进程
  }, 1000);
});


app.listen(config.webPlayerPort, () => { // 使用配置文件中的网页播放器端口
  console.log(`HTTP server for static files listening on http://localhost:${config.webPlayerPort}`);
  console.log(`管理页面访问：http://localhost:${config.webPlayerPort}/admin`);
});

console.log('NodeMediaServer 正在运行！');
console.log(`RTMP 服务器正在监听：rtmp://localhost:${config.rtmp.port}/live`);
console.log(`HTTP 服务器（用于FLV/HLS流）正在监听：http://localhost:${config.http.port}`);
console.log(`您可以从OBS推流到：rtmp://localhost:${config.rtmp.port}/live/${config.streamKey}`);
console.log(`您可以在浏览器中查看流：http://localhost:${config.http.port}/live/${config.streamKey}.flv (FLV格式)`);
console.log(`访问网页播放器：http://localhost:${config.webPlayerPort}`);
