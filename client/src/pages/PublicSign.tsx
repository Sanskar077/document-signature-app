import { useEffect, useState } from "react";
  import { useParams, Link } from "react-router-dom";
  import axios from "axios";
  import { Document, Page, pdfjs } from "react-pdf";
  import SignatureModal, { type SignatureResult } from "../components/tabs/SignatureModal";
  import LoadingSpinner from "../components/LoadingSpinner";
  import "react-pdf/dist/Page/AnnotationLayer.css";
  import "react-pdf/dist/Page/TextLayer.css";

  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  export default function PublicSign() {
    const { token } = useParams<{ token: string }>();
    const [doc, setDoc] = useState<{ _id: string; originalName: string; status: string } | null>(null);
    const [pdfBlob, setPdfBlob] = useState<string | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [sigResult, setSigResult] = useState<SignatureResult | null>(null);
    const [position, _setPosition] = useState({ x: 80, y: 80 });
    const [name, setName] = useState(""); const [email, setEmail] = useState("");
    const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false);
    const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [pdfW, _setPdfW] = useState(700); const [pdfH, setPdfH] = useState(0);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    useEffect(() => {
      if (!token) return;
      axios.get(`${API_BASE}/api/public-sign/view/${token}`)
        .then(r => setDoc(r.data.document))
        .catch(() => setError("This signing link is invalid or has expired."))
        .finally(() => setLoading(false));
    }, [token]);

    useEffect(() => {
      if (!token || !doc) return;
      let url: string | null = null;
      fetch(`${API_BASE}/api/public-sign/file/${token}`)
        .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
        .then(b => { url = URL.createObjectURL(b); setPdfBlob(url); })
        .catch(() => setError("Could not load the PDF document."));
      return () => { if (url) URL.revokeObjectURL(url); };
    }, [token, doc]);

    const handleSave = async () => {
      if (!sigResult || !name.trim() || !email.trim()) return;
      setSaving(true); setError("");
      try {
        await axios.post(`${API_BASE}/api/public-sign/sign/${token}`, {
          x: ((position.x / pdfW) * 100).toFixed(2),
          y: ((position.y / pdfH) * 100).toFixed(2),
          page: currentPage, type: sigResult.type,
          data: sigResult.dataUrl ?? `${sigResult.text}|${sigResult.style}`,
          signatureText: sigResult.text, signatureStyle: sigResult.style, signatureColor: sigResult.color,
          signatureImage: sigResult.type !== "stamp" ? (sigResult.dataUrl ?? null) : null,
          stampImage: sigResult.type === "stamp" ? sigResult.dataUrl : null,
          signerName: name.trim(), signerEmail: email.trim(), width: 180, height: 72,
        });
        setSaved(true); showToast("Signature submitted!");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to submit";
        setError(msg);
      } finally { setSaving(false); }
    };

    if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}><LoadingSpinner text="Loading…" /></div>;
    if (error && !doc) return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", padding: 24 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 48, textAlign: "center", maxWidth: 440 }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: "var(--text-primary)", fontWeight: 800, margin: "0 0 8px" }}>Link Expired</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: "0.9rem" }}>{error}</p>
          <Link to="/" style={{ padding: "10px 24px", borderRadius: 10, background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 700 }}>← Home</Link>
        </div>
      </div>
    );

    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#10b981", color: "white", padding: "12px 20px", borderRadius: 12, fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>✓ {toast}</div>}
        {modalOpen && <SignatureModal onSave={r => { setSigResult(r); setModalOpen(false); }} onClose={() => setModalOpen(false)} />}

        {/* Header */}
        <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: "1.2rem" }}>✍️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.95rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc?.originalName ?? "Document"}</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: 0 }}>You're invited to sign this document</p>
          </div>
          <div style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "4px 12px", fontSize: "0.78rem", color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>🔒 Secure Link</div>
        </div>

        <div className="container" style={{ maxWidth: 960, paddingTop: 32, paddingBottom: 64 }}>
          {saved ? (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
              <div style={{ fontSize: "4rem", marginBottom: 16 }}>🎉</div>
              <h2 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.5rem", margin: "0 0 8px" }}>Signature submitted!</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: 32 }}>Your signature has been successfully added to the document.</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => setSaved(false)} style={{ padding: "10px 24px", borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}>Add Another Signature</button>
                <Link to="/" style={{ padding: "10px 24px", borderRadius: 10, background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 700 }}>Done</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" }}>
              {/* PDF viewer */}
              <div style={{ background: "#1e1f28", borderRadius: 16, overflow: "hidden", display: "flex", justifyContent: "center", padding: 20 }}>
                {pdfBlob ? (
                  <div style={{ position: "relative" }}>
                    <Document file={pdfBlob} onLoadSuccess={({ numPages: n }) => setNumPages(n)} loading={<LoadingSpinner text="Loading PDF…" />}>
                      <Page pageNumber={currentPage} width={Math.min(pdfW, 600)} renderAnnotationLayer={false} renderTextLayer={false} onRenderSuccess={p => setPdfH(p.height)} />
                    </Document>
                    {numPages > 1 && (
                      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 14px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer" }}>←</button>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "6px 12px" }}>{currentPage} / {numPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages} style={{ padding: "6px 14px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer" }}>→</button>
                      </div>
                    )}
                  </div>
                ) : <LoadingSpinner text="Loading PDF…" />}
              </div>

              {/* Signing panel */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Your Info</p>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", marginBottom: 10 }}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--border-focus)")} onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--border-focus)")} onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
                <div style={{ height: 1, background: "var(--border)" }} />
                <div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Signature</p>
                  {sigResult ? (
                    <div style={{ background: "white", borderRadius: 10, padding: 12, minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      {sigResult.dataUrl ? <img src={sigResult.dataUrl} alt="sig" style={{ maxWidth: "100%", maxHeight: 60, objectFit: "contain" }} /> :
                        <span style={{ fontFamily: "var(--font-sign)", fontSize: "1.4rem", color: sigResult.color || "#1e3a8a" }}>{sigResult.text}</span>}
                    </div>
                  ) : null}
                  <button onClick={() => setModalOpen(true)} style={{ width: "100%", padding: "10px", borderRadius: 10, background: sigResult ? "var(--bg-secondary)" : "var(--accent)", border: `1px solid ${sigResult ? "var(--border)" : "transparent"}`, color: sigResult ? "var(--text-secondary)" : "white", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>
                    {sigResult ? "Change Signature" : "Choose Signature ✍️"}
                  </button>
                </div>
                {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 12px", color: "var(--danger)", fontSize: "0.82rem" }}>⚠ {error}</div>}
                <button onClick={handleSave} disabled={!sigResult || !name.trim() || !email.trim() || saving}
                  style={{ padding: "12px", borderRadius: 10, background: sigResult && name && email ? "var(--accent)" : "var(--bg-secondary)", border: "none", color: sigResult && name && email ? "white" : "var(--text-disabled)", fontWeight: 700, fontSize: "0.95rem", cursor: sigResult && name && email && !saving ? "pointer" : "default", transition: "all 0.2s" }}
                >{saving ? "Submitting…" : "Submit Signature"}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  