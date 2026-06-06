import { DndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import SignatureModal, {
  type SignatureResult,
} from "../components/tabs/SignatureModal";

/* ─── Draggable Signature Widget ─── */
function DraggableSignature({
  x,
  y,
  result,
}: {
  x: number;
  y: number;
  result: SignatureResult;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "signature",
  });

  const style: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    cursor: "grab",
    transform: CSS.Translate.toString(transform),
    userSelect: "none",
    zIndex: 10,
  };

  const inner = renderSignaturePreview(result, false);

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {inner}
    </div>
  );
}

/* ─── Render helper ─── */
function renderSignaturePreview(
  result: SignatureResult,
  large = false
): React.ReactNode {
  const size = large ? "2.5rem" : "1.6rem";
  const fontMap: Record<number, string> = {
    1: "var(--font-sign)",
    2: "var(--font-sign-2)",
    3: "var(--font-sign-3)",
  };

  if (result.type === "typed" || result.type === "initials") {
    return (
      <span
        style={{
          fontFamily: fontMap[result.style ?? 1],
          fontSize: size,
          color: "#1e3a8a",
          padding: "4px 8px",
          background: "rgba(255,255,255,0.9)",
          borderRadius: 4,
          border: "1px solid #93c5fd",
          whiteSpace: "nowrap",
        }}
      >
        {result.text}
      </span>
    );
  }

  if (result.dataUrl) {
    return (
      <img
        src={result.dataUrl}
        alt="signature"
        style={{
          maxWidth: large ? 220 : 140,
          maxHeight: large ? 90 : 60,
          objectFit: "contain",
          background: "rgba(255,255,255,0.9)",
          borderRadius: 4,
          border: "1px solid #93c5fd",
          padding: 4,
        }}
      />
    );
  }

  return null;
}

/* ─── Main Component ─── */
export default function SignaturePlacement() {
  const { id: documentId } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const pageWidth = 800;
  const pageHeight = 1000;

  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [relativePosition, setRelativePosition] = useState({ x: 12.5, y: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [signatureResult, setSignatureResult] =
    useState<SignatureResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSignatureSave = (result: SignatureResult) => {
    setSignatureResult(result);
    setModalOpen(false);
  };

  const saveSignature = async () => {
    if (!signatureResult) return;
    setSaving(true);
    setError("");

    try {
      await axios.post(
        "http://localhost:5000/api/signatures",
        {
          documentId,
          x: relativePosition.x,
          y: relativePosition.y,
          page: 1,
          type: signatureResult.type,
          data:
            signatureResult.dataUrl ??
            `${signatureResult.text}|${signatureResult.style}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaved(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save signature";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      {modalOpen && (
        <SignatureModal
          onSave={handleSignatureSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div className="page-wrapper">
        <div className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)" }}>
          <div className="page-header">
            <h1 className="page-title">Place Signature</h1>
            <p className="page-subtitle">
              Choose your signature style, then drag it into position on the
              document.
            </p>
          </div>

          <div style={{ display: "flex", gap: "var(--space-6)", alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Sidebar */}
            <div
              className="card"
              style={{ width: 260, flexShrink: 0 }}
            >
              <h3 style={{ color: "var(--text-primary)", marginBottom: "var(--space-4)" }}>
                Signature
              </h3>

              {signatureResult ? (
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    Selected
                  </p>
                  <div style={{ padding: "var(--space-3)", background: "var(--bg-secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                    {renderSignaturePreview(signatureResult, true)}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "var(--space-5)",
                    textAlign: "center",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius)",
                    border: "1px dashed var(--border)",
                    marginBottom: "var(--space-4)",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  No signature selected
                </div>
              )}

              <button
                className="btn btn-secondary w-full"
                onClick={() => setModalOpen(true)}
                id="open-sig-modal-btn"
              >
                {signatureResult ? "Change Signature" : "Choose Signature ✍️"}
              </button>

              <div className="divider" />

              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
                Position (% of page)
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <div>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>X</p>
                  <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>{relativePosition.x}%</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Y</p>
                  <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>{relativePosition.y}%</p>
                </div>
              </div>

              <div className="divider" />

              {error && (
                <div className="alert alert-error" style={{ marginBottom: "var(--space-3)" }}>
                  {error}
                </div>
              )}

              {saved ? (
                <div className="alert alert-success" style={{ marginBottom: "var(--space-3)" }}>
                  ✓ Signature saved! <a href="/dashboard" style={{ fontWeight: 600 }}>Go to dashboard</a>
                </div>
              ) : (
                <button
                  className="btn btn-primary w-full"
                  onClick={saveSignature}
                  disabled={!signatureResult || saving}
                  id="save-sig-btn"
                >
                  {saving ? "Saving…" : "Save Signature"}
                </button>
              )}
            </div>

            {/* Document canvas */}
            <div style={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
              <DndContext
                onDragEnd={(event) => {
                  const { delta } = event;
                  setPosition((prev) => {
                    const newX = Math.max(0, Math.min(prev.x + delta.x, pageWidth - 150));
                    const newY = Math.max(0, Math.min(prev.y + delta.y, pageHeight - 60));
                    setRelativePosition({
                      x: Number(((newX / pageWidth) * 100).toFixed(2)),
                      y: Number(((newY / pageHeight) * 100).toFixed(2)),
                    });
                    return { x: newX, y: newY };
                  });
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: pageWidth,
                    height: pageHeight,
                    background: "#ffffff",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    boxShadow: "var(--shadow-lg)",
                    overflow: "hidden",
                  }}
                >
                  {/* Watermark grid */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage:
                        "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
                      backgroundSize: "30px 30px",
                      opacity: 0.3,
                    }}
                  />

                  {signatureResult && (
                    <DraggableSignature
                      x={position.x}
                      y={position.y}
                      result={signatureResult}
                    />
                  )}

                  {!signatureResult && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9ca3af",
                        fontSize: "1rem",
                        pointerEvents: "none",
                      }}
                    >
                      Choose a signature from the sidebar →
                    </div>
                  )}
                </div>
              </DndContext>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}