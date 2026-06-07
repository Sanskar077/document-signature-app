import { useState } from "react";

  type Props = {
    defaultName?: string;
    onSave: (text: string, style: number, color: string, dataUrl: string) => void;
  };

  const STYLES = [
    { id: 1, fontFamily: "'Caveat', cursive" },
    { id: 2, fontFamily: "'Dancing Script', cursive" },
    { id: 3, fontFamily: "'Pacifico', cursive" },
  ];

  const COLORS = [
    { hex: "#1e3a8a", label: "Navy" },
    { hex: "#1f2937", label: "Ink" },
    { hex: "#7c3aed", label: "Violet" },
    { hex: "#0f766e", label: "Teal" },
    { hex: "#b45309", label: "Amber" },
    { hex: "#991b1b", label: "Crimson" },
  ];

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  async function renderInitialsToCanvas(
    initials: string,
    fontFamily: string,
    color: string,
    fontSize = 52
  ): Promise<string> {
    await document.fonts.ready;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(initials);
    const textWidth = metrics.width;

    const padding = 20;
    const underlineGap = 6;
    const underlineThick = 2;
    canvas.width = Math.max(textWidth + padding * 2, 100);
    canvas.height = fontSize + padding + underlineGap + underlineThick + 4;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    ctx.fillText(initials, padding, padding / 2);

    const actualWidth = ctx.measureText(initials).width;
    ctx.beginPath();
    ctx.moveTo(padding, fontSize + underlineGap);
    ctx.lineTo(padding + actualWidth, fontSize + underlineGap);
    ctx.strokeStyle = color;
    ctx.lineWidth = underlineThick;
    ctx.stroke();

    return canvas.toDataURL("image/png");
  }

  export default function InitialsTab({ defaultName = "", onSave }: Props) {
    const [name, setName] = useState(defaultName);
    const [selected, setSelected] = useState(1);
    const [color, setColor] = useState(COLORS[0].hex);
    const [rendering, setRendering] = useState(false);

    const initials = name.trim() ? getInitials(name) : "";
    const selectedStyle = STYLES.find((s) => s.id === selected) || STYLES[0];

    const handleSave = async () => {
      if (!initials) return;
      setRendering(true);
      try {
        const styleObj = STYLES.find((s) => s.id === selected) || STYLES[0];
        const dataUrl = await renderInitialsToCanvas(initials, styleObj.fontFamily, color);
        onSave(initials, selected, color, dataUrl);
      } finally {
        setRendering(false);
      }
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div className="form-group">
          <label className="form-label">Your full name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Jane Smith → JS"
            value={name}
            onChange={(e) => setName(e.target.value)}
            id="initials-name-input"
          />
          {initials && (
            <p className="form-hint">
              Initials: <strong style={{ color: "var(--text-primary)" }}>{initials}</strong>
            </p>
          )}
        </div>

        {initials && (
          <>
            <p className="form-label">Choose style</p>
            <div className="sig-typed-preview">
              {STYLES.map((s) => (
                <div
                  key={s.id}
                  className={`sig-style-option sig-style-${s.id} ${selected === s.id ? "selected" : ""}`}
                  onClick={() => setSelected(s.id)}
                  id={`initials-style-${s.id}`}
                  style={{ fontSize: "2.5rem", color, fontFamily: s.fontFamily }}
                >
                  {initials}
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
        {initials && (
          <div style={{
            padding: "var(--space-3) var(--space-4)",
            background: "white",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            textAlign: "center",
          }}>
            <span style={{
              fontFamily: selectedStyle.fontFamily,
              fontSize: "3rem",
              color,
              display: "inline-block",
              borderBottom: `2px solid ${color}`,
              paddingBottom: 2,
            }}>
              {initials}
            </span>
          </div>
        )}

        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={!initials || rendering}
          id="save-initials-btn"
        >
          {rendering ? "Preparing…" : "Use These Initials"}
        </button>
      </div>
    );
  }
  