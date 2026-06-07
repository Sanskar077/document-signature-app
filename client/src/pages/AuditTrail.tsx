import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

type AuditEvent = {
  _id: string;
  action: string;
  userId?: { name: string; email: string } | null;
  actorEmail?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

const ACTION_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  document_uploaded: { label: "Document Uploaded", icon: "📤", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  link_generated: { label: "Signing Link Created", icon: "🔗", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  link_viewed: { label: "Link Viewed", icon: "👁", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  signature_placed: { label: "Signature Added", icon: "✍️", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  document_finalized: { label: "Signed PDF Generated", icon: "📥", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  recipient_added: { label: "Recipient Added", icon: "👤", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  recipient_removed: { label: "Recipient Removed", icon: "🗑", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function getActor(evt: AuditEvent) {
  if (evt.userId?.name) return evt.userId.name;
  if (evt.userId?.email) return evt.userId.email;
  if (evt.actorEmail) return evt.actorEmail;
  const m = evt.metadata;
  if (m?.name && typeof m.name === "string") return m.name;
  if (m?.email && typeof m.email === "string") return m.email;
  return "System";
}

function MetadataChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "var(--bg-secondary)", border: "1px solid var(--border)",
      borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", color: "var(--text-muted)",
    }}>
      <span style={{ color: "var(--text-disabled)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <span style={{ color: "var(--text-secondary)" }}>{String(value)}</span>
    </span>
  );
}

export default function AuditTrail() {
  const { id: docId } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [docName, setDocName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId) return;
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_BASE}/api/audit/${docId}`, { headers: h }),
      axios.get(`${API_BASE}/api/docs/${docId}`, { headers: h }),
    ])
      .then(([auditRes, docRes]) => {
        setEvents(auditRes.data.logs || auditRes.data.events || []);
        setDocName(docRes.data.document?.originalName || "Document");
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [docId, token]);

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)", maxWidth: 760 }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "var(--space-8)" }}>
            <Link to="/dashboard" style={{ padding: "8px 14px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600, flexShrink: 0 }}>← Back</Link>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ color: "var(--text-primary)", fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Audit Trail</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{docName}</p>
            </div>
            <div style={{ marginLeft: "auto", flexShrink: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "6px 14px", textAlign: "center" }}>
              <div style={{ color: "var(--accent)", fontWeight: 800, fontSize: "1.1rem" }}>{events.length}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 600 }}>Events</div>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner text="Loading activity…" />
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", border: "2px dashed var(--border)", borderRadius: 16 }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>📋</div>
              <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1rem", margin: 0 }}>No activity yet</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6 }}>Actions will appear here as you work with this document.</p>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              {/* Vertical line */}
              <div style={{ position: "absolute", left: 23, top: 24, bottom: 0, width: 2, background: "var(--border)", zIndex: 0 }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {events.map((evt, i) => {
                  const meta = ACTION_META[evt.action] ?? { label: evt.action.replace(/_/g, " "), icon: "📌", color: "var(--text-muted)", bg: "var(--bg-secondary)" };
                  const actor = getActor(evt);
                  const m = evt.metadata || {};

                  return (
                    <div key={evt._id} style={{ display: "flex", gap: 16, paddingBottom: 24, position: "relative", zIndex: 1 }}>
                      {/* Icon bubble */}
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: meta.bg, border: `2px solid ${meta.color}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.1rem", flexShrink: 0, background2: "var(--bg-primary)",
                        boxShadow: "0 0 0 4px var(--bg-primary)",
                      } as React.CSSProperties}>
                        {meta.icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, paddingTop: 8 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                          <div>
                            <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem" }}>{meta.label}</span>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginLeft: 8 }}>by <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{actor}</span></span>
                          </div>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", flexShrink: 0 }}>{formatTime(evt.createdAt)}</span>
                        </div>

                        {/* Metadata chips */}
                        {Object.keys(m).length > 0 && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {typeof m.originalName === "string" && (
                              <MetadataChip label="file" value={m.originalName} />
                            )}

                            {typeof m.fileName === "string" && !m.originalName && (
                              <MetadataChip label="file" value={m.fileName} />
                            )}

                            {typeof m.role === "string" && (
                              <MetadataChip label="role" value={m.role} />
                            )}

                            {typeof m.signatureCount === "number" && (
                              <MetadataChip
                                label="signatures"
                                value={String(m.signatureCount)}
                              />
                            )}

                            {typeof m.outputFileName === "string" && (
                              <MetadataChip label="output" value={m.outputFileName} />
                            )}
                          </div>
                        )}

                        {/* Connector to next */}
                        {i < events.length - 1 && (
                          <div style={{ height: 1 }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
