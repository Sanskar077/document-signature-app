import { useState } from "react";
  import { Link, useNavigate, useParams } from "react-router-dom";
  import Navbar from "../components/Navbar";

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  export default function ResetPassword() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault(); setError("");
      if (password !== confirm) { setError("Passwords do not match"); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/reset-password/${token}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Reset failed");
        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
      } catch (err: unknown) {
        setError((err as Error).message ?? "Reset failed");
      } finally { setLoading(false); }
    };

    return (
      <>
        <Navbar />
        <div style={{ minHeight: "calc(100vh - var(--navbar-h))", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg-primary)" }}>
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔒</div>
              <h1 style={{ color: "var(--text-primary)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 6px" }}>New Password</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>Choose a strong password for your account</p>
            </div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px" }}>
              {success ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎉</div>
                  <h3 style={{ color: "#10b981", fontWeight: 700, margin: "0 0 8px" }}>Password reset!</h3>
                  <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Redirecting you to sign in…</p>
                  <Link to="/login" style={{ padding: "10px 24px", borderRadius: 10, background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 700 }}>Sign In Now</Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { label: "New Password", value: password, setter: setPassword, placeholder: "Min. 6 characters" },
                    { label: "Confirm Password", value: confirm, setter: setConfirm, placeholder: "Repeat new password" },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input type="password" value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} required
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                        onFocus={e => (e.currentTarget.style.borderColor = "var(--border-focus)")} onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                      />
                    </div>
                  ))}
                  {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 12px", color: "var(--danger)", fontSize: "0.82rem" }}>⚠ {error}</div>}
                  <button type="submit" disabled={loading}
                    style={{ padding: "12px", borderRadius: 10, background: "var(--accent)", border: "none", color: "white", fontWeight: 700, fontSize: "0.95rem", cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 0.15s" }}
                  >{loading ? "Resetting…" : "Reset Password"}</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
  