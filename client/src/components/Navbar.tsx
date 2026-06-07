import { Link, useLocation, useNavigate } from "react-router-dom";
  import { useAuth } from "../context/AuthContext";
  import { useState } from "react";

  export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
      logout();
      navigate("/login");
      setMenuOpen(false);
    };

    const initials = user?.name
      ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
      : "U";

    return (
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="navbar-logo">
            <div className="navbar-logo-icon">✍️</div>
            <span className="navbar-logo-text">SignFlow</span>
          </Link>

          {/* Nav Links */}
          {user && (
            <ul className="navbar-links">
              <li>
                <Link
                  to="/dashboard"
                  style={{ color: isActive("/dashboard") ? "var(--text-primary)" : "var(--text-muted)", fontWeight: isActive("/dashboard") ? 700 : 500 }}
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          )}

          {/* Right Actions */}
          <div className="navbar-actions">
            {user ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: 24, padding: "6px 14px 6px 8px",
                    cursor: "pointer", transition: "border-color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "var(--accent)", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.02em",
                  }}>{initials}</div>
                  <span style={{ color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600 }}>
                    {user.name?.split(" ")[0]}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{menuOpen ? "▲" : "▼"}</span>
                </button>

                {menuOpen && (
                  <div
                    style={{
                      position: "absolute", right: 0, top: "calc(100% + 8px)",
                      background: "var(--bg-card)", border: "1px solid var(--border)",
                      borderRadius: 12, minWidth: 220, boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                      zIndex: 200, overflow: "hidden",
                    }}
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                      <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>{user.name}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                    </div>
                    <div style={{ padding: "8px" }}>
                      <Link
                        to="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, textDecoration: "none", color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500, transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-secondary)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span>📄</span> Dashboard
                      </Link>
                    </div>
                    <div style={{ padding: "8px", borderTop: "1px solid var(--border)" }}>
                      <button
                        onClick={handleLogout}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "transparent", border: "none", color: "var(--danger)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", width: "100%", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--danger-light)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span>🚪</span> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  }
  