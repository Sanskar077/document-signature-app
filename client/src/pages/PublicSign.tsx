import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import SignatureModal, { type SignatureResult } from "../components/tabs/SignatureModal";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function renderSignaturePreview(result: SignatureResult, w = 150, h = 60): React.ReactNode {
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
          fontSize: "1.8rem",
          color: result.color || "#1e3a8a",
          padding: "4px 8px",
          background: "rgba(255,255,255,0.92)",
          borderRadius: 4,
          border: "1px solid rgba(99,102,241,0.4)",
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
        style={{ width: w, height: h, objectFit: "contain", background: "rgba(255,255,255,0.92)", borderRadius: 4, border: "1px solid rgba(99,102,241,0.4)", padding: 4 }}
      />
    );
  }
  return null;
}

export default function PublicSign() {
  const { token } = useParams();
  const [doc, setDoc] = useState<{ originalName: string; status: string; fileName?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [signatureResult, setSignatureResult] = useState<SignatureResult | null>(null);
  const [position, setPosition] = useState({ x: 200, y: 200 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pdfPageWidth, setPdfPageWidth] = useState(750);
  const [pdfPageHeight, setPdfPageHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocument();
  }, []);

  const fetchDocument = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/public-sign/${token}`);
      setDoc(res.data.document);
    } catch {
      setDoc(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left - position.x,
      y: e.clientY - rect.top - position.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setPosition({
        x: Math.max(0, Math.min(e.clientX - rect.left - dragOffset.current.x, pdfPageWidth - 150)),
        y: Math.max(0, Math.min(e.clientY - rect.top - dragOffset.current.y, pdfPageHeight - 60)),
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isDragging, pdfPageWidth, pdfPageHeight]);

  const saveSignature = async () => {
    if (!signatureResult) return;
    setSaving(true);
    setError("");
    const pw = pdfPageWidth || 750;
    const ph = pdfPageHeight || 1000;
    const xPct = Number(((position.x / pw) * 100).toFixed(2));
    const yPct = Number(((position.y / ph) * 100).toFixed(2));
    try {
      await axios.post(`${API_BASE}/api/public-sign/${token}/sign`, {
        x: xPct,
        y: yPct,
        page: 1,
        type: signatureResult.type,
        data: signatureResult.dataUrl ?? `${signatureResult.text}|${signatureResult.style}`,
        signatureText: signatureResult.text || null,
        signatureStyle: signatureResult.style || 1,
        signatureColor: signatureResult.color || "#1e3a8a",
        signatureImage: signatureResult.type === "drawn" ? signatureResult.dataUrl : null,
        stampImage: signatureResult.type === "stamp" ? signatureResult.dataUrl : null,
        width: 150,
        height: 60,
      });
      setSaved(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save signature.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Validating link…" />;

  if (!doc) {
    return (
      <div className="loading-page">
        <div style={{ background: "var(--danger-light)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-lg)", padding: "var(--space-8)", textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>🔒</div>
          <h2 style={{ color: "var(--danger)", marginBottom: "var(--space-3)" }}>Invalid or Expired Link</h2>
          <p style={{ color: "var(--text-muted)" }}>This signing link is no longer valid. Please request a new one from the document owner.</p>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="loading-page">
        <div style={{ background: "var(--success-light)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-lg)", padding: "var(--space-8)", textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>✅</div>
          <h2 style={{ color: "var(--success)", marginBottom: "var(--space-3)" }}>Document Signed!</h2>
          <p style={{ color: "var(--text-muted)" }}>Your signature has been recorded. You may now close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {modalOpen && (
        <SignatureModal
          onSave={(r) => { setSignatureResult(r); setModalOpen(false); }}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div className="page-wrapper">
        <div className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)" }}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Sign Document</h1>
              <p className="page-subtitle">
                You have been invited to sign:{" "}
                <strong style={{ color: "var(--text-primary)" }}>{doc.originalName}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* Sidebar */}
            <div className="card" style={{ width: 240, flexShrink: 0 }}>
              <h3 style={{ color: "var(--text-primary)", marginBottom: "var(--space-4)", fontSize: "0.95rem" }}>Your Signature</h3>

              {signatureResult ? (
                <div style={{ padding: "var(--space-3)", background: "var(--bg-secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)", marginBottom: "var(--space-4)", overflow: "hidden" }}>
                  {renderSignaturePreview(signatureResult)}
                </div>
              ) : (
                <div style={{ padding: "var(--space-5)", textAlign: "center", background: "var(--bg-secondary)", borderRadius: "var(--radius)", border: "1px dashed var(--border)", marginBottom: "var(--space-4)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  No signature selected
                </div>
              )}

              <button className="btn btn-secondary w-full" onClick={() => setModalOpen(true)} id="open-modal-public" style={{ marginBottom: "var(--space-4)" }}>
                {signatureResult ? "Change Signature" : "Choose Signature ✍️"}
              </button>

              <div className="divider" />

              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
                Drag your signature to position it on the document.
              </p>

              {error && <div className="alert alert-error" style={{ marginBottom: "var(--space-3)" }}>{error}</div>}

              <button className="btn btn-primary w-full" onClick={saveSignature} disabled={!signatureResult || saving} id="save-public-sig-btn">
                {saving ? "Saving…" : "Submit Signature"}
              </button>
            </div>

            {/* PDF Canvas */}
            <div ref={canvasRef} style={{ flex: 1, position: "relative", display: "inline-block", cursor: isDragging ? "grabbing" : "default" }}>
              <Document
                file={doc.fileName ? `${API_BASE}/uploads/${doc.fileName}` : undefined}
                loading={<LoadingSpinner text="Loading PDF…" />}
                onLoadError={() => {}}
              >
                <Page
                  pageNumber={1}
                  width={pdfPageWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  onRenderSuccess={(page) => setPdfPageHeight(page.height)}
                />
              </Document>

              {/* Draggable signature overlay */}
              {signatureResult && (
                <div
                  onMouseDown={handleMouseDown}
                  style={{
                    position: "absolute",
                    left: position.x,
                    top: position.y,
                    cursor: isDragging ? "grabbing" : "grab",
                    userSelect: "none",
                    zIndex: 10,
                  }}
                >
                  {renderSignaturePreview(signatureResult)}
                </div>
              )}

              {!signatureResult && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(13,14,18,0.4)", pointerEvents: "none" }}>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1rem", fontWeight: 600, textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
                    ← Choose a signature then drag it into position
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
