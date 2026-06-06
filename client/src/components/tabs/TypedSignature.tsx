import { useState } from "react";

type Props = {
  defaultName?: string;
  onSave: (text: string, style: number) => void;
};

const STYLES = [
  { id: 1, className: "sig-style-1", label: "Casual Script" },
  { id: 2, className: "sig-style-2", label: "Elegant" },
  { id: 3, className: "sig-style-3", label: "Bold" },
];

export default function TypedSignature({ defaultName = "", onSave }: Props) {
  const [name, setName] = useState(defaultName);
  const [selected, setSelected] = useState(1);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), selected);
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
              >
                {name}
              </div>
            ))}
          </div>
        </>
      )}

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
