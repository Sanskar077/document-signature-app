import { useEffect, useState } from "react";
  import { useParams, Link } from "react-router-dom";
  import axios from "axios";
  import { useAuth } from "../context/AuthContext";
  import Navbar from "../components/Navbar";
  import LoadingSpinner from "../components/LoadingSpinner";

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  type Recipient = { _id: string; name: string; email: string; role: string; status: string; };
  const ROLES = [
    { value: "signer",    label: "Signer",    icon: "✍️", desc: "Signs the document" },
    { value: "witness",   label: "Witness",   icon: "👁",  desc: "Witnesses the signing" },
    { value: "validator", label: "Validator", icon: "✅", desc: "Validates the document" },
  ] as const;

  const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
    signer:    { color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
    witness:   { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
    validator: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  };
  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    signed:  { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    declined:{ color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  };

  export default function Recipients() {
    const { id: documentId } = useParams<{ id: string }>();
    const { token } = useAuth();
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [loading, setLoading] = useState(true);
    const [docName, setDocName] = useState("");
    const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [role, setRole] = useState("signer");
    const [adding, setAdding] = useState(false); const [addError, setAddError] = useState("");
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const authH = { Authorization: `Bearer ${token}` };

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const fetchAll = async () => {
      try {
        const [rr, dr] = await Promise.all([
          axios.get(`${API_BASE}/api/recipients/${documentId}`, { headers: authH }),
          axios.get(`${API_BASE}/api/docs/${documentId}`, { headers: authH }),
        ]);
        setRecipients(rr.data.recipients || []);
        setDocName(dr.data.document?.originalName || "Document");
      } catch { /**/ } finally { setLoading(false); }
    };
    useEffect(() => { if (documentId) fetchAll(); }, [documentId]);

    const handleAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !email.trim()) return;
      setAdding(true); setAddError("");
      try {
        await axios.post(`${API_BASE}/api/recipients/${documentId}`, { name: name.trim(), email: email.trim(), role }, { headers: authH });
        setName(""); setEmail(""); setRole("signer");
        await fetchAll();
        showToast("Recipient added!");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to add recipient";
        setAddError(msg);
      } finally { setAdding(false); }
    };

    const handleRemove = async (id: string) => {
      setRemovingId(id);
      try {
        await axios.delete(`${API_BASE}/api/recipients/${documentId}/${id}`, { headers: authH });
        setRecipients(p => p.filter(r => r._id !== id));
        showToast("Recipient removed");
      } catch { /**/ } finally { setRemovingId(null); }
    };

    return (
      <>
        <Navbar />
        {toast && (
          <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#10b981", color: "white", padding: "12px 20px", borderRadius: 12, fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            ✓ {toast}
          </div>
        )}
        <div className="page-wrapper">
          <div className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)", maxWidth: 860 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "var(--space-8)" }}>
              <Link to={`/sign/${documentId}`} style={{ padding: "8px 14px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600, flexShrink: 0 }}>← Sign</Link>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ color: "var(--text-primary)", fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Recipients</h1>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{docName}</p>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexShrink: 0 }}>
                <Link to={`/audit/${documentId}`} style={{ padding: "8px 14px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}>📋 Audit</Link>
                <Link to="/dashboard" style={{ padding: "8px 14px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}>📄 Dashboard</Link>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--space-6)", alignItems: "start" }}>
              {/* Recipient List */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: 700, margin: 0 }}>Invited Signers</h2>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{recipients.length} total</span>
                </div>
                {loading ? <LoadingSpinner text="Loading…" /> : recipients.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", border: "2px dashed var(--border)", borderRadius: 16 }}>
                    <div style={{ fontSize: "3rem", marginBottom: 12 }}>👥</div>
                    <p style={{ color: "var(--text-primary)", fontWeight: 600, margin: 0 }}>No recipients yet</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6 }}>Add people using the form to invite them to sign.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {recipients.map((r, i) => {
                      const rc = ROLE_COLORS[r.role] ?? { color: "#9ca3af", bg: "rgba(156,163,175,0.12)" };
                      const sc = STATUS_COLORS[r.status] ?? { color: "#9ca3af", bg: "rgba(156,163,175,0.12)" };
                      return (
                        <div key={r._id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: rc.bg, border: `1.5px solid ${rc.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800, color: rc.color, flexShrink: 0 }}>{i + 1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: "var(--text-primary)", fontWeight: 700, margin: 0, fontSize: "0.9rem" }}>{r.name}</p>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</p>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, color: rc.color, background: rc.bg }}>
                              {ROLES.find(rl => rl.value === r.role)?.label ?? r.role}
                            </span>
                            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, color: sc.color, background: sc.bg }}>
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </span>
                            <button onClick={() => handleRemove(r._id)} disabled={removingId === r._id} style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--danger)", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}
                              onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-light)"; }} onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-secondary)"; }}
                            >{removingId === r._id ? "…" : "×"}</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Recipient Form */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, position: "sticky", top: "calc(var(--navbar-h) + 24px)" }}>
                <h3 style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 700, margin: "0 0 20px" }}>Add Recipient</h3>
                <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Full Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "var(--border-focus)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                    />
                  </div>
                  <div>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "var(--border-focus)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                    />
                  </div>
                  <div>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Role</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {ROLES.map(r => (
                        <label key={r.value} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: role === r.value ? "var(--accent-light)" : "var(--bg-secondary)", border: `1.5px solid ${role === r.value ? "var(--accent)" : "var(--border)"}`, cursor: "pointer", transition: "all 0.15s" }}>
                          <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} style={{ display: "none" }} />
                          <span style={{ fontSize: "1rem" }}>{r.icon}</span>
                          <div>
                            <p style={{ color: role === r.value ? "var(--accent)" : "var(--text-primary)", fontWeight: 700, fontSize: "0.82rem", margin: 0 }}>{r.label}</p>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", margin: 0 }}>{r.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  {addError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 12px", color: "var(--danger)", fontSize: "0.82rem" }}>⚠ {addError}</div>}
                  <button type="submit" disabled={adding || !name.trim() || !email.trim()} style={{
                    padding: "12px", borderRadius: 10, background: "var(--accent)", border: "none", color: "white", fontWeight: 700, fontSize: "0.875rem",
                    cursor: adding || !name.trim() || !email.trim() ? "default" : "pointer", opacity: adding || !name.trim() || !email.trim() ? 0.6 : 1, transition: "opacity 0.15s",
                  }}>{adding ? "Adding…" : "Add Recipient"}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  