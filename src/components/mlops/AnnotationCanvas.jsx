import { useRef, useEffect, useState, useCallback } from "react";
import { T } from "../../theme/ThemeProvider.jsx";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function AnnotationCanvas({ imageUrl, annotations = [], onAnnotation, mode = "bbox", label = "" }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [startPt, setStartPt] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);

  const getScale = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      scaleX: (img.naturalWidth || canvas.width) / rect.width,
      scaleY: (img.naturalHeight || canvas.height) / rect.height,
      offsetX: 0, offsetY: 0,
    };
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (img?.complete && img.naturalWidth) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = T.lineSoft || "#f3f4f6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw existing annotations
    annotations.forEach((ann, idx) => {
      if (ann.type !== "bounding_box" || !ann.geometry) return;
      const { x, y, w, h } = ann.geometry;
      const color = COLORS[idx % COLORS.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x * canvas.width, y * canvas.height, w * canvas.width, h * canvas.height);
      ctx.fillStyle = color + "33";
      ctx.fillRect(x * canvas.width, y * canvas.height, w * canvas.width, h * canvas.height);
      if (ann.labels?.[0]) {
        ctx.fillStyle = color;
        ctx.fillRect(x * canvas.width, y * canvas.height - 16,
          ctx.measureText(ann.labels[0]).width + 8, 16);
        ctx.fillStyle = "#fff";
        ctx.font = "11px sans-serif";
        ctx.fillText(ann.labels[0], x * canvas.width + 4, y * canvas.height - 4);
      }
    });

    // Draw in-progress rectangle
    if (currentRect) {
      const { x, y, w, h } = currentRect;
      ctx.strokeStyle = "var(--ag-primary)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x * canvas.width, y * canvas.height, w * canvas.width, h * canvas.height);
      ctx.setLineDash([]);
    }
  }, [annotations, currentRect]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseDown = (e) => {
    if (mode !== "bbox") return;
    const pos = getPos(e);
    setDrawing(true);
    setStartPt(pos);
    setCurrentRect(null);
  };

  const handleMouseMove = (e) => {
    if (!drawing || !startPt) return;
    const pos = getPos(e);
    setCurrentRect({
      x: Math.min(startPt.x, pos.x),
      y: Math.min(startPt.y, pos.y),
      w: Math.abs(pos.x - startPt.x),
      h: Math.abs(pos.y - startPt.y),
    });
  };

  const handleMouseUp = (e) => {
    if (!drawing || !currentRect || !onAnnotation) { setDrawing(false); return; }
    if (currentRect.w < 0.01 || currentRect.h < 0.01) { setDrawing(false); setCurrentRect(null); return; }
    onAnnotation({ type: "bounding_box", geometry: currentRect, labels: label ? [label] : [] });
    setDrawing(false);
    setCurrentRect(null);
  };

  return (
    <div style={{ position: "relative", touchAction: "none" }}>
      {imageUrl && (
        <img ref={imgRef} src={imageUrl} alt="" onLoad={draw}
          style={{ display: "none" }} crossOrigin="anonymous" />
      )}
      <canvas ref={canvasRef} width={320} height={240}
        style={{ width: "100%", borderRadius: T.rMd, cursor: mode === "bbox" ? "crosshair" : "default",
          border: `1.5px solid ${T.line}`, display: "block" }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} />
      <div style={{ position: "absolute", top: 8, right: 8, fontSize: 11, color: T.inkSoft,
        background: T.surface + "cc", borderRadius: 4, padding: "2px 6px" }}>
        {mode === "bbox" ? "Draw box" : mode}
      </div>
    </div>
  );
}
