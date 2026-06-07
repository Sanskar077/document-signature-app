import { DndContext, useDraggable } from "@dnd-kit/core";
  import { CSS } from "@dnd-kit/utilities";
  import { useState, useRef, useEffect, useCallback } from "react";
  import axios from "axios";
  import { Link, useParams } from "react-router-dom";
  import { useAuth } from "../context/AuthContext";
  import SignatureModal, { type SignatureResult } from "../components/tabs/SignatureModal";
  import { Document, Page, pdfjs } from "react-pdf";
  import LoadingSpinner from "../components/LoadingSpinner";
  import "react-pdf/dist/Page/AnnotationLayer.css";
  import "react-pdf/dist/Page/TextLayer.css";

  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  /* ─── Signature preview ─── */
  function renderSigPreview(result: SignatureResult, w: number, h: number) {
    const fontMap: Record<number, string> = { 1: "var(--font-sign)", 2: "var(--font-sign-2)", 3: "var(--font-sign-3)" };
    if (result.dataUrl) {
      return <img src={result.dataUrl} alt="sig" style={{ width: w, height: h, objectFit: "contain", display: "block" }} />;
    }
    if (result.type === "typed" || result.type === "initials") {
      return (
        <span style={{
          fontFamily: fontMap[result.style ?? 1], fontSize: result.type === "initials" ? "1.5rem" : "1.3rem",
          color: result.color || "#1e3a8a", whiteSpace: "nowrap", padding: "2px 6px",
          borderBottom: `2px solid ${result.color || "#1e3a8a"}`,
        }}>{result.text}</span>
      );
    }
    return <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Signature</span>;
  }

  /* ─── Draggable signature widget ─── */
  function DraggableSig({
    x, y, result, width, height,
    onResize,
  }: { x: number; y: number; result: SignatureResult; width: number; height: number; onResize: (dw: number, dh: number) => void }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: "sig" });
    const style = { transform: CSS.Translate.toString(transform) };
    const handleRef = useRef<{ startX: number; startY: number } | null>(null);

    return (
      <div ref={setNodeRef} style={{
        ...style, position: "absolute", left: x, top: y, width, height,
        cursor: "grab", userSelect: "none", touchAction: "none",
      }} {...listeners} {...attributes}>
        {/* main sig */}
        <div style={{
          width: "100%", height: "100%", background: "rgba(255,255,255,0.92)",
          border: "2px dashed #6366f1", borderRadius: 4, overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
        }}>
          {renderSigPreview(result, width - 4, height - 4)}
        </div>
        {/* resize handle */}
        <div
          style={{
            position: "absolute", right: -5, bottom: -5, width: 14, height: 14,
            background: "#6366f1", borderRadius: 3, cursor: "se-resize",
            border: "2px solid white", zIndex: 1,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleRef.current = { startX: e.clientX, startY: e.clientY };
            const onMove = (ev: MouseEvent) => {
              if (!handleRef.current) return;
              onResize(ev.clientX - handleRef.current.startX, ev.clientY - handleRef.current.startY);
              handleRef.current = { startX: ev.clientX, startY: ev.clientY };
            };
            const onUp = () => { handleRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
        />
      </div>
    );
  }

  export default function SignaturePlacement() {
    const { id: documentId } = useParams<{ id: string }>();
    const { token } = useAuth();

    const [docInfo, setDocInfo] = useState<{ fileName: string; originalName: string } | null>(null);
    const [docLoading, setDocLoading] = useState(true);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [pdfNumPages, setPdfNumPages] = useState(0);
    const [pdfLoadError, setPdfLoadError] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pdfPageWidth, setPdfPageWidth] = useState(700);
    const [pdfPageHeight, setPdfPageHeight] = useState(0);
    const [zoom, setZoom] = useState(1);

    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 80, y: 80 });
    const [sigWidth, setSigWidth] = useState(180);
    const [sigHeight, setSigHeight] = useState(72);

    const [modalOpen, setModalOpen] = useState(false);
    const [sigResult, setSigResult] = useState<SignatureResult | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState<string | null>(null);

    const authH = { Authorization: `Bearer ${token}` };

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    // Fetch document metadata
    useEffect(() => {
      if (!documentId) return;
      axios.get(`${API_BASE}/api/docs/${documentId}`, { headers: authH })
        .then(res => setDocInfo(res.data.document))
        .catch(() => setDocInfo(null))
        .finally(() => setDocLoading(false));
    }, [documentId, token]);

    // Fetch PDF as blob (handles any stored path format)
    useEffect(() => {
      if (!documentId || !token) return;
      let url: string | null = null;
      fetch(`${API_BASE}/api/docs/${documentId}/file`, { headers: authH })
        .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
        .then(b => { url = URL.createObjectURL(b); setPdfBlobUrl(url); })
        .catch(() => setPdfLoadError(true));
      return () => { if (url) URL.revokeObjectURL(url); };
    }, [documentId, token]);

    // Responsive PDF width
    useEffect(() => {
      const upd = () => {
        if (pdfContainerRef.current) {
          const w = pdfContainerRef.current.clientWidth - 32;
          setPdfPageWidth(Math.max(400, Math.min(900, w)));
        }
      };
      upd();
      window.addEventListener("resize", upd);
      return () => window.removeEventListener("resize", upd);
    }, []);

    const computeRel = useCallback(() => ({
      x: Number(((position.x / (pdfPageWidth || 800)) * 100).toFixed(2)),
      y: Number(((position.y / (pdfPageHeight || 1100)) * 100).toFixed(2)),
    }), [position, pdfPageWidth, pdfPageHeight]);

    const saveSignature = async () => {
      if (!sigResult) return;
      setSaving(true); setError("");
      const rel = computeRel();
      try {
        await axios.post(`${API_BASE}/api/signatures`, {
          documentId, x: rel.x, y: rel.y, page: currentPage,
          type: sigResult.type,
          data: sigResult.dataUrl ?? `${sigResult.text}|${sigResult.style}`,
          signatureText: sigResult.text || null,
          signatureStyle: sigResult.style || 1,
          signatureColor: sigResult.color || "#1e3a8a",
          signatureImage: sigResult.type !== "stamp" ? (sigResult.dataUrl ?? null) : null,
          stampImage: sigResult.type === "stamp" ? sigResult.dataUrl : null,
          width: sigWidth, height: sigHeight,
        }, { headers: authH });
        setSaved(true);
        showToast("Signature saved successfully!");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save signature";
        setError(msg);
      } finally { setSaving(false); }
    };

    const relPos = computeRel();

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            background: "#10b981", color: "white", padding: "12px 20px", borderRadius: 12,
            fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}>✓ {toast}</div>
        )}

        {/* Modal */}
        {modalOpen && (
          <SignatureModal
            onSave={r => { setSigResult(r); setModalOpen(false); setSaved(false); setError(""); }}
            onClose={() => setModalOpen(false)}
          />
        )}

        {/* ── Top header bar ── */}
        <div style={{
          height: 56, background: "var(--bg-card)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 16, padding: "0 20px", flexShrink: 0, zIndex: 10,
        }}>
          <Link to="/dashboard" style={{
            display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)",
            textDecoration: "none", fontSize: "0.85rem", fontWeight: 600, padding: "6px 12px",
            borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-secondary)", flexShrink: 0,
          }}>← Dashboard</Link>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.95rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {docInfo?.originalName ?? "Loading document…"}
            </p>
            {pdfNumPages > 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: 0 }}>
                {pdfNumPages} page{pdfNumPages !== 1 ? "s" : ""} · Place your signature then save
              </p>
            )}
          </div>

          {/* Zoom controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(1)))}
              style={{ width: 32, height: 32, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", cursor: "pointer", fontSize: "1rem", fontWeight: 700 }}>−</button>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", minWidth: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))}
              style={{ width: 32, height: 32, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", cursor: "pointer", fontSize: "1rem", fontWeight: 700 }}>+</button>
            <button onClick={() => setZoom(1)}
              style={{ padding: "0 10px", height: 32, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", cursor: "pointer", fontSize: "0.75rem" }}>Fit</button>
          </div>

          {saved ? (
            <Link to="/dashboard" style={{
              padding: "8px 20px", borderRadius: 10, background: "#10b981", color: "white",
              fontWeight: 700, fontSize: "0.875rem", textDecoration: "none", flexShrink: 0,
            }}>✓ Done — Go to Dashboard</Link>
          ) : (
            <button onClick={saveSignature} disabled={!sigResult || saving}
              style={{
                padding: "8px 20px", borderRadius: 10, background: sigResult ? "var(--accent)" : "var(--bg-secondary)",
                color: sigResult ? "white" : "var(--text-disabled)", border: "none", fontWeight: 700, fontSize: "0.875rem",
                cursor: sigResult ? "pointer" : "default", flexShrink: 0, transition: "all 0.2s",
              }}
            >{saving ? "Saving…" : "Save Signature"}</button>
          )}
        </div>

        {/* ── Main 3-column layout ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── Left: Page thumbnails ── */}
          <div style={{
            width: 100, background: "var(--bg-secondary)", borderRight: "1px solid var(--border)",
            overflowY: "auto", flexShrink: 0, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 8,
          }}>
            {pdfBlobUrl && pdfNumPages > 0 && Array.from({ length: pdfNumPages }, (_, i) => i + 1).map(p => (
              <div key={p} onClick={() => setCurrentPage(p)} style={{
                cursor: "pointer", borderRadius: 8, overflow: "hidden",
                border: `2px solid ${currentPage === p ? "var(--accent)" : "var(--border)"}`,
                transition: "border-color 0.15s",
              }}>
                <Document file={pdfBlobUrl} loading={null}>
                  <Page pageNumber={p} width={78} renderAnnotationLayer={false} renderTextLayer={false} loading={
                    <div style={{ height: 100, background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 20, height: 20, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    </div>
                  } />
                </Document>
                <div style={{ textAlign: "center", padding: "4px 0", fontSize: "0.7rem", color: currentPage === p ? "var(--accent)" : "var(--text-muted)", fontWeight: currentPage === p ? 700 : 400, background: currentPage === p ? "var(--accent-light)" : "var(--bg-card)" }}>{p}</div>
              </div>
            ))}
            {(!pdfBlobUrl || pdfNumPages === 0) && (
              <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textAlign: "center", padding: "20px 4px" }}>Pages</div>
            )}
          </div>

          {/* ── Center: PDF canvas ── */}
          <div ref={pdfContainerRef} style={{ flex: 1, overflow: "auto", padding: 20, background: "#1e1f28", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
            {docLoading ? (
              <LoadingSpinner text="Loading…" />
            ) : !docInfo ? (
              <div style={{ color: "var(--danger)", padding: 20 }}>Document not found.</div>
            ) : pdfLoadError ? (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 32, textAlign: "center", maxWidth: 400 }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⚠️</div>
                <p style={{ color: "var(--danger)", fontWeight: 600 }}>Failed to load PDF</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>The file may be missing from the server. Try re-uploading.</p>
                <Link to="/dashboard" style={{ display: "inline-block", marginTop: 16, padding: "8px 20px", background: "var(--accent)", color: "white", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>← Dashboard</Link>
              </div>
            ) : (
              <div style={{ position: "relative", display: "inline-block", transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.2s" }}>
                <Document
                  file={pdfBlobUrl ?? undefined}
                  onLoadSuccess={({ numPages: n }) => setPdfNumPages(n)}
                  onLoadError={() => setPdfLoadError(true)}
                  loading={<LoadingSpinner text="Loading PDF…" />}
                >
                  <Page
                    pageNumber={currentPage}
                    width={pdfPageWidth}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    onRenderSuccess={page => setPdfPageHeight(page.height)}
                  />
                </Document>

                {/* DnD signature overlay */}
                {pdfPageWidth > 0 && pdfPageHeight > 0 && (
                  <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <DndContext onDragEnd={({ delta }) => {
                      setPosition(prev => ({
                        x: Math.max(0, Math.min(prev.x + delta.x, pdfPageWidth - sigWidth)),
                        y: Math.max(0, Math.min(prev.y + delta.y, pdfPageHeight - sigHeight)),
                      }));
                    }}>
                      <div style={{ position: "absolute", inset: 0, pointerEvents: sigResult ? "auto" : "none" }}>
                        {sigResult ? (
                          <DraggableSig
                            x={position.x} y={position.y}
                            result={sigResult} width={sigWidth} height={sigHeight}
                            onResize={(dw, dh) => { setSigWidth(w => Math.max(60, w + dw)); setSigHeight(h => Math.max(30, h + dh)); }}
                          />
                        ) : (
                          <div style={{
                            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center",
                            background: "rgba(13,14,18,0.5)", gap: 12,
                            pointerEvents: "none",
                          }}>
                            <div style={{ fontSize: "2.5rem" }}>✍️</div>
                            <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: "1rem", textShadow: "0 1px 4px rgba(0,0,0,0.8)", margin: 0 }}>
                              Choose a signature from the right panel
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

          {/* ── Right: Tools panel ── */}
          <div style={{
            width: 260, background: "var(--bg-card)", borderLeft: "1px solid var(--border)",
            overflowY: "auto", flexShrink: 0, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16,
          }}>
            {/* Signature section */}
            <div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Signature</p>
              {sigResult ? (
                <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 10, minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {renderSigPreview(sigResult, sigWidth, sigHeight)}
                </div>
              ) : (
                <div style={{ background: "var(--bg-secondary)", border: "2px dashed var(--border)", borderRadius: 10, padding: "20px 12px", textAlign: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>✍️</div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>No signature selected</p>
                </div>
              )}
              <button onClick={() => setModalOpen(true)} style={{
                width: "100%", padding: "10px 0", borderRadius: 10,
                background: sigResult ? "var(--bg-secondary)" : "var(--accent)",
                border: `1px solid ${sigResult ? "var(--border)" : "transparent"}`,
                color: sigResult ? "var(--text-secondary)" : "white",
                fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", transition: "all 0.15s",
              }}>
                {sigResult ? "Change Signature" : "Choose Signature ✍️"}
              </button>
            </div>

            <div style={{ height: 1, background: "var(--border)" }} />

            {/* Page navigation */}
            {pdfNumPages > 1 && (
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Page</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    style={{ flex: 1, padding: "8px 0", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", cursor: currentPage === 1 ? "default" : "pointer", fontWeight: 700, fontSize: "1rem", opacity: currentPage === 1 ? 0.4 : 1 }}>←</button>
                  <span style={{ color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600, minWidth: 60, textAlign: "center" }}>{currentPage} / {pdfNumPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(pdfNumPages, p + 1))} disabled={currentPage === pdfNumPages}
                    style={{ flex: 1, padding: "8px 0", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", cursor: currentPage === pdfNumPages ? "default" : "pointer", fontWeight: 700, fontSize: "1rem", opacity: currentPage === pdfNumPages ? 0.4 : 1 }}>→</button>
                </div>
              </div>
            )}

            {/* Size */}
            {sigResult && (
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Size</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 2 }}>WIDTH</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{sigWidth}px</div>
                  </div>
                  <div style={{ flex: 1, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 2 }}>HEIGHT</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{sigHeight}px</div>
                  </div>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", margin: "8px 0 0", textAlign: "center" }}>Drag the ↘ handle to resize</p>
              </div>
            )}

            {/* Position */}
            {sigResult && (
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Position</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 2 }}>X</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{relPos.x}%</div>
                  </div>
                  <div style={{ flex: 1, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 2 }}>Y</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{relPos.y}%</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ height: 1, background: "var(--border)" }} />

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ color: "var(--danger)", fontSize: "0.82rem", margin: 0 }}>⚠ {error}</p>
              </div>
            )}

            {/* Save */}
            {saved ? (
              <div>
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px", textAlign: "center", marginBottom: 10 }}>
                  <p style={{ color: "#10b981", fontWeight: 700, margin: 0 }}>✓ Signature saved!</p>
                </div>
                <button onClick={() => { setSaved(false); setSigResult(null); }} style={{ width: "100%", padding: "10px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", marginBottom: 8 }}>
                  Add Another
                </button>
                <Link to="/dashboard" style={{ display: "block", textAlign: "center", padding: "10px", background: "var(--accent)", borderRadius: 10, color: "white", fontWeight: 700, textDecoration: "none", fontSize: "0.875rem" }}>
                  ← Dashboard
                </Link>
              </div>
            ) : (
              <button onClick={saveSignature} disabled={!sigResult || saving} style={{
                width: "100%", padding: "12px", borderRadius: 10,
                background: sigResult && !saving ? "var(--accent)" : "var(--bg-secondary)",
                border: `1px solid ${sigResult ? "transparent" : "var(--border)"}`,
                color: sigResult ? "white" : "var(--text-disabled)",
                fontWeight: 700, fontSize: "0.95rem", cursor: sigResult && !saving ? "pointer" : "default",
                transition: "all 0.2s",
              }}>
                {saving ? "Saving…" : "Save Signature"}
              </button>
            )}

            {/* Links */}
            <div style={{ paddingTop: 4 }}>
              <Link to={`/recipients/${documentId}`} style={{ display: "block", padding: "10px 12px", borderRadius: 10, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)", textDecoration: "none", fontWeight: 600, fontSize: "0.82rem", textAlign: "center", marginBottom: 8 }}>
                👥 Manage Recipients
              </Link>
              <Link to={`/audit/${documentId}`} style={{ display: "block", padding: "10px 12px", borderRadius: 10, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)", textDecoration: "none", fontWeight: 600, fontSize: "0.82rem", textAlign: "center" }}>
                📋 View Audit Trail
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  