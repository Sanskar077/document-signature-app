import { useRef, useEffect, useState, useCallback } from "react";

const COLORS = [
  { hex: "#1a1a2e", label: "Black" },
  { hex: "#1e3a8a", label: "Navy" },
  { hex: "#7c3aed", label: "Violet" },
  { hex: "#0f766e", label: "Teal" },
  { hex: "#991b1b", label: "Crimson" },
];

type Props = {
  name?: string;
  onSave: (dataUrl: string) => void;
};

export default function DrawSignature({ name, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [strokeColor, setStrokeColor] = useState(COLORS[0].hex);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [strokeColor]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // Update stroke color without clearing canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = strokeColor;
  }, [strokeColor]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setIsEmpty(true);
  };

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    onSave(canvas.toDataURL("image/png"));
  }, [isEmpty, onSave]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {name && (
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Draw your signature below
        </p>
      )}

      {/* Color picker row */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", flexShrink: 0 }}>Ink color:</p>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {COLORS.map((c) => (
            <button
              key={c.hex}
              title={c.label}
              onClick={() => setStrokeColor(c.hex)}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: c.hex,
                border: strokeColor === c.hex ? "3px solid white" : "2px solid transparent",
                outline: strokeColor === c.hex ? `2px solid ${c.hex}` : "none",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      <div className="sig-canvas-wrapper" style={{ height: 180 }}>
        <canvas
          ref={canvasRef}
          className="sig-canvas"
          style={{ height: 180 }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          id="sig-draw-canvas"
        />
        {isEmpty && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Sign here ↑</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <button className="btn btn-ghost btn-sm" onClick={clearCanvas} id="clear-canvas-btn">
          🗑 Clear
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={isEmpty}
          id="save-draw-sig-btn"
        >
          Use This Signature
        </button>
      </div>
    </div>
  );
}
