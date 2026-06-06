import { useState } from "react";

type Props = {
  defaultName?: string;
  onSave: (text: string, style: number, color: string) => void;
};

const STYLES = [
  { id: 1, className: "sig-style-1", label: "Casual Script" },
  { id: 2, className: "sig-style-2", label: "Elegant" },
  { id: 3, className: "sig-style-3", label: "Bold" },
];

const COLORS = [
  { hex: "#1e3a8a", label: "Navy" },
  { hex: "#1f2937", label: "Ink" },
  { hex: "#7c3aed", label: "Violet" },
  { hex: "#0f766e", label: "Teal" },
  { hex: "#b45309", label: "Amber" },
  { hex: "#991b1b", label: "Crimson" },
];

export default function TypedSignature({ defaultName = "", onSave }: Props) {
  const [name, setName] = useState(defaultName);
  const [selected, setSelected] = useState(1);
  const [color, setColor] = useState(COLORS[0].hex);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), selected, color);
  };

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
                className={`sig-style-option ${s.className} ${selected === s.id ? "selected" : ""}`}
                onClick={() => setSelected(s.id)}
                id={`sig-style-${s.id}`}
                style={{ color }}
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

      <button
        className="btn btn-primary btn-sm"
        onClick={handleSave}
        disabled={!name.trim()}
        id="save-typed-sig-btn"
      >
        Use This Signature
      </button>
    </div>
  );
}
