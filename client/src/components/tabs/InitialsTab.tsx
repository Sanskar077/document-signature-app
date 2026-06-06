import { useState } from "react";

type Props = {
  defaultName?: string;
  onSave: (text: string, style: number, color: string) => void;
};

const STYLES = [
  { id: 1, className: "sig-style-1" },
  { id: 2, className: "sig-style-2" },
  { id: 3, className: "sig-style-3" },
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
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function InitialsTab({ defaultName = "", onSave }: Props) {
  const [name, setName] = useState(defaultName);
  const [selected, setSelected] = useState(1);
  const [color, setColor] = useState(COLORS[0].hex);

  const initials = name.trim() ? getInitials(name) : "";

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
            Initials:{" "}
            <strong style={{ color: "var(--text-primary)" }}>{initials}</strong>
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
                className={`sig-style-option ${s.className} ${selected === s.id ? "selected" : ""}`}
                onClick={() => setSelected(s.id)}
                id={`initials-style-${s.id}`}
                style={{ fontSize: "2.5rem", color }}
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

      <button
        className="btn btn-primary btn-sm"
        onClick={() => initials && onSave(initials, selected, color)}
        disabled={!initials}
        id="save-initials-btn"
      >
        Use These Initials
      </button>
    </div>
  );
}
