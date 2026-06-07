import { useState, useRef } from "react";

  type Props = {
    defaultName?: string;
    onSave: (text: string, style: number, color: string, dataUrl: string) => void;
  };

  const STYLES = [
    { id: 1, fontFamily: "'Caveat', cursive", label: "Casual Script" },
    { id: 2, fontFamily: "'Dancing Script', cursive", label: "Elegant" },
    { id: 3, fontFamily: "'Pacifico', cursive", label: "Bold" },
  ];

  const COLORS = [
    { hex: "#1e3a8a", label: "Navy" },
    { hex: "#1f2937", label: "Ink" },
    { hex: "#7c3aed", label: "Violet" },
    { hex: "#0f766e", label: "Teal" },
    { hex: "#b45309", label: "Amber" },
    { hex: "#991b1b", label: "Crimson" },
  ];

  /**
   * Render typed signature text to a canvas PNG with the exact font + color.
   * This ensures WYSIWYG: what the user sees in the preview equals what lands in the PDF.
   */
  async function renderTypedToCanvas(
    text: string,
    fontFamily: string,
    color: string,
    fontSize = 44
  ): Promise<string> {
    // Wait for web fonts to be ready
    await document.fonts.ready;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // Measure text
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;

    const padding = 20;
    const underlineGap = 6;
    const underlineThick = 2;
    canvas.width = Math.max(textWidth + padding * 2, 200);
    canvas.height = fontSize + padding + underlineGap + underlineThick + 4;

    // Transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    ctx.fillText(text, padding, padding / 2);

    // Draw underline
    const actualWidth = ctx.measureText(text).width;
    ctx.beginPath();
    ctx.moveTo(padding, fontSize + underlineGap);
    ctx.lineTo(padding + actualWidth, fontSize + underlineGap);
    ctx.strokeStyle = color;
    ctx.lineWidth = underlineThick;
    ctx.stroke();

    return canvas.toDataURL("image/png");
  }

  export default function TypedSignature({ defaultName = "", onSave }: Props) {
    const [name, setName] = useState(defaultName);
    const [selected, setSelected] = useState(1);
    const [color, setColor] = useState(COLORS[0].hex);
    const [rendering, setRendering] = useState(false);

    const handleSave = async () => {
      if (!name.trim()) return;
      setRendering(true);
      try {
        const styleObj = STYLES.find((s) => s.id === selected) || STYLES[0];
        const dataUrl = await renderTypedToCanvas(name.trim(), styleObj.fontFamily, color);
        onSave(name.trim(), selected, color, dataUrl);
      } finally {
        setRendering(false);
      }
    };

    const selectedStyle = STYLES.find((s) => s.id === selected) || STYLES[0];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div className="form-group">
          <label className="form-label">Your full name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            id="typed-sig-name"
          />
        </div>

        {name.trim() && (
          <>
            <p className="form-label" style={{ marginBottom: 0 }}>
              Choose a style
            </p>
            <div className="sig-typed-preview">
              {STYLES.map((s) => (
                <div
                  key={s.id}
                  className={`sig-style-option sig-style-${s.id} ${selected === s.id ? "selected" : ""}`}
                  onClick={() => setSelected(s.id)}
                  id={`sig-style-${s.id}`}
                  style={{ color, fontFamily: s.fontFamily }}
                >
                  {name}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Color picker */}
        <div>
          <p className="form-label" style={{ marginBottom: "var(--space-2)" }}>
            Ink color
          </p>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {COLORS.map((c) => (
              <button
                key={c.hex}
                title={c.label}
                onClick={() => setColor(c.hex)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: c.hex,
                  border: color === c.hex ? "3px solid white" : "2px solid transparent",
                  outline: color === c.hex ? `2px solid ${c.hex}` : "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Live preview */}
        {name.trim() && (
          <div style={{
            padding: "var(--space-3) var(--space-4)",
            background: "white",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            textAlign: "center",
          }}>
            <span style={{
              fontFamily: selectedStyle.fontFamily,
              fontSize: "2rem",
              color,
              display: "inline-block",
              borderBottom: `2px solid ${color}`,
              paddingBottom: 2,
            }}>
              {name}
            </span>
          </div>
        )}

        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={!name.trim() || rendering}
          id="save-typed-sig-btn"
        >
          {rendering ? "Preparing…" : "Use This Signature"}
        </button>
      </div>
    );
  }
  