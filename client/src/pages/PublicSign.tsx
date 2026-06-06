import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import SignatureModal, {
  type SignatureResult,
} from "../components/tabs/SignatureModal";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

function renderSignaturePreview(result: SignatureResult): React.ReactNode {
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
          fontSize: "2rem",
          color: "#1e3a8a",
          padding: "4px 8px",
          background: "rgba(255,255,255,0.9)",
          borderRadius: 4,
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
        style={{ maxHeight: 60, maxWidth: 150, objectFit: "contain" }}
      />
    );
  }
  return null;
}

export default function PublicSign() {
  const { token } = useParams();
  const [doc, setDoc] = useState<{
    originalName: string;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [signatureResult, setSignatureResult] =
    useState<SignatureResult | null>(null);
  const [position, setPosition] = useState({ x: 300, y: 200 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDocument = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/public-sign/${token}`
      );
      setDoc(res.data.document);
    } catch {
      setDoc(null);
    } finally {
      setLoading(false);
    }
  };

  const saveSignature = async () => {
    if (!signatureResult) return;
    setSaving(true);
    setError("");
    try {
      await axios.post(
        `http://localhost:5000/api/public-sign/${token}/sign`,
        {
          x: position.x,
          y: position.y,
          page: 1,
          type: signatureResult.type,
          data:
            signatureResult.dataUrl ??
            `${signatureResult.text}|${signatureResult.style}`,
        }
      );
      setSaved(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save signature.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Validating link…" />;

  if (!doc) {
    return (
      <div className="loading-page">
        <div
          style={{
            background: "var(--danger-light)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-8)",
            textAlign: "center",
            maxWidth: 400,
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>🔒</div>
          <h2 style={{ color: "var(--danger)", marginBottom: "var(--space-3)" }}>
            Invalid or Expired Link
          </h2>
          <p style={{ color: "var(--text-muted)" }}>
            This signing link is no longer valid. Please request a new one from
            the document owner.
          </p>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="loading-page">
        <div
          style={{
            background: "var(--success-light)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-8)",
            textAlign: "center",
            maxWidth: 400,
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>✅</div>
          <h2 style={{ color: "var(--success)", marginBottom: "var(--space-3)" }}>
            Document Signed!
          </h2>
          <p style={{ color: "var(--text-muted)" }}>
            Your signature has been recorded successfully. You can now close
            this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {modalOpen && (
        <SignatureModal
          onSave={(r) => {
            setSignatureResult(r);
            setModalOpen(false);
          }}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div className="page-wrapper">
        <div
          className="container"
          style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)" }}
        >
          <div className="page-header">
            <h1 className="page-title">Sign Document</h1>
            <p className="page-subtitle">
              You have been invited to sign: <strong style={{ color: "var(--text-primary)" }}>{doc.originalName}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* Sidebar */}
            <div className="card" style={{ width: 260, flexShrink: 0 }}>
              <h3 style={{ color: "var(--text-primary)", marginBottom: "var(--space-4)" }}>
                Your Signature
              </h3>

              {signatureResult ? (
                <div
                  style={{
                    padding: "var(--space-3)",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  {renderSignaturePreview(signatureResult)}
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
                id="open-modal-public"
              >
                {signatureResult ? "Change Signature" : "Choose Signature ✍️"}
              </button>

              <div className="divider" />

              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
                Click anywhere on the document to position your signature.
              </p>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: "var(--space-3)" }}>
                  {error}
                </div>
              )}

              <button
                className="btn btn-primary w-full"
                onClick={saveSignature}
                disabled={!signatureResult || saving}
                id="save-public-sig-btn"
              >
                {saving ? "Saving…" : "Submit Signature"}
              </button>
            </div>

            {/* Document canvas */}
            <div style={{ flex: 1, overflowX: "auto" }}>
              <div
                style={{
                  position: "relative",
                  width: 800,
                  height: 500,
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-lg)",
                  cursor: "crosshair",
                  overflow: "hidden",
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setPosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                id="public-doc-canvas"
              >
                {/* Grid pattern */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                    opacity: 0.3,
                  }}
                />

                {signatureResult && (
                  <div
                    style={{
                      position: "absolute",
                      left: position.x,
                      top: position.y,
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "none",
                      zIndex: 10,
                    }}
                  >
                    {renderSignaturePreview(signatureResult)}
                  </div>
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
                    Click here to position your signature
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}