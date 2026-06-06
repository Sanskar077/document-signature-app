import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path ? "active" : "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
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
              <Link to="/dashboard" className={isActive("/dashboard")}>
                Dashboard
              </Link>
            </li>
          </ul>
        )}

        {/* Right Actions */}
        <div className="navbar-actions">
          {user ? (
            <div style={{ position: "relative" }}>
              <div
                className="user-chip"
                onClick={() => setMenuOpen((v) => !v)}
                id="user-menu-trigger"
              >
                <div className="user-avatar">{initials}</div>
                <span className="user-name">{user.name}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {menuOpen && (
                <>
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 50,
                    }}
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 8px)",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      boxShadow: "var(--shadow-lg)",
                      minWidth: "180px",
                      zIndex: 100,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {user.name}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 16px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--danger)",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        transition: "background var(--transition)",
                      }}
                      onMouseOver={(e) =>
                        ((e.target as HTMLElement).style.background =
                          "var(--danger-light)")
                      }
                      onMouseOut={(e) =>
                        ((e.target as HTMLElement).style.background = "none")
                      }
                      id="logout-btn"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
