import { useEffect, useRef, useState, useCallback } from "react";
  import axios from "axios";
  import { Link, useNavigate } from "react-router-dom";
  import { useAuth } from "../context/AuthContext";
  import Navbar from "../components/Navbar";
  import LoadingSpinner from "../components/LoadingSpinner";

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  type Doc = {
    _id: string;
    originalName: string;
    status: string;
    fileSize: number;
    fileName: string;
    recipientCount?: number;
    createdAt: string;
    updatedAt: string;
  };

  type AuditEvent = {
    _id: string;
    action: string;
    createdAt: string;
    metadata?: { originalName?: string; fileName?: string };
  };

  function formatSize(b: number) {
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(1) + " MB";
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    const d = Math.floor(h / 24);
    if (d < 7) return d + "d ago";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    pending:          { label: "Pending",        color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  dot: "#f59e0b" },
    in_progress:      { label: "In Progress",    color: "#a78bfa", bg: "rgba(167,139,250,0.12)", dot: "#a78bfa" },
    partially_signed: { label: "Partial",        color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  dot: "#60a5fa" },
    signed:           { label: "Signed",         color: "#10b981", bg: "rgba(16,185,129,0.12)",  dot: "#10b981" },
    completed:        { label: "Completed",      color: "#10b981", bg: "rgba(16,185,129,0.12)",  dot: "#10b981" },
    rejected:         { label: "Rejected",       color: "#ef4444", bg: "rgba(239,68,68,0.12)",   dot: "#ef4444" },
    expired:          { label: "Expired",        color: "#6b7280", bg: "rgba(107,114,128,0.12)", dot: "#6b7280" },
  };

  function StatusPill({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#9ca3af", bg: "rgba(156,163,175,0.12)", dot: "#9ca3af" };
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600,
        color: cfg.color, background: cfg.bg, letterSpacing: "0.02em", whiteSpace: "nowrap",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
        {cfg.label}
      </span>
    );
  }

  const ACTION_ICONS: Record<string, string> = {
    document_uploaded:  "📤", link_generated: "🔗", signature_placed: "✍️",
    document_finalized: "📥", recipient_added: "👤", recipient_removed: "🗑",
    link_viewed: "👁",
  };

  export default function Dashboard() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [docs, setDocs] = useState<Doc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [whoModal, setWhoModal] = useState<{ file: File } | null>(null);
    const [actions, setActions] = useState<Record<string, boolean>>({});
    const [shareLinks, setShareLinks] = useState<Record<string, string>>({});
    const [finalizeResults, setFinalizeResults] = useState<Record<string, string>>({});
    const [recentActivity, setRecentActivity] = useState<AuditEvent[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const authH = { Authorization: `Bearer ${token}` };

    const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3500);
    }, []);

    const fetchDocs = useCallback(async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/docs`, { headers: authH });
        setDocs(res.data.documents || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }, [token]);

    const fetchActivity = useCallback(async () => {
      try {
        // Get activity from the most recent documents' audit logs
        // We'll show recent global activity
      } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchDocs(); }, [fetchDocs]);

    const handleFilePicked = (file: File) => {
      setUploadError("");
      if (file.type !== "application/pdf") {
        setUploadError("Only PDF files are supported.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setUploadError("File must be smaller than 20 MB.");
        return;
      }
      setWhoModal({ file });
    };

    const handleUpload = async (file: File, mode: "self" | "others") => {
      setWhoModal(null);
      setUploading(true);
      setUploadError("");
      const form = new FormData();
      form.append("document", file);
      try {
        const res = await axios.post(`${API_BASE}/api/docs/upload`, form, {
          headers: { ...authH, "Content-Type": "multipart/form-data" },
        });
        await fetchDocs();
        showToast("Document uploaded successfully!");
        const docId = res.data.document._id;
        if (mode === "others") {
          navigate(`/recipients/${docId}`);
        } else {
          navigate(`/sign/${docId}`);
        }
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Upload failed.";
        setUploadError(msg);
        showToast(msg, "error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    const handleFinalize = async (docId: string) => {
      setActions(a => ({ ...a, [docId + "_fin"]: true }));
      try {
        const res = await axios.post(`${API_BASE}/api/docs/${docId}/finalize`, {}, { headers: authH });
        setFinalizeResults(r => ({ ...r, [docId]: `${API_BASE}${res.data.downloadPath}` }));
        await fetchDocs();
        showToast("Signed PDF generated!");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Finalize failed.";
        showToast(msg, "error");
      } finally {
        setActions(a => ({ ...a, [docId + "_fin"]: false }));
      }
    };

    const handleShare = async (docId: string) => {
      setActions(a => ({ ...a, [docId + "_share"]: true }));
      try {
        const res = await axios.post(`${API_BASE}/api/public-sign/${docId}`, {}, { headers: authH });
        const url = res.data.publicUrl as string;
        setShareLinks(s => ({ ...s, [docId]: url }));
        await navigator.clipboard.writeText(url).catch(() => {});
        showToast("Signing link copied to clipboard!");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to generate link.";
        showToast(msg, "error");
      } finally {
        setActions(a => ({ ...a, [docId + "_share"]: false }));
      }
    };

    // Stats
    const total   = docs.length;
    const pending = docs.filter(d => d.status === "pending").length;
    const inProg  = docs.filter(d => d.status === "in_progress" || d.status === "partially_signed").length;
    const signed  = docs.filter(d => d.status === "signed" || d.status === "completed").length;
    const rejected = docs.filter(d => d.status === "rejected" || d.status === "expired").length;

    const STATS = [
      { label: "Total",      value: total,    color: "#6366f1", icon: "📄" },
      { label: "Pending",    value: pending,  color: "#f59e0b", icon: "⏳" },
      { label: "In Progress",value: inProg,   color: "#a78bfa", icon: "📝" },
      { label: "Signed",     value: signed,   color: "#10b981", icon: "✅" },
      ...(rejected > 0 ? [{ label: "Rejected/Expired", value: rejected, color: "#ef4444", icon: "❌" }] : []),
    ];

    return (
      <>
        <Navbar />
        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            background: toast.type === "success" ? "#10b981" : "#ef4444",
            color: "white", padding: "12px 20px", borderRadius: 12,
            fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            animation: "slideUp 0.3s ease", display: "flex", alignItems: "center", gap: 8,
          }}>
            {toast.type === "success" ? "✓" : "⚠"} {toast.msg}
          </div>
        )}

        {/* Who Will Sign Modal */}
        {whoModal && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }} onClick={() => setWhoModal(null)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 20, padding: "40px 36px", maxWidth: 480, width: "calc(100% - 40px)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: "1.5rem" }}>📄</span>
              </div>
              <h2 style={{ color: "var(--text-primary)", fontSize: "1.3rem", fontWeight: 700, margin: "0 0 6px" }}>
                Who will sign?
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0 0 28px" }}>
                "{whoModal.file.name}"
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button onClick={() => handleUpload(whoModal.file, "self")} style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "18px 20px",
                  background: "var(--accent-light)", border: "2px solid var(--accent)",
                  borderRadius: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.25)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--accent-light)")}
                >
                  <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>✍️</span>
                  <div>
                    <p style={{ color: "var(--text-primary)", fontWeight: 700, margin: 0, fontSize: "1rem" }}>Only me</p>
                    <p style={{ color: "var(--text-muted)", margin: "2px 0 0", fontSize: "0.82rem" }}>I'll sign this document myself</p>
                  </div>
                </button>
                <button onClick={() => handleUpload(whoModal.file, "others")} style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "18px 20px",
                  background: "var(--bg-secondary)", border: "2px solid var(--border)",
                  borderRadius: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.borderColor = "var(--border-hover)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>👥</span>
                  <div>
                    <p style={{ color: "var(--text-primary)", fontWeight: 700, margin: 0, fontSize: "1rem" }}>Several people</p>
                    <p style={{ color: "var(--text-muted)", margin: "2px 0 0", fontSize: "0.82rem" }}>I'll invite others to sign</p>
                  </div>
                </button>
              </div>
              <button onClick={() => setWhoModal(null)} style={{
                marginTop: 20, width: "100%", padding: "10px", background: "transparent",
                border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem",
              }}>Cancel</button>
            </div>
          </div>
        )}

        <div className="page-wrapper">
          <div className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)", maxWidth: 1200 }}>

            {/* Header */}
            <div style={{ marginBottom: "var(--space-8)" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                {user?.name ? `Good day, ${user.name.split(" ")[0]} 👋` : "Dashboard"}
              </h1>
              <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: "0.9rem" }}>
                Manage your documents and signing requests
              </p>
            </div>

            {/* Stats Row */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: "var(--space-8)" }}>
              {STATS.map(s => (
                <div key={s.label} style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 16, padding: "20px 24px", flex: "1 1 140px", minWidth: 120,
                  borderLeft: `4px solid ${s.color}`, transition: "transform 0.2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "none")}
                >
                  <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "var(--space-6)", alignItems: "start" }}>
              {/* Left column */}
              <div>
                {/* Upload zone */}
                <div
                  className={`upload-zone ${dragOver ? "drag-over" : ""}`}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFilePicked(f); }}
                  style={{ marginBottom: "var(--space-6)", cursor: uploading ? "default" : "pointer" }}
                >
                  <input ref={fileInputRef} type="file" accept="application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleFilePicked(f); }} style={{ display: "none" }} />
                  {uploading ? (
                    <LoadingSpinner text="Uploading document…" />
                  ) : (
                    <>
                      <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📁</div>
                      <p style={{ fontWeight: 700, color: "var(--text-primary)", margin: 0, fontSize: "1rem" }}>
                        {dragOver ? "Drop your PDF here" : "Upload a PDF to sign"}
                      </p>
                      <p style={{ color: "var(--text-muted)", margin: "6px 0 0", fontSize: "0.82rem" }}>
                        Drag & drop or click to browse — PDF only, max 20 MB
                      </p>
                    </>
                  )}
                </div>

                {uploadError && (
                  <div className="alert alert-error" style={{ marginBottom: "var(--space-4)" }}>
                    <span>⚠</span> <span>{uploadError}</span>
                  </div>
                )}

                {/* Document List */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                  <h2 style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                    Your Documents
                  </h2>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{total} total</span>
                </div>

                {loading ? (
                  <LoadingSpinner text="Loading…" />
                ) : docs.length === 0 ? (
                  <div style={{
                    textAlign: "center", padding: "60px 20px",
                    background: "var(--bg-card)", border: "2px dashed var(--border)",
                    borderRadius: 16,
                  }}>
                    <div style={{ fontSize: "3rem", marginBottom: 12 }}>📂</div>
                    <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1rem", margin: 0 }}>No documents yet</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6 }}>Upload your first PDF above to get started.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {docs.map(doc => (
                      <div key={doc._id} style={{
                        background: "var(--bg-card)", border: "1px solid var(--border)",
                        borderRadius: 14, padding: "18px 20px", transition: "border-color 0.2s",
                      }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                      >
                        {/* Doc header row */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                          <div style={{
                            width: 44, height: 56, background: "var(--accent-light)",
                            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "1.4rem", flexShrink: 0, border: "1px solid var(--border)",
                          }}>📄</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px", fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {doc.originalName}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <StatusPill status={doc.status} />
                              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{formatSize(doc.fileSize)}</span>
                              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>·</span>
                              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{timeAgo(doc.updatedAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Finalize result */}
                        {finalizeResults[doc._id] && (
                          <a href={finalizeResults[doc._id]} download style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                            borderRadius: 10, color: "#10b981", fontSize: "0.85rem", fontWeight: 600,
                            textDecoration: "none", marginBottom: 12,
                          }}>
                            ⬇ Download Signed PDF
                          </a>
                        )}
                        {shareLinks[doc._id] && (
                          <div style={{
                            display: "flex", gap: 8, alignItems: "center", marginBottom: 12,
                            padding: "10px 14px", background: "rgba(99,102,241,0.1)",
                            border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10,
                          }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {shareLinks[doc._id]}
                            </span>
                            <button onClick={() => { navigator.clipboard.writeText(shareLinks[doc._id]); showToast("Copied!"); }} style={{
                              background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: "0.8rem", fontWeight: 600, flexShrink: 0,
                            }}>Copy</button>
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Link to={`/preview/${doc._id}?file=${encodeURIComponent(doc.fileName)}`}
                            style={{ padding: "7px 14px", borderRadius: 8, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                          >Preview</Link>
                          <Link to={`/sign/${doc._id}`}
                            style={{ padding: "7px 14px", borderRadius: 8, background: "var(--accent-light)", border: "1px solid rgba(99,102,241,0.3)", color: "var(--accent)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.25)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "var(--accent-light)"; }}
                          >✍️ Sign</Link>
                          <Link to={`/recipients/${doc._id}`}
                            style={{ padding: "7px 14px", borderRadius: 8, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                          >👥 Recipients</Link>
                          <Link to={`/audit/${doc._id}`}
                            style={{ padding: "7px 14px", borderRadius: 8, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                          >📋 Audit</Link>
                          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                            <button onClick={() => handleShare(doc._id)} disabled={actions[doc._id + "_share"]}
                              style={{ padding: "7px 14px", borderRadius: 8, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                            >{actions[doc._id + "_share"] ? "…" : "🔗 Share"}</button>
                            {finalizeResults[doc._id] ? (
                              <a href={finalizeResults[doc._id]} download
                                style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}
                              >⬇ Download</a>
                            ) : (
                              <button onClick={() => handleFinalize(doc._id)} disabled={actions[doc._id + "_fin"]}
                                style={{ padding: "7px 14px", borderRadius: 8, background: "var(--accent)", border: "none", color: "white", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s" }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                              >{actions[doc._id + "_fin"] ? "Generating…" : "Generate PDF"}</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right sidebar */}
              <div style={{ position: "sticky", top: "calc(var(--navbar-h) + var(--space-6))" }}>
                {/* Quick actions */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, marginBottom: 16 }}>
                  <h3 style={{ color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 16px" }}>Quick Actions</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button onClick={() => fileInputRef.current?.click()} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                      background: "var(--accent)", border: "none", borderRadius: 10,
                      color: "white", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", width: "100%",
                    }}>
                      <span>📤</span> Upload & Sign
                    </button>
                  </div>
                </div>

                {/* Summary */}
                {docs.length > 0 && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, marginBottom: 16 }}>
                    <h3 style={{ color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 16px" }}>Status Summary</h3>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                      const count = docs.filter(d => d.status === key).length;
                      if (count === 0) return null;
                      return (
                        <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot }} />
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{cfg.label}</span>
                          </div>
                          <span style={{ color: cfg.color, fontWeight: 700, fontSize: "0.9rem" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Recent docs */}
                {docs.length > 0 && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                    <h3 style={{ color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 16px" }}>Recent</h3>
                    {docs.slice(0, 4).map(doc => (
                      <Link key={doc._id} to={`/sign/${doc._id}`} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                        borderBottom: "1px solid var(--border)", textDecoration: "none",
                      }}>
                        <div style={{ width: 28, height: 28, background: "var(--accent-light)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>📄</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: "var(--text-primary)", fontSize: "0.8rem", fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.originalName}</p>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", margin: 0 }}>{timeAgo(doc.updatedAt)}</p>
                        </div>
                        <StatusPill status={doc.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  