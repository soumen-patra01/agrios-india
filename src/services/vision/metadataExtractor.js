/* Metadata extractor — GPS, timestamp, device info.
   Uses only browser APIs; no external EXIF library. */

export const metadataExtractor = {
  async extract(file, locationOverride = null) {
    const gps = locationOverride || await getGps().catch(() => null);

    return {
      timestamp:  new Date().toISOString(),
      capturedAt: file.lastModified ? new Date(file.lastModified).toISOString() : new Date().toISOString(),
      fileName:   file.name,
      fileSize:   file.size,
      fileType:   file.type,
      gps,
      device: getDeviceInfo(),
      hasExif: file.type === "image/jpeg" ? await detectExif(file).catch(() => false) : false,
    };
  },
};

async function getGps() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Geolocation not supported")); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(err),
      { timeout: 5000, maximumAge: 60000 }
    );
  });
}

function getDeviceInfo() {
  return {
    userAgent:    navigator.userAgent,
    platform:     navigator.platform,
    language:     navigator.language,
    screenWidth:  window.screen?.width,
    screenHeight: window.screen?.height,
    pixelRatio:   window.devicePixelRatio,
    online:       navigator.onLine,
  };
}

async function detectExif(file) {
  const buffer = await file.slice(0, 4).arrayBuffer();
  const view   = new DataView(buffer);
  return view.getUint16(0) === 0xFFD8; // JPEG SOI marker
}
