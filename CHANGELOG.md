# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] – 2026-02-23

### Added

- Initial release of the **Image to Video** n8n community node.
- **Size presets**: Reel/Story (9:16), Portrait (4:5), Square (1:1), Landscape (16:9), Custom.
- **Dynamic parameters**: Width, Height, Duration (1–300 s), Frame Rate (1–60 fps).
- **Output codecs**: H.264 (MP4), H.265 (MP4), VP9 (WebM), GIF.
- **Animation effects**: None (static hold), Zoom In, Zoom Out (Ken Burns), Pan Left, Pan Right, Fade In.
- **Background color** picker for letterbox / pillarbox fill.
- Configurable **input** and **output binary field names** for flexible workflow integration.
- Image pre-processing via `sharp` (resize + pad + letterbox preserving aspect ratio).
- Web-optimised MP4 output with `movflags +faststart`.
- Graceful error handling with descriptive `NodeOperationError` messages.
- Temp file cleanup after conversion.
