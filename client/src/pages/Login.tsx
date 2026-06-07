import { useState } from "react";
  import { Link, useNavigate } from "react-router-dom";
  import { useAuth } from "../context/AuthContext";
  import Navbar from "../components/Navbar";

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(""); setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");
        login(data.token, data.user);
        navigate("/dashboard");
      } catch (err: unknown) {
        setError((err as Error).message ?? "Login failed");
      } finally { setLoading(false); }
    };

    return (
      <>
        <Navbar />
        <div style={{ minHeight: "calc(100vh - var(--navbar-h))", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg-primary)" }}>
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✍️</div>
              <h1 style={{ color: "var(--text-primary)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 6px" }}>Welcome back</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>Sign in to your SignFlow account</p>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px" }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--border-focus)")} onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600 }}>Password</label>
                    <Link to="/forgot-password" style={{ color: "var(--accent)", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none" }}>Forgot password?</Link>
                  </div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password"
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--border-focus)")} onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
                {error && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 12px", color: "var(--danger)", fontSize: "0.82rem" }}>
                    ⚠ {error}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  style={{ padding: "12px", borderRadius: 10, background: "var(--accent)", border: "none", color: "white", fontWeight: 700, fontSize: "0.95rem", cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4, transition: "opacity 0.15s" }}
                >{loading ? "Signing in…" : "Sign In"}</button>
              </form>
            </div>

            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 20 }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>Create one free</Link>
            </p>
          </div>
        </div>
      </>
    );
  }
  