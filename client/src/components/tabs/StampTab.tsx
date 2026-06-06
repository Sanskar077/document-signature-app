import { useRef, useState } from "react";

type Props = {
  onSave: (dataUrl: string) => void;
};

export default function StampTab({ onSave }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
        Upload a company stamp or logo image (PNG, JPEG, WebP).
      </p>

      <div
        className="upload-zone"
        style={{ padding: "var(--space-6)" }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          id="stamp-file-input"
        />
        {preview ? (
          <img
            src={preview}
            alt="stamp preview"
            style={{
              maxHeight: 120,
              maxWidth: "100%",
              objectFit: "contain",
              margin: "0 auto",
              borderRadius: "var(--radius)",
            }}
          />
        ) : (
          <>
            <div className="upload-icon">🏢</div>
            <p className="upload-title">Click to upload image</p>
            <p className="upload-desc">PNG, JPEG, WebP supported</p>
          </>
        )}
      </div>

      {preview && (
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setPreview(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            id="remove-stamp-btn"
          >
            Remove
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => preview && onSave(preview)}
            id="save-stamp-btn"
          >
            Use This Stamp
          </button>
        </div>
      )}
    </div>
  );
}
