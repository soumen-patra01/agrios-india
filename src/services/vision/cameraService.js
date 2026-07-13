/* Camera service — MediaDevices API wrapper.
   Supports front/rear switching, flash, zoom, tap-to-focus, and frame capture. */

export const FACING = { rear: "environment", front: "user" };

export const cameraService = {
  stream:     null,
  facingMode: FACING.rear,

  isSupported() {
    return !!(navigator.mediaDevices?.getUserMedia);
  },

  async start(videoEl, facingMode = FACING.rear) {
    await this.stop();
    this.facingMode = facingMode;

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });

    videoEl.srcObject = this.stream;
    await videoEl.play();
    return this.stream;
  },

  async stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  },

  async switchCamera(videoEl) {
    const next = this.facingMode === FACING.rear ? FACING.front : FACING.rear;
    return this.start(videoEl, next);
  },

  async setFlash(on) {
    const track = this.stream?.getVideoTracks()?.[0];
    if (!track) return false;
    const caps = track.getCapabilities?.() || {};
    if (!caps.torch) return false;
    await track.applyConstraints({ advanced: [{ torch: on }] }).catch(() => {});
    return true;
  },

  async setZoom(level) {
    const track = this.stream?.getVideoTracks()?.[0];
    if (!track) return false;
    const caps = track.getCapabilities?.() || {};
    if (!caps.zoom) return false;
    const z = Math.min(caps.zoom.max, Math.max(caps.zoom.min, level));
    await track.applyConstraints({ advanced: [{ zoom: z }] }).catch(() => {});
    return true;
  },

  async tapFocus(videoEl, clientX, clientY) {
    const track = this.stream?.getVideoTracks()?.[0];
    if (!track) return false;
    const caps = track.getCapabilities?.() || {};
    if (!caps.focusMode) return false;
    const rect = videoEl.getBoundingClientRect();
    const nx   = (clientX - rect.left)  / rect.width;
    const ny   = (clientY - rect.top)   / rect.height;
    await track.applyConstraints({
      advanced: [{ focusMode: "manual", pointsOfInterest: [{ x: nx, y: ny }] }],
    }).catch(() => {});
    return true;
  },

  capture(videoEl, quality = 0.9) {
    const canvas   = document.createElement("canvas");
    canvas.width   = videoEl.videoWidth;
    canvas.height  = videoEl.videoHeight;
    canvas.getContext("2d").drawImage(videoEl, 0, 0);
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality));
  },

  getCapabilities() {
    return this.stream?.getVideoTracks()?.[0]?.getCapabilities?.() || {};
  },
};
