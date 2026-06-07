import { useState } from "react";
  import { Link } from "react-router-dom";
  import Navbar from "../components/Navbar";

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [devUrl, setDevUrl] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault(); setError(""); setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Request failed");
        setSuccess(true);
        if (data.devResetUrl) setDevUrl(data.devResetUrl);
      } catch (err: unknown) {
        setError((err as Error).message ?? "Request failed");
      } finally { setLoading(false); }
    };

    return (
      <>
        <Navbar />
        <div style={{ minHeight: "calc(100vh - var(--navbar-h))", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg-primary)" }}>
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔑</div>
              <h1 style={{ color: "var(--text-primary)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 6px" }}>Reset Password</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>We'll send a reset link to your email</p>
            </div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px" }}>
              {success ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 16 }}>✉️</div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, margin: "0 0 8px" }}>Check your inbox</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 20 }}>If an account exists for <strong style={{ color: "var(--text-primary)" }}>{email}</strong>, a reset link has been sent.</p>
                  {devUrl && (
                    <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", margin: "0 0 6px", fontWeight: 700 }}>DEV MODE — Reset Link:</p>
                      <a href={devUrl} style={{ color: "var(--accent)", fontSize: "0.8rem", wordBreak: "break-all" }}>{devUrl}</a>
                    </div>
                  )}
                  <Link to="/login" style={{ display: "inline-block", padding: "10px 24px", borderRadius: 10, background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 700 }}>← Sign In</Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "var(--border-focus)")} onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                    />
                  </div>
                  {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 12px", color: "var(--danger)", fontSize: "0.82rem" }}>⚠ {error}</div>}
                  <button type="submit" disabled={loading}
                    style={{ padding: "12px", borderRadius: 10, background: "var(--accent)", border: "none", color: "white", fontWeight: 700, fontSize: "0.95rem", cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 0.15s" }}
                  >{loading ? "Sending…" : "Send Reset Link"}</button>
                </form>
              )}
            </div>
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 20 }}>
              Remember your password?{" "}
              <Link to="/login" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
            </p>
          </div>
        </div>
      </>
    );
  }
  