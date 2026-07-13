/* Image validator — format, size, resolution, corruption, and duplicate detection.
   All checks run client-side with no server round-trip. */

const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MIN_DIM = 64;
const MAX_DIM = 8192;

function fileFingerprint(file) {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

const recentFingerprints = new Set();

export const imageValidator = {
  async validate(file) {
    if (!file) return { valid: false, error: "No file provided" };

    if (!SUPPORTED_TYPES.has(file.type)) {
      return { valid: false, error: `Unsupported format: ${file.type || "unknown"}. Use JPEG, PNG, WEBP, or HEIC.` };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 20 MB.` };
    }

    if (file.size === 0) {
      return { valid: false, error: "File is empty or corrupted." };
    }

    const fp = fileFingerprint(file);
    if (recentFingerprints.has(fp)) {
      return { valid: false, error: "Duplicate image detected." };
    }

    try {
      const dims = await getImageDimensions(file);
      if (dims.width < MIN_DIM || dims.height < MIN_DIM) {
        return { valid: false, error: `Image too small (${dims.width}×${dims.height}). Minimum is ${MIN_DIM}×${MIN_DIM} px.` };
      }
      if (dims.width > MAX_DIM || dims.height > MAX_DIM) {
        return { valid: false, error: `Image too large (${dims.width}×${dims.height}). Maximum is ${MAX_DIM}×${MAX_DIM} px.` };
      }

      recentFingerprints.add(fp);
      if (recentFingerprints.size > 200) {
        recentFingerprints.delete(recentFingerprints.values().next().value);
      }

      return { valid: true, error: null, width: dims.width, height: dims.height };
    } catch {
      return { valid: false, error: "Image appears to be corrupted or unreadable." };
    }
  },

  clearDuplicateCache() {
    recentFingerprints.clear();
  },
};

function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}
