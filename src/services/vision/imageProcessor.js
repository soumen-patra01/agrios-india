/* Image processor — Canvas-based resize, compress, enhance, rotate.
   Extends the base compression from imagePipeline with a full options set. */

import { LIMITS } from "../../ai/config.js";

export const DEFAULT_OPTIONS = {
  maxDim:     LIMITS.maxImageDim, // 1280 px
  quality:    0.82,
  brightness: 0,    // -100 to 100
  contrast:   0,    // -100 to 100
  sharpen:    false,
  rotation:   0,    // 0 | 90 | 180 | 270
};

export const imageProcessor = {
  async process(file, options = {}) {
    const opts   = { ...DEFAULT_OPTIONS, ...options };
    const bitmap = await createImageBitmap(file);

    let { width, height } = bitmap;
    const scale = Math.min(1, opts.maxDim / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const isRotated = opts.rotation === 90 || opts.rotation === 270;
    const cw = isRotated ? h : w;
    const ch = isRotated ? w : h;

    const canvas = document.createElement("canvas");
    canvas.width  = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");

    if (opts.rotation) {
      ctx.translate(cw / 2, ch / 2);
      ctx.rotate((opts.rotation * Math.PI) / 180);
      ctx.translate(-w / 2, -h / 2);
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    if (opts.brightness !== 0 || opts.contrast !== 0) {
      const imageData = ctx.getImageData(0, 0, cw, ch);
      applyBrightnessContrast(imageData.data, opts.brightness, opts.contrast);
      ctx.putImageData(imageData, 0, 0);
    }

    if (opts.sharpen) {
      applySharpen(ctx, cw, ch);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", opts.quality);
    const base64  = dataUrl.split(",")[1];
    const bytes   = Math.round((base64.length * 3) / 4);

    return {
      base64,
      mediaType: "image/jpeg",
      width:  cw,
      height: ch,
      bytes,
      name: file.name,
      originalSize: file.size,
      compressionRatio: file.size > 0 ? bytes / file.size : 1,
    };
  },

  async crop(file, { x = 0, y = 0, w = 1, h = 1 } = {}) {
    const bitmap = await createImageBitmap(file);
    const sx = Math.round(bitmap.width  * x);
    const sy = Math.round(bitmap.height * y);
    const sw = Math.round(bitmap.width  * w);
    const sh = Math.round(bitmap.height * h);

    const canvas = document.createElement("canvas");
    canvas.width  = sw;
    canvas.height = sh;
    canvas.getContext("2d").drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    bitmap.close?.();

    return canvas.toDataURL("image/jpeg", 0.9).split(",")[1];
  },
};

function applyBrightnessContrast(data, brightness, contrast) {
  const b      = brightness * 2.55;
  const c      = contrast / 100;
  const factor = (259 * (c * 255 + 255)) / (255 * (259 - c * 255));

  for (let i = 0; i < data.length; i += 4) {
    data[i]     = clamp(factor * (data[i]     - 128) + 128 + b);
    data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128 + b);
    data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128 + b);
  }
}

function applySharpen(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const src = imageData.data;
  const out = new Uint8ClampedArray(src);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += src[((y + ky) * w + (x + kx)) * 4 + c] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        out[(y * w + x) * 4 + c] = clamp(sum);
      }
    }
  }

  ctx.putImageData(new ImageData(out, w, h), 0, 0);
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
