import { frameworkAdapter } from "../registry/frameworkAdapter.js";

export const compatibilityCheck = {
  run(model, targetEnvironment = "browser") {
    const checks = [];
    const fw = frameworkAdapter.get(model.framework);

    checks.push({
      id: "framework_known",
      label: "Framework recognized",
      pass: !!fw,
      detail: fw ? `${fw.label} (${fw.runtime})` : `Unknown framework: ${model.framework}`,
    });

    const envCompatMap = {
      browser: ["anthropic-claude", "onnx", "tflite"],
      edge:    ["onnx", "tensorrt", "openvino", "ncnn", "yolo"],
      server:  ["tensorflow", "pytorch", "tensorrt", "onnx", "vit", "anthropic-claude"],
      mobile:  ["tflite", "coreml", "ncnn", "mediapipe"],
    };
    const compatible = (envCompatMap[targetEnvironment] || []).includes(model.framework);
    checks.push({
      id: "env_compatible",
      label: `Compatible with ${targetEnvironment}`,
      pass: compatible,
      detail: compatible ? "Framework runs in target environment" : `${model.framework} not supported in ${targetEnvironment}`,
    });

    checks.push({
      id: "has_metrics",
      label: "Performance metrics present",
      pass: model.metrics && Object.keys(model.metrics).length > 0,
      detail: "Accuracy, F1, and other metrics required for deployment",
    });

    checks.push({
      id: "has_input_format",
      label: "Input format defined",
      pass: !!model.inputFormat,
      detail: model.inputFormat || "Missing input format specification",
    });

    checks.push({
      id: "has_output_format",
      label: "Output format defined",
      pass: !!model.outputFormat,
      detail: model.outputFormat || "Missing output format specification",
    });

    const passed = checks.filter((c) => c.pass).length;
    const total = checks.length;
    return {
      compatible: passed === total,
      score: Math.round((passed / total) * 100),
      checks,
      environment: targetEnvironment,
      checkedAt: new Date().toISOString(),
    };
  },
};
