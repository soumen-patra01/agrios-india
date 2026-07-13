/* Gallery service — file picker with validation and multi-select support. */

import { imageValidator } from "./imageValidator.js";

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export const galleryService = {
  pick() {
    return new Promise((resolve) => {
      const input    = document.createElement("input");
      input.type     = "file";
      input.accept   = ACCEPT;
      input.onchange = () => resolve(input.files?.[0] || null);
      input.oncancel = () => resolve(null);
      input.click();
    });
  },

  pickMultiple(max = 5) {
    return new Promise((resolve) => {
      const input      = document.createElement("input");
      input.type       = "file";
      input.accept     = ACCEPT;
      input.multiple   = true;
      input.onchange   = () => resolve(Array.from(input.files || []).slice(0, max));
      input.oncancel   = () => resolve([]);
      input.click();
    });
  },

  async pickAndValidate() {
    const file = await this.pick();
    if (!file) return { file: null, valid: false, error: "No image selected" };
    const result = await imageValidator.validate(file);
    return { file, ...result };
  },

  readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader   = new FileReader();
      reader.onload  = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  },

  blobToFile(blob, name = "capture.jpg") {
    return new File([blob], name, { type: blob.type || "image/jpeg", lastModified: Date.now() });
  },
};
