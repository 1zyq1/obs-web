# OBS 网页推流解决方案

这是一个基于 Node.js 和 FLV.js 的 OBS 网页推流解决方案，旨在帮助您将 OBS Studio 的直播画面实时（低延迟 FLV）显示在网页上。

## ✨ 功能特点

*   **本地流媒体服务器：** 使用 Node.js 搭建轻量级 RTMP 服务器，接收 OBS 推流。
*   **FLV 网页播放器：** 提供一个简洁的 HTML 页面，通过 FLV.js 播放器显示直播画面。
*   **无默认控件：** 网页播放器不显示任何默认的视频控制条和进度条，提供纯净的观看体验。
*   **双击全屏：** 双击视频区域即可快速切换全屏模式。
*   **高度可配置：** 所有关键配置项都集中在 `config.json` 文件中，方便修改。
*   **自动化启动：** 提供 `start.bat` 批处理文件，一键完成模块安装、服务器启动和网页打开。
*   **中文日志：** 服务器和批处理文件日志输出已汉化，方便理解。

## 🚀 快速开始

### 前置条件

1.  **Node.js 环境：** 确保您的电脑上安装了 Node.js (包含 npm)。
    *   下载地址：[https://nodejs.org/](https://nodejs.org/) (推荐下载 LTS 版本)
2.  **OBS Studio：** 用于推流的直播软件。
    *   下载地址：[https://obsproject.com/](https://obsproject.com/)
3.  **FFmpeg (可选，仅用于 HLS/WebRTC 转码)：** 如果您未来需要 HLS 或 WebRTC 流，请确保已安装 FFmpeg。对于 FLV 流，FFmpeg 不是必需的。
    *   下载地址：[https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
    *   **重要：** 如果您下载了预编译的 FFmpeg，请将 `ffmpeg.exe` (以及 `ffplay.exe`, `ffprobe.exe`) 复制到项目根目录下的 `ffmpeg/bin/` 文件夹中。例如：`./ffmpeg/bin/ffmpeg.exe`。

### 安装与运行

1.  **下载项目：** 将本项目克隆或下载到您的本地电脑。
2.  **一键启动：**
    *   进入项目根目录 `c:/Users/Sz137/Desktop/obs`。
    *   **双击运行 `start.bat` 文件。**

    这个批处理文件将自动完成以下操作：
    *   安装所需的 Node.js 模块 (`node-media-server` 和 `express`)。
    *   在一个新的终端窗口中启动 `server.js` (RTMP/HTTP 流媒体服务器)。
    *   自动在您的默认浏览器中打开网页播放器 (`http://localhost:8002`)。
    *   **注意：** 运行 `start.bat` 后，命令行窗口中的中文输出应该会正常显示。

### OBS 配置

1.  **打开 OBS Studio。**
2.  进入 **“设置”** -> **“推流”**。
3.  **“服务”** 选择 **“自定义”**。
4.  **“服务器”** 填写：`rtmp://localhost:1935/live` (此端口可在 `config.json` 中修改)
5.  **“推流码”** 填写：`streamkey` (此值可在 `config.json` 中修改)
6.  点击 **“应用”** 和 **“确定”**，然后点击 OBS 主界面的 **“开始推流”**。

### 网页播放器使用

1.  在您双击 `start.bat` 后，浏览器会自动打开网页播放器 (`http://localhost:8002`)。
2.  网页加载后，视频应该会**自动静音播放**。
3.  **双击视频区域**即可切换全屏模式。

如果 OBS 正在推流到您本地运行的服务器，您应该能在网页上看到 OBS 的直播画面。

## ⚙️ 配置文件 (`config.json`)

所有关键配置项都集中在 `config.json` 文件中，您可以根据需要进行修改。

```json
{
  "rtmp": {
    "port": 1935,
    "_comment_port": "RTMP服务器监听端口，OBS推流到此端口",
    "chunk_size": 60000,
    "_comment_chunk_size": "RTMP数据块大小",
    "gop_cache": true,
    "_comment_gop_cache": "是否缓存GOP（Group of Pictures），用于快速播放",
    "ping": 30,
    "_comment_ping": "RTMP连接ping间隔（秒）",
    "ping_timeout": 60,
    "_comment_ping_timeout": "RTMP连接ping超时（秒）"
  },
  "http": {
    "port": 8000,
    "_comment_port": "HTTP服务器监听端口，用于提供FLV/HLS流",
    "allow_origin": "*",
    "_comment_allow_origin": "允许跨域访问的源，'*'表示允许所有"
  },
  "webSocket": {
    "port": 8001,
    "_comment_port": "WebRTC信令服务器监听端口",
    "allow_origin": "*",
    "_comment_allow_origin": "允许跨域访问的源，'*'表示允许所有"
  },
  "trans": {
    "ffmpegPath": "./ffmpeg/bin/ffmpeg.exe",
    "_comment_ffmpegPath": "FFmpeg 可执行文件路径，用于视频转码（HLS/WebRTC需要）",
    "tasks": [
      {
        "app": "live",
        "_comment_app": "应用名称，OBS推流地址的一部分（rtmp://localhost:port/app/streamkey）",
        "vc": "libx264",
        "_comment_vc": "视频编码器",
        "vcParam": ["-preset", "fast", "-crf", "23", "-profile:v", "main", "-level", "3.1"],
        "_comment_vcParam": "视频编码参数",
        "ac": "aac",
        "_comment_ac": "音频编码器",
        "acParam": ["-ab", "128k", "-ar", "44100", "-ac", "2"],
        "_comment_acParam": "音频编码参数",
        "rtmp": true,
        "_comment_rtmp": "是否启用RTMP转发",
        "rtmpApp": "live",
        "_comment_rtmpApp": "RTMP转发的应用名称",
        "webrtc": true,
        "_comment_webrtc": "是否启用WebRTC转码（需要FFmpeg）"
      }
    ]
  },
  "streamKey": "streamkey",
  "_comment_streamKey": "OBS推流码，例如：rtmp://localhost:1935/live/streamkey 中的 'streamkey'",
  "webPlayerPort": 8002,
  "_comment_webPlayerPort": "网页播放器访问端口，浏览器访问 http://localhost:8002",
  "flvStreamUrl": "http://localhost:8000/live/streamkey.flv",
  "_comment_flvStreamUrl": "网页播放器默认加载的FLV流URL"
}
```

## ⚠️ 注意事项

*   **本地测试环境：** 本项目主要用于本地测试和学习。如果您需要将直播画面分享给其他人，您需要一个具有公网 IP 的服务器，并进行相应的网络配置（例如，端口转发、防火墙设置）。
*   **浏览器自动播放策略：** 现代浏览器通常会阻止没有用户交互的视频自动播放。本项目通过将视频设置为静音来尝试绕过此限制。
*   **内存占用：** 播放直播流时，浏览器内存占用会随时间增加，这是正常现象。如果内存占用过高，可以尝试刷新页面。
*   **FLV 文件大小：** `node-media-server` 在提供 FLV 流时通常不会无限写入磁盘。如果发现 `streamkey.flv` 文件持续变大，请检查 OBS 是否同时开启了录制功能。
