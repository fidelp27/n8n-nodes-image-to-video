import {
  IBinaryData,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

import ffmpeg from 'fluent-ffmpeg';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg') as { path: string };
import sharp from 'sharp';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as path from 'path';

// ─── Size presets ────────────────────────────────────────────────────────────
const SIZE_PRESETS: Record<string, { width: number; height: number }> = {
  reel_story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  custom: { width: 0, height: 0 }, // resolved at runtime
};

// ─── Codec → container map ───────────────────────────────────────────────────
const CODEC_FORMAT: Record<string, string> = {
  libx264: 'mp4',
  libx265: 'mp4',
  'libvpx-vp9': 'webm',
  gif: 'gif',
};

export class ImageToVideo implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Image to Video',
    name: 'imageToVideo',
    icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDIwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVkctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4wIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiB3aWR0aD0iMTI4MC4wMDAwMDBwdCIgaGVpZ2h0PSIxMjgwLjAwMDAwMHB0IiB2aWV3Qm94PSIwIDAgMTI4MC4wMDAwMDAgMTI4MC4wMDAwMDAiCiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0Ij4KPG1ldGFkYXRhPgpDcmVhdGVkIGJ5IHBvdHJhY2UgMS4xNSwgd3JpdHRlbiBieSBQZXRlciBTZWxpbmdlciAyMDAxLTIwMTcKPC9tZXRhZGF0YT4KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsMTI4MC4wMDAwMDApIHNjYWxlKDAuMTAwMDAwLC0wLjEwMDAwMCkiCmZpbGw9IiMwMDAwMDAiIHN0cm9rZT0ibm9uZSI+CjxwYXRoIGQ9Ik02MTIwIDEyNzk0IGMtNzEwIC00OCAtMTIwNSAtMTQyIC0xNzkwIC0zNDIgLTY3NCAtMjMxIC0xMzMxIC01ODUKLTE4ODUgLTEwMTcgLTMwMiAtMjM2IC03MjIgLTYzOSAtOTUyIC05MTUgLTg1MSAtMTAyMSAtMTMzOSAtMjIwMiAtMTQ2OQotMzU1NSAtMjIgLTIyNCAtMjUgLTgyNiAtNiAtMTA0NSA1MCAtNTcwIDE1MCAtMTA1NCAzMjAgLTE1NjAgMzk4IC0xMTc5IDExMTIKLTIyMDMgMjA2NyAtMjk2NSA5MjAgLTczMyAyMDIzIC0xMTk3IDMyMDAgLTEzNDQgMzExIC0zOSA0MjUgLTQ1IDgwMCAtNDUgMzcyCjAgNTUyIDExIDg0MCA1MCAxMjEwIDE2MyAyMzM5IDY2MyAzMjk1IDE0NTkgMTk1IDE2MiA2MDggNTc0IDc2NyA3NjUgODUxCjEwMjIgMTMzOSAyMjAyIDE0NjkgMzU1NSAyMiAyMjQgMjUgODI2IDYgMTA0NSAtMzkgNDQ2IC0xMDggODM0IC0yMTcgMTIyNQotMjUwIDg5OCAtNjc3IDE3MTEgLTEyODQgMjQ0MCAtMTU4IDE5MCAtNTcyIDYwNCAtNzYxIDc2MiAtMTAxOSA4NDkgLTIyMTQKMTM0MyAtMzU1MCAxNDY5IC0xNTQgMTQgLTcyNCAyNiAtODUwIDE4eiBtNzE3IC0xMjc5IGM3ODcgLTcyIDE0ODMgLTI5NSAyMTU4Ci02ODggODU3IC01MDAgMTU3MCAtMTI2NiAyMDA1IC0yMTUyIDI3NSAtNTU5IDQyOSAtMTA4NSA1MDYgLTE3MjggMjUgLTIwMiAzMAotNzU1IDEwIC05NzMgLTYyIC02NzMgLTIyMyAtMTI1MyAtNTExIC0xODM5IC00OTcgLTEwMTAgLTEzMjkgLTE4NDMgLTIzMzAKLTIzMzUgLTU1OSAtMjc1IC0xMDg1IC00MjkgLTE3MjggLTUwNiAtMjAyIC0yNSAtNzU1IC0zMCAtOTczIC0xMCAtNzk5IDczCi0xNDkxIDI5NCAtMjE2OSA2ODkgLTExNTggNjc2IC0yMDMyIDE4MjMgLTIzNjYgMzEwMiAtMTE3IDQ1MiAtMTYzIDgxMiAtMTYyCjEyOTAgMCA1MzIgNjcgOTkzIDIxNCAxNDgyIDMxNiAxMDQ5IDk0NyAxOTY5IDE4MDMgMjYzMiAzNTkgMjc4IDc1NyA1MDggMTE2Ngo2NzQgNDU3IDE4NiA5NjcgMzEyIDE0NDAgMzU2IDYzIDYgMTMxIDEzIDE1MCAxNCAxMTEgMTEgNjQyIDUgNzg3IC04eiIvPgo8cGF0aCBkPSJNNDk4MCA4NjQ4IGMtNjAgLTMxIC05OSAtOTIgLTE0MSAtMjIwIGwtMzQgLTEwMyAyIC02NDAgYzEgLTM1MiA3Ci0xMjM0IDEzIC0xOTYwIDExIC0xMjI2IDEzIC0xMzI2IDMwIC0xNDAwIDY3IC0yODkgMTc5IC0zNDIgNTA2IC0yMzcgMTIgNAo3NzQgNDQxIDE2OTQgOTcyIDE1NjcgOTA0IDE2NzcgOTY5IDE3NDAgMTAzMiA5MiA5MSAxMzQgMTc0IDEyOCAyNTUgLTYgODEKLTQxIDE0NiAtMTIzIDIyOCAtNjcgNjcgLTE0MSAxMTEgLTE3NjAgMTA1MSAtMTE4NiA2ODkgLTE3MDkgOTg4IC0xNzU1IDEwMDIKLTE1MSA0OCAtMjM0IDUzIC0zMDAgMjB6Ii8+CjwvZz4KPC9zdmc+Cg==',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["sizePreset"] !== "custom" ? $parameter["sizePreset"] : $parameter["outputWidth"] + "x" + $parameter["outputHeight"]}} · {{$parameter["duration"]}}s',
    description:
      'Convert a static image into a video clip with dynamic size, duration, and effects. Ideal for social media Reels, Stories, and video posts. Requires FFmpeg installed on the host.',
    defaults: {
      name: 'Image to Video',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      // ── Input ──────────────────────────────────────────────────────────────
      {
        displayName: 'Input Binary Field',
        name: 'inputBinaryField',
        type: 'string',
        default: 'data',
        required: true,
        description:
          'Name of the binary field containing the source image (e.g. data, image, file)',
      },

      // ── Size ───────────────────────────────────────────────────────────────
      {
        displayName: 'Size Preset',
        name: 'sizePreset',
        type: 'options',
        options: [
          {
            name: 'Reel / Story (9:16 · 1080×1920)',
            value: 'reel_story',
            description: 'Vertical format for Instagram Reels, TikTok, YouTube Shorts',
          },
          {
            name: 'Portrait (4:5 · 1080×1350)',
            value: 'portrait',
            description: 'Tall portrait format for Instagram feed',
          },
          {
            name: 'Square (1:1 · 1080×1080)',
            value: 'square',
            description: 'Square format for Instagram, Facebook feed',
          },
          {
            name: 'Landscape (16:9 · 1920×1080)',
            value: 'landscape',
            description: 'Widescreen format for YouTube, Facebook video',
          },
          {
            name: 'Custom',
            value: 'custom',
            description: 'Specify your own width and height',
          },
        ],
        default: 'reel_story',
        description: 'Output video dimensions (width × height)',
      },
      {
        displayName: 'Width (px)',
        name: 'outputWidth',
        type: 'number',
        typeOptions: { minValue: 128, maxValue: 7680 },
        default: 1080,
        displayOptions: { show: { sizePreset: ['custom'] } },
        description: 'Output video width in pixels (must be even)',
      },
      {
        displayName: 'Height (px)',
        name: 'outputHeight',
        type: 'number',
        typeOptions: { minValue: 128, maxValue: 7680 },
        default: 1920,
        displayOptions: { show: { sizePreset: ['custom'] } },
        description: 'Output video height in pixels (must be even)',
      },

      // ── Timing ─────────────────────────────────────────────────────────────
      {
        displayName: 'Duration (seconds)',
        name: 'duration',
        type: 'number',
        typeOptions: { minValue: 1, maxValue: 300 },
        default: 5,
        required: true,
        description: 'Length of the output video in seconds',
      },
      {
        displayName: 'Frame Rate (fps)',
        name: 'fps',
        type: 'number',
        typeOptions: { minValue: 1, maxValue: 60 },
        default: 30,
        description: 'Frames per second of the output video',
      },

      // ── Format & Codec ─────────────────────────────────────────────────────
      {
        displayName: 'Output Codec / Format',
        name: 'codec',
        type: 'options',
        options: [
          {
            name: 'H.264 – MP4 (recommended, universal)',
            value: 'libx264',
          },
          {
            name: 'H.265 – MP4 (smaller file, needs modern player)',
            value: 'libx265',
          },
          {
            name: 'VP9 – WebM (open format, good for web)',
            value: 'libvpx-vp9',
          },
          {
            name: 'GIF (animated, no audio support)',
            value: 'gif',
          },
        ],
        default: 'libx264',
        description: 'Video codec and container format',
      },

      // ── Background ─────────────────────────────────────────────────────────
      {
        displayName: 'Background Color',
        name: 'bgColor',
        type: 'color',
        default: '#000000',
        description:
          'Fill color used when the image does not cover the full frame (letterbox / pillarbox)',
      },

      // ── Effect ─────────────────────────────────────────────────────────────
      {
        displayName: 'Animation Effect',
        name: 'effect',
        type: 'options',
        options: [
          { name: 'None (static hold)', value: 'none' },
          { name: 'Zoom In (Ken Burns)', value: 'zoomin' },
          { name: 'Zoom Out (Ken Burns)', value: 'zoomout' },
          { name: 'Pan Left to Right', value: 'panright' },
          { name: 'Pan Right to Left', value: 'panleft' },
          { name: 'Fade In', value: 'fadein' },
        ],
        default: 'none',
        description: 'Motion or transition effect applied to the image',
      },

      // ── Output ─────────────────────────────────────────────────────────────
      {
        displayName: 'Output Binary Field',
        name: 'outputBinaryField',
        type: 'string',
        default: 'video',
        required: true,
        description: 'Name of the binary field where the output video will be stored',
      },
    ],
  };

  // ─── Execute ───────────────────────────────────────────────────────────────
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Use bundled ffmpeg binary (works on all platforms: Linux, Windows, macOS)
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        // ── Params ────────────────────────────────────────────────────────
        const inputField = this.getNodeParameter('inputBinaryField', itemIndex) as string;
        const outputField = this.getNodeParameter('outputBinaryField', itemIndex) as string;
        const sizePreset = this.getNodeParameter('sizePreset', itemIndex) as string;
        const duration = this.getNodeParameter('duration', itemIndex) as number;
        const fps = this.getNodeParameter('fps', itemIndex) as number;
        const codec = this.getNodeParameter('codec', itemIndex) as string;
        const bgColor = this.getNodeParameter('bgColor', itemIndex) as string;
        const effect = this.getNodeParameter('effect', itemIndex) as string;

        // Determine target dimensions
        let targetWidth: number;
        let targetHeight: number;
        if (sizePreset === 'custom') {
          targetWidth = this.getNodeParameter('outputWidth', itemIndex) as number;
          targetHeight = this.getNodeParameter('outputHeight', itemIndex) as number;
        } else {
          targetWidth = SIZE_PRESETS[sizePreset].width;
          targetHeight = SIZE_PRESETS[sizePreset].height;
        }

        // Enforce even dimensions (required by most codecs)
        targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth + 1;
        targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight + 1;

        // ── Get binary image ─────────────────────────────────────────────
        const binaryData = this.helpers.assertBinaryData(itemIndex, inputField);
        const imageBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, inputField);

        // ── Pre-process with Sharp ───────────────────────────────────────
        const bgRgb = hexToRgb(bgColor);
        const processedImageBuffer = await sharp(imageBuffer)
          .resize(targetWidth, targetHeight, {
            fit: 'contain',
            background: { r: bgRgb.r, g: bgRgb.g, b: bgRgb.b, alpha: 1 },
          })
          .flatten({ background: { r: bgRgb.r, g: bgRgb.g, b: bgRgb.b } })
          .png()
          .toBuffer();

        // ── Write temp image file ────────────────────────────────────────
        tmp.setGracefulCleanup();
        const tmpImg = tmp.fileSync({ postfix: '.png', keep: false });
        fs.writeFileSync(tmpImg.name, processedImageBuffer);

        // ── Build FFmpeg command ──────────────────────────────────────────
        const ext = codec === 'gif' ? 'gif' : CODEC_FORMAT[codec] ?? 'mp4';
        const tmpOut = tmp.fileSync({ postfix: `.${ext}`, keep: false });

        await runFfmpeg(tmpImg.name, tmpOut.name, {
          width: targetWidth,
          height: targetHeight,
          duration,
          fps,
          codec,
          effect,
        });

        // ── Read output and attach to item ───────────────────────────────
        const videoBuffer = fs.readFileSync(tmpOut.name);
        const mimeType = getMimeType(codec);
        const fileName = buildFileName(binaryData, ext);

        const videoBinaryData: IBinaryData = await this.helpers.prepareBinaryData(
          videoBuffer,
          fileName,
          mimeType,
        );

        // ── Cleanup temp files ────────────────────────────────────────────
        try { tmpImg.removeCallback(); } catch (_) { /* ignore */ }
        try { tmpOut.removeCallback(); } catch (_) { /* ignore */ }

        // ── Build output item ─────────────────────────────────────────────
        const existingBinary = items[itemIndex].binary ?? {};
        returnData.push({
          json: {
            ...items[itemIndex].json,
            imageToVideo: {
              width: targetWidth,
              height: targetHeight,
              duration,
              fps,
              codec,
              format: ext,
              effect,
              sizeBytes: videoBuffer.length,
            },
          },
          binary: {
            ...existingBinary,
            [outputField]: videoBinaryData,
          },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: { item: itemIndex },
          });
          continue;
        }
        if (error instanceof NodeOperationError) throw error;
        throw new NodeOperationError(this.getNode(), error as Error, {
          itemIndex,
          description:
            'Image-to-video conversion failed. Make sure FFmpeg is installed and the input binary contains a valid image.',
        });
      }
    }

    return [returnData];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function getMimeType(codec: string): string {
  if (codec === 'gif') return 'image/gif';
  if (codec === 'libvpx-vp9') return 'video/webm';
  return 'video/mp4';
}

function buildFileName(binaryData: IBinaryData, ext: string): string {
  const base = binaryData.fileName
    ? path.parse(binaryData.fileName).name
    : 'output';
  return `${base}_video.${ext}`;
}

interface FfmpegOptions {
  width: number;
  height: number;
  duration: number;
  fps: number;
  codec: string;
  effect: string;
}

function buildVideoFilter(opts: FfmpegOptions, forGif = false): string {
  const { width, height, duration, fps, effect } = opts;
  const totalFrames = duration * fps;

  // GIF doesn't support yuv420p — use its own pixel format
  const pixFmt = forGif ? '' : ',format=yuv420p';
  const baseScale = `scale=${width}:${height}:flags=lanczos${pixFmt}`;

  switch (effect) {
    case 'zoomin': {
      const zpFilter =
        `zoompan=z='min(zoom+0.0005,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'` +
        `:d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
      return `${zpFilter},${baseScale}`;
    }
    case 'zoomout': {
      const zpFilter =
        `zoompan=z='if(lte(zoom,1.0),1.15,max(1.0,zoom-0.0005))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'` +
        `:d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
      return `${zpFilter},${baseScale}`;
    }
    case 'panright': {
      const zpFilter =
        `zoompan=z=1.1:x='trunc(iw/2-(iw/zoom/2)+(iw*0.05*on/${totalFrames}))':y='ih/2-(ih/zoom/2)'` +
        `:d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
      return `${zpFilter},${baseScale}`;
    }
    case 'panleft': {
      const zpFilter =
        `zoompan=z=1.1:x='trunc(iw/2-(iw/zoom/2)+(iw*0.05*(1-on/${totalFrames})))':y='ih/2-(ih/zoom/2)'` +
        `:d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
      return `${zpFilter},${baseScale}`;
    }
    case 'fadein': {
      return `${baseScale},fade=t=in:st=0:d=1`;
    }
    default:
      return baseScale;
  }
}

function runFfmpeg(
  inputPath: string,
  outputPath: string,
  opts: FfmpegOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const { duration, fps, codec } = opts;

    const cmd = ffmpeg(inputPath).inputOptions([
      '-loop 1',
      `-t ${duration}`,
    ]);

    if (codec === 'gif') {
      // GIF: two-pass palette filter for quality
      const vf = buildVideoFilter(opts, true);
      const gifFilter = `${vf},split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse`;
      cmd
        .outputOptions([
          `-vf ${gifFilter}`,
          `-r ${fps}`,
          `-t ${duration}`,
        ])
        .format('gif');
    } else if (codec === 'libvpx-vp9') {
      const vf = buildVideoFilter(opts);
      cmd
        .videoCodec('libvpx-vp9')
        .outputOptions([
          `-vf ${vf}`,
          `-r ${fps}`,
          `-t ${duration}`,
          '-b:v 0',
          '-crf 33',
          '-an',
        ])
        .format('webm');
    } else if (codec === 'libx265') {
      const vf = buildVideoFilter(opts);
      cmd
        .videoCodec('libx265')
        .outputOptions([
          `-vf ${vf}`,
          `-r ${fps}`,
          `-t ${duration}`,
          '-preset fast',
          '-crf 28',
          '-an',
          '-tag:v hvc1',
          '-movflags +faststart',
        ]);
    } else {
      // libx264 (default)
      const vf = buildVideoFilter(opts);
      cmd
        .videoCodec('libx264')
        .outputOptions([
          `-vf ${vf}`,
          `-r ${fps}`,
          `-t ${duration}`,
          '-preset fast',
          '-crf 23',
          '-an',
          '-pix_fmt yuv420p',
          '-movflags +faststart',
        ]);
    }

    cmd
      .on('error', (err: Error) => {
        reject(
          new Error(
            `FFmpeg error: ${err.message}. Make sure FFmpeg is installed and accessible in PATH.`,
          ),
        );
      })
      .on('end', () => resolve())
      .save(outputPath);
  });
}
