import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

type Recipient = {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

const ROLES = ["Signer", "Witness", "Validator"] as const;

export default function Recipients() {
  const { id: documentId } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [docName, setDocName] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("Signer");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const authHeader = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!documentId) return;
    fetchAll();
  }, [documentId]);

  const fetchAll = async () => {
    try {
      const [recipRes, docRes] = await Promise.all([
        axios.get(`${API_BASE}/api/recipients/${documentId}`, { headers: authHeader }),
        axios.get(`${API_BASE}/api/docs/${documentId}`, { headers: authHeader }),
      ]);
      setRecipients(recipRes.data.recipients || []);
      setDocName(docRes.data.document?.originalName || "Document");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      await axios.post(
        `${API_BASE}/api/recipients/${documentId}`,
        { name: name.trim(), email: email.trim(), role },
        { headers: authHeader }
      );
      setName("");
      setEmail("");
      setRole("Signer");
      await fetchAll();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to add recipient";
      setAddError(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (recipientId: string) => {
    setRemovingId(recipientId);
    try {
      await axios.delete(`${API_BASE}/api/recipients/${documentId}/${recipientId}`, {
        headers: authHeader,
      });
      setRecipients((prev) => prev.filter((r) => r._id !== recipientId));
    } catch {
    } finally {
      setRemovingId(null);
    }
  };

  const ROLE_BADGE: Record<string, string> = {
    Signer: "badge-signed",
    Witness: "badge-viewed",
    Validator: "badge-pending",
  };

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
                <h1 className="page-title">Recipients</h1>
                <p
                  className="page-subtitle"
                  style={{ maxWidth: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {docName}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "var(--space-6)", gridTemplateColumns: "1fr 340px", alignItems: "start" }}>
            {/* Recipient list */}
            <div>
              <div className="section-header" style={{ marginBottom: "var(--space-4)" }}>
                <div>
                  <h2 className="section-title">Signer List</h2>
                  <p className="section-desc">{recipients.length} recipient{recipients.length !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {loading ? (
                <LoadingSpinner text="Loading recipients…" />
              ) : recipients.length === 0 ? (
                <div className="empty-state" style={{ padding: "var(--space-12) 0" }}>
                  <div className="empty-icon">👥</div>
                  <p className="empty-title">No recipients yet</p>
                  <p className="empty-desc">Add signers using the form on the right.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  {recipients.map((r, i) => (
                    <div
                      key={r._id}
                      className="card"
                      style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-4) var(--space-5)" }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "white",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0, fontSize: "0.95rem" }}>
                          {r.name}
                        </p>
                        <p style={{ color: "var(--text-muted)", margin: "2px 0 0", fontSize: "0.82rem" }}>
                          {r.email}
                        </p>
                      </div>
                      <span className={`badge ${ROLE_BADGE[r.role] ?? "badge-draft"}`}>
                        {r.role}
                      </span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemove(r._id)}
                        disabled={removingId === r._id}
                        style={{ flexShrink: 0 }}
                      >
                        {removingId === r._id ? "…" : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add recipient form */}
            <div className="card" style={{ position: "sticky", top: "calc(var(--navbar-h) + var(--space-6))" }}>
              <h3 style={{ color: "var(--text-primary)", marginBottom: "var(--space-5)", fontSize: "0.95rem" }}>
                Add Recipient
              </h3>

              <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ cursor: "pointer" }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {addError && (
                  <div className="alert alert-error" style={{ padding: "var(--space-3)" }}>
                    {addError}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={adding || !name.trim() || !email.trim()}
                >
                  {adding ? "Adding…" : "+ Add Recipient"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
