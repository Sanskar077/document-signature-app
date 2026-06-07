import { useRef, useState } from "react";

type Props = {
  companyName?: string;
  onSave: (dataUrl: string) => void;
};

export default function StampTab({ onSave, companyName: _companyName }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
        Upload your company stamp, logo, or seal image. PNG with transparent background works best.
      </p>

      <div
        className="upload-zone"
        style={{ padding: "var(--space-6)" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFile}
          id="stamp-file-input"
        />
        {preview ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
            <img
              src={preview}
              alt="stamp preview"
              style={{
                maxHeight: 120,
                maxWidth: "100%",
                objectFit: "contain",
                borderRadius: "var(--radius)",
              }}
            />
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{fileName}</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">🏢</div>
            <p className="upload-title">Click or drag to upload</p>
            <p className="upload-desc">PNG, JPEG, WebP, SVG supported</p>
          </>
        )}
      </div>

      {preview && (
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setPreview(null);
              setFileName("");
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
