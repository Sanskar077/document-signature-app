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

const ACTION_META: Record<string, { label: string; icon: string; color: string }> = {
  document_uploaded:  { label: "Document Uploaded",   icon: "📤", color: "var(--info)" },
  link_generated:     { label: "Signing Link Created", icon: "🔗", color: "var(--accent)" },
  link_viewed:        { label: "Link Viewed",          icon: "👁",  color: "#a78bfa" },
  signature_placed:   { label: "Document Signed",      icon: "✍️",  color: "var(--success)" },
  document_finalized: { label: "PDF Generated",        icon: "📥",  color: "var(--success)" },
  recipient_added:    { label: "Recipient Added",      icon: "👤",  color: "var(--info)" },
  recipient_removed:  { label: "Recipient Removed",    icon: "🗑",  color: "var(--danger)" },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AuditTrail() {
  const { id: documentId } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [docName, setDocName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!documentId) return;

    const fetchAll = async () => {
      try {
        const [auditRes, docRes] = await Promise.all([
          axios.get(`${API_BASE}/api/audit/${documentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/docs/${documentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setLogs(auditRes.data.logs || []);
        setDocName(docRes.data.document?.originalName || "Document");
      } catch {
        setError("Failed to load audit trail.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [documentId, token]);

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)" }}>
          <div className="page-header">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
              <Link to="/dashboard" className="btn btn-ghost btn-sm">
                ← Dashboard
              </Link>
              <div>
                <h1 className="page-title">Audit Trail</h1>
                <p className="page-subtitle" style={{ maxWidth: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {docName}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner fullPage text="Loading audit trail…" />
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p className="empty-title">No activity yet</p>
              <p className="empty-desc">Events will appear here as the document is used.</p>
            </div>
          ) : (
            <div className="card" style={{ maxWidth: 680 }}>
              <div style={{ position: "relative" }}>
                {/* Vertical timeline line */}
                <div
                  style={{
                    position: "absolute",
                    left: 20,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: "var(--border)",
                    borderRadius: 1,
                  }}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {logs.map((log, i) => {
                    const meta = ACTION_META[log.action] ?? {
                      label: log.action,
                      icon: "•",
                      color: "var(--text-muted)",
                    };

                    return (
                      <div
                        key={log._id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "var(--space-4)",
                          paddingBottom: i < logs.length - 1 ? "var(--space-6)" : 0,
                          position: "relative",
                        }}
                      >
                        {/* Icon bubble */}
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "var(--bg-secondary)",
                            border: `2px solid ${meta.color}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1rem",
                            flexShrink: 0,
                            zIndex: 1,
                          }}
                        >
                          {meta.icon}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, paddingTop: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-2)" }}>
                            <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                              {meta.label}
                            </p>
                            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap" }}>
                              {formatTime(log.createdAt)}
                            </p>
                          </div>

                          {/* Actor */}
                          {(log.userId || log.actorEmail) && (
                            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                              by{" "}
                              <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                                {log.userId
                                  ? `${log.userId.name} (${log.userId.email})`
                                  : log.actorEmail}
                              </span>
                            </p>
                          )}

                          {/* Metadata pills */}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                              {log.action === "link_generated" && log.metadata.recipientEmail && (
                                <span className="badge badge-viewed">
                                  {String(log.metadata.recipientEmail)}
                                </span>
                              )}
                              {log.action === "signature_placed" && log.metadata.type && (
                                <span className="badge badge-signed">
                                  {String(log.metadata.type)} · page {String(log.metadata.page ?? 1)}
                                </span>
                              )}
                              {log.action === "recipient_added" && log.metadata.email && (
                                <span className="badge badge-viewed">
                                  {String(log.metadata.name)} · {String(log.metadata.role ?? "Signer")}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
