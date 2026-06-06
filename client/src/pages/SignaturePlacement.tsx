import { DndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import SignatureModal, { type SignatureResult } from "../components/tabs/SignatureModal";
import { Document, Page, pdfjs } from "react-pdf";
import LoadingSpinner from "../components/LoadingSpinner";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─── Signature preview renderer ─── */
function renderSignaturePreview(
  result: SignatureResult,
  width: number,
  height: number
): React.ReactNode {
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
          fontSize: result.type === "initials" ? "1.8rem" : "1.6rem",
          color: result.color || "#1e3a8a",
          padding: "4px 8px",
          background: "rgba(255,255,255,0.92)",
          borderRadius: 4,
          border: "1px solid rgba(99,102,241,0.4)",
          whiteSpace: "nowrap",
          display: "inline-block",
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
          width,
          height,
          objectFit: "contain",
          background: "rgba(255,255,255,0.92)",
          borderRadius: 4,
          border: "1px solid rgba(99,102,241,0.4)",
          padding: 4,
        }}
      />
    );
  }

  return null;
}

/* ─── Resize handle ─── */
function ResizeHandle({
  onResize,
}: {
  onResize: (dx: number, dy: number) => void;
}) {
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    startPos.current = { x: e.clientX, y: e.clientY };

    const onMouseMove = (ev: MouseEvent) => {
      if (!startPos.current) return;
      onResize(ev.clientX - startPos.current.x, ev.clientY - startPos.current.y);
      startPos.current = { x: ev.clientX, y: ev.clientY };
    };
    const onMouseUp = () => {
      startPos.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        right: -6,
        bottom: -6,
        width: 14,
        height: 14,
        background: "var(--accent)",
        border: "2px solid white",
        borderRadius: 2,
        cursor: "se-resize",
        zIndex: 20,
      }}
    />
  );
}

/* ─── Draggable Signature Widget ─── */
function DraggableSignature({
  x,
  y,
  result,
  width,
  height,
  onResize,
}: {
  x: number;
  y: number;
  result: SignatureResult;
  width: number;
  height: number;
  onResize: (dw: number, dh: number) => void;
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

  return (
    <div ref={setNodeRef} style={{ ...style, position: "absolute" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <div {...listeners} {...attributes}>
          {renderSignaturePreview(result, width, height)}
        </div>
        {(result.type === "drawn" || result.type === "stamp") && (
          <ResizeHandle onResize={onResize} />
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function SignaturePlacement() {
  const { id: documentId } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [docInfo, setDocInfo] = useState<{ fileName: string; originalName: string } | null>(null);
  const [docLoading, setDocLoading] = useState(true);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfPageWidth, setPdfPageWidth] = useState(800);
  const [pdfPageHeight, setPdfPageHeight] = useState(0);

  const [position, setPosition] = useState({ x: 80, y: 80 });
  const [sigWidth, setSigWidth] = useState(160);
  const [sigHeight, setSigHeight] = useState(64);

  const [modalOpen, setModalOpen] = useState(false);
  const [signatureResult, setSignatureResult] = useState<SignatureResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Fetch document info
  useEffect(() => {
    if (!documentId) return;
    axios
      .get(`${API_BASE}/api/docs/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setDocInfo(res.data.document))
      .catch(() => setDocInfo(null))
      .finally(() => setDocLoading(false));
  }, [documentId, token]);

  // Compute available width for the PDF viewer
  useEffect(() => {
    const update = () => {
      if (pdfContainerRef.current) {
        const w = pdfContainerRef.current.clientWidth;
        setPdfPageWidth(Math.max(500, Math.min(850, w)));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleSignatureSave = (result: SignatureResult) => {
    setSignatureResult(result);
    setModalOpen(false);
    setSaved(false);
    setError("");
  };

  const computeRelativePosition = useCallback(() => {
    const pw = pdfPageWidth || 800;
    const ph = pdfPageHeight || 1100;
    return {
      x: Number(((position.x / pw) * 100).toFixed(2)),
      y: Number(((position.y / ph) * 100).toFixed(2)),
    };
  }, [position, pdfPageWidth, pdfPageHeight]);

  const saveSignature = async () => {
    if (!signatureResult) return;
    setSaving(true);
    setError("");

    const rel = computeRelativePosition();

    try {
      await axios.post(
        `${API_BASE}/api/signatures`,
        {
          documentId,
          x: rel.x,
          y: rel.y,
          page: currentPage,
          type: signatureResult.type,
          data:
            signatureResult.dataUrl ??
            `${signatureResult.text}|${signatureResult.style}`,
          signatureText: signatureResult.text || null,
          signatureStyle: signatureResult.style || 1,
          signatureColor: signatureResult.color || "#1e3a8a",
          signatureImage: signatureResult.type === "drawn" ? signatureResult.dataUrl : null,
          stampImage: signatureResult.type === "stamp" ? signatureResult.dataUrl : null,
          width: sigWidth,
          height: sigHeight,
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

  const relPos = computeRelativePosition();

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
        <div
          className="container"
          style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)" }}
        >
          <div className="page-header">
            <div>
              <h1 className="page-title">Place Signature</h1>
              <p className="page-subtitle">
                Drag your signature to the correct position on the document.
              </p>
            </div>
            {pdfNumPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ←
                </button>
                <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  Page {currentPage} / {pdfNumPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((p) => Math.min(pdfNumPages, p + 1))}
                  disabled={currentPage === pdfNumPages}
                >
                  →
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "var(--space-6)", alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* ── Sidebar ── */}
            <div className="card" style={{ width: 240, flexShrink: 0 }}>
              <h3 style={{ color: "var(--text-primary)", marginBottom: "var(--space-4)", fontSize: "0.95rem" }}>
                Signature
              </h3>

              {signatureResult ? (
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    Selected
                  </p>
                  <div style={{ padding: "var(--space-3)", background: "var(--bg-secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
                    {renderSignaturePreview(signatureResult, 160, 64)}
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
                style={{ marginBottom: "var(--space-4)" }}
              >
                {signatureResult ? "Change Signature" : "Choose Signature ✍️"}
              </button>

              {signatureResult && (signatureResult.type === "drawn" || signatureResult.type === "stamp") && (
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <div className="divider" />
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "var(--space-2)" }}>
                    Size (drag the ↘ handle on document)
                  </p>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>W</p>
                      <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{sigWidth}px</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>H</p>
                      <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{sigHeight}px</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="divider" />

              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
                Position (% of page)
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>X</p>
                  <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{relPos.x}%</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Y</p>
                  <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{relPos.y}%</p>
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
                  ✓ Signature saved!{" "}
                  <a href="/dashboard" style={{ fontWeight: 600 }}>
                    Go to dashboard →
                  </a>
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

            {/* ── PDF Canvas ── */}
            <div ref={pdfContainerRef} style={{ flex: 1, minWidth: 0 }}>
              {docLoading ? (
                <LoadingSpinner text="Loading document…" />
              ) : !docInfo ? (
                <div className="alert alert-error">Document not found.</div>
              ) : (
                <div style={{ position: "relative", display: "inline-block" }}>
                  {/* PDF Renderer */}
                  <Document
                    file={`${API_BASE}/uploads/${docInfo.fileName}`}
                    onLoadSuccess={({ numPages: n }) => setPdfNumPages(n)}
                    onLoadError={() => setPdfLoadError(true)}
                    loading={<LoadingSpinner text="Loading PDF…" />}
                  >
                    <Page
                      pageNumber={currentPage}
                      width={pdfPageWidth}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      onRenderSuccess={(page) => {
                        setPdfPageHeight(page.height);
                      }}
                    />
                  </Document>

                  {pdfLoadError && (
                    <div className="alert alert-error">
                      Failed to load PDF preview.
                    </div>
                  )}

                  {/* Signature DnD overlay — absolute on top of PDF */}
                  {pdfPageWidth > 0 && pdfPageHeight > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                      }}
                    >
                      <DndContext
                        onDragEnd={(event) => {
                          const { delta } = event;
                          setPosition((prev) => {
                            const newX = Math.max(0, Math.min(prev.x + delta.x, pdfPageWidth - sigWidth));
                            const newY = Math.max(0, Math.min(prev.y + delta.y, pdfPageHeight - sigHeight));
                            return { x: newX, y: newY };
                          });
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: signatureResult ? "auto" : "none",
                          }}
                        >
                          {signatureResult && (
                            <DraggableSignature
                              x={position.x}
                              y={position.y}
                              result={signatureResult}
                              width={sigWidth}
                              height={sigHeight}
                              onResize={(dw, dh) => {
                                setSigWidth((w) => Math.max(60, w + dw));
                                setSigHeight((h) => Math.max(30, h + dh));
                              }}
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
                                background: "rgba(13,14,18,0.45)",
                                pointerEvents: "none",
                              }}
                            >
                              <p
                                style={{
                                  color: "rgba(255,255,255,0.85)",
                                  fontSize: "1rem",
                                  fontWeight: 600,
                                  textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                                }}
                              >
                                ← Choose a signature from the panel
                              </p>
                            </div>
                          )}
                        </div>
                      </DndContext>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
