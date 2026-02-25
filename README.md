# n8n-nodes-image-to-video

[![npm version](https://img.shields.io/npm/v/n8n-nodes-image-to-video.svg)](https://www.npmjs.com/package/n8n-nodes-image-to-video)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![n8n community](https://img.shields.io/badge/n8n-community%20node-orange)](https://community.n8n.io)

> Convert a static image into a video clip — perfect for social media **Reels, Stories, TikTok, YouTube Shorts**, and more — directly inside your n8n workflow.

---

## ✨ Features

| Feature               | Details                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| **Size Presets**      | Reel/Story 9:16, Portrait 4:5, Square 1:1, Landscape 16:9, or fully Custom |
| **Dynamic Duration**  | 1–300 seconds                                                              |
| **Frame Rate**        | 1–60 fps                                                                   |
| **Animation Effects** | Static hold, Zoom In, Zoom Out (Ken Burns), Pan Left, Pan Right, Fade In   |
| **Output Formats**    | MP4 (H.264 / H.265), WebM (VP9), GIF                                       |
| **Background Fill**   | Color picker for letterbox / pillarbox padding                             |
| **Binary Field**      | Configurable input and output binary field names                           |
| **No system deps**    | FFmpeg is bundled — works on any self-hosted instance out of the box       |

---

## 📦 Installation

### From the n8n UI (recommended)

1. Open your n8n instance
2. Go to **Settings → Community nodes**
3. Click **Install a community node**
4. Enter: `n8n-nodes-image-to-video`
5. Click **Install**

> No extra setup needed. FFmpeg is bundled with the package — it works on Hostinger, Railway, Render, VPS, Docker, and any self-hosted n8n instance.

### Via npm (self-hosted CLI)

```bash
npm install n8n-nodes-image-to-video
```

---

## 🚀 Quick Start Workflow

```
[HTTP Request] → [Image to Video] → [Write Binary File]
```

1. **HTTP Request** — fetch an image URL (set Response Format to `File`)
2. **Image to Video** — configure preset and duration
3. **Write Binary File** — save the MP4 to disk

---

## ⚙️ Node Parameters

| Parameter             | Type      | Default       | Description                              |
| --------------------- | --------- | ------------- | ---------------------------------------- |
| Input Binary Field    | `string`  | `data`        | Binary field containing the source image |
| Size Preset           | `options` | `Reel/Story`  | Output video dimensions                  |
| Width (px)            | `number`  | `1080`        | Custom width (only with Custom preset)   |
| Height (px)           | `number`  | `1920`        | Custom height (only with Custom preset)  |
| Duration (seconds)    | `number`  | `5`           | Video length in seconds                  |
| Frame Rate (fps)      | `number`  | `30`          | Frames per second                        |
| Output Codec / Format | `options` | `H.264 – MP4` | Codec and container                      |
| Background Color      | `color`   | `#000000`     | Fill color for padding                   |
| Animation Effect      | `options` | `None`        | Motion effect                            |
| Output Binary Field   | `string`  | `video`       | Binary field for the output video        |

### Animation Effects

| Effect                | Description                             |
| --------------------- | --------------------------------------- |
| **None**              | Still image — no movement               |
| **Zoom In**           | Ken Burns slow zoom from 100% to 115%   |
| **Zoom Out**          | Ken Burns slow zoom from 115% to 100%   |
| **Pan Left to Right** | Horizontal pan across image             |
| **Pan Right to Left** | Reverse horizontal pan                  |
| **Fade In**           | Image fades in from black over 1 second |

---

## 🔧 Output

The node outputs the same item with:

- **`binary.[outputField]`** — the encoded video file
- **`json.imageToVideo`** — metadata: `{ width, height, duration, fps, codec, format, effect, sizeBytes }`

---

## 🌐 Compatibility

| Platform              | Supported                          |
| --------------------- | ---------------------------------- |
| Self-hosted (Linux)   | ✅                                 |
| Self-hosted (Windows) | ✅                                 |
| Self-hosted (macOS)   | ✅                                 |
| Docker / Hostinger    | ✅                                 |
| Railway / Render      | ✅                                 |
| n8n Cloud             | ❌ (community nodes not supported) |

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss major changes.

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit your changes
4. Push and open a Pull Request

---

## 📄 License

MIT [EMAIL_ADDRESS](fidevp27@gmail.com)

---

## 🔗 Links

- [npm package](https://www.npmjs.com/package/n8n-nodes-image-to-video)
- [n8n Community Forum](https://community.n8n.io)
- [n8n Documentation – Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [Report an Issue](https://github.com/YOUR_USERNAME/n8n-nodes-image-to-video/issues)
