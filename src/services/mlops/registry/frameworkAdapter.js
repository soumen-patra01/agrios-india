export const SUPPORTED_FRAMEWORKS = {
  TENSORFLOW:      { id: "tensorflow",       label: "TensorFlow",       icon: "Cpu",     runtime: "cloud" },
  PYTORCH:         { id: "pytorch",          label: "PyTorch",          icon: "Cpu",     runtime: "cloud" },
  TENSORRT:        { id: "tensorrt",         label: "TensorRT",         icon: "Zap",     runtime: "edge"  },
  ONNX:            { id: "onnx",             label: "ONNX Runtime",     icon: "Boxes",   runtime: "edge"  },
  TFLITE:          { id: "tflite",           label: "TensorFlow Lite",  icon: "Cpu",     runtime: "mobile"},
  COREML:          { id: "coreml",           label: "CoreML",           icon: "Server",  runtime: "ios"   },
  OPENVINO:        { id: "openvino",         label: "OpenVINO",         icon: "Network", runtime: "edge"  },
  NCNN:            { id: "ncnn",             label: "NCNN",             icon: "Cpu",     runtime: "mobile"},
  MEDIAPIPE:       { id: "mediapipe",        label: "MediaPipe",        icon: "Crosshair",runtime:"mobile"},
  OPENCV:          { id: "opencv",           label: "OpenCV",           icon: "Eye",     runtime: "edge"  },
  YOLO:            { id: "yolo",             label: "YOLO",             icon: "Target",  runtime: "edge"  },
  VIT:             { id: "vit",              label: "Vision Transformer",icon: "Layers", runtime: "cloud" },
  ANTHROPIC_CLAUDE:{ id: "anthropic-claude", label: "Anthropic Claude", icon: "Bot",     runtime: "cloud" },
};

export const frameworkAdapter = {
  getAll() { return Object.values(SUPPORTED_FRAMEWORKS); },

  get(id) {
    return Object.values(SUPPORTED_FRAMEWORKS).find((f) => f.id === id) || null;
  },

  normalize(model) {
    const fw = this.get(model.framework);
    return {
      ...model,
      frameworkLabel: fw?.label || model.framework,
      frameworkIcon:  fw?.icon  || "Package2",
      runtime:        fw?.runtime || "unknown",
    };
  },

  isCompatible(modelFramework, deviceCapabilities = []) {
    const fw = this.get(modelFramework);
    if (!fw) return false;
    if (fw.runtime === "cloud") return true;
    if (fw.runtime === "mobile" && deviceCapabilities.includes("mobile")) return true;
    if (fw.runtime === "edge" && deviceCapabilities.includes("wasm")) return true;
    return false;
  },

  getInputFormats(frameworkId) {
    const map = {
      "anthropic-claude": ["image/jpeg", "image/png", "image/webp", "image/gif"],
      "tflite":           ["float32_tensor"],
      "onnx":             ["float32_tensor", "uint8_tensor"],
      "yolo":             ["float32_tensor"],
    };
    return map[frameworkId] || ["application/octet-stream"];
  },
};
