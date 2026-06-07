import { Link } from "react-router-dom";
  import Navbar from "../components/Navbar";

  const STEPS = [
    { n: "01", icon: "📤", title: "Upload PDF", desc: "Drag & drop or browse any PDF document. We support files up to 20 MB." },
    { n: "02", icon: "✍️", title: "Add Signature", desc: "Type, draw, or upload your signature. Choose style, color, and placement." },
    { n: "03", icon: "👥", title: "Invite Signers", desc: "Add recipients with roles — Signer, Witness, or Validator." },
    { n: "04", icon: "📥", title: "Download", desc: "Generate the signed PDF with all signatures embedded and download instantly." },
  ];

  const FEATURES = [
    { icon: "🎨", title: "3 Signature Styles", desc: "Type in your favorite cursive font, draw freehand, or upload a company stamp." },
    { icon: "🎯", title: "WYSIWYG Precision", desc: "Drag signatures to exact positions. What you see in the editor matches the final PDF." },
    { icon: "🔗", title: "Shareable Links", desc: "Generate secure, time-limited signing links for external signers — no account required." },
    { icon: "👥", title: "Multi-Signer", desc: "Sequential signing workflows with roles: Signer, Validator, Witness." },
    { icon: "📊", title: "Audit Trail", desc: "Every action is logged with timestamps — uploads, views, signatures, downloads." },
    { icon: "🔒", title: "JWT Secured", desc: "Industry-standard authentication. Documents are private to your account." },
  ];

  export default function Home() {
    return (
      <>
        <Navbar />

        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-bg">
            <div className="hero-orb hero-orb-1" />
            <div className="hero-orb hero-orb-2" />
            <div className="hero-orb hero-orb-3" />
          </div>
          <div className="hero-content animate-slide-up">
            <div className="hero-badge">✨ Professional E-Signature Platform</div>
            <h1 className="hero-title">
              Sign Documents<br />
              <span className="hero-title-gradient">Professionally.</span>
            </h1>
            <p className="hero-subtitle">
              Upload PDFs, add signatures with pixel-perfect placement, invite recipients,
              and download signed documents — all in one workflow.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg" id="hero-cta">
                Start Signing Free →
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </div>

            {/* Social proof strip */}
            <div style={{ display: "flex", gap: 24, marginTop: 48, flexWrap: "wrap", justifyContent: "center" }}>
              {["✍️ Draw / Type / Upload", "📄 Multi-page PDFs", "👥 Multi-signer", "🔒 Secure Links"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", padding: "6px 14px", borderRadius: 20 }}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ padding: "80px 24px", background: "var(--bg-secondary)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ display: "inline-block", background: "var(--accent-light)", border: "1px solid rgba(99,102,241,0.3)", color: "var(--accent)", padding: "4px 14px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600, marginBottom: 16 }}>
                How it works
              </div>
              <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>
                Four simple steps
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 24 }}>
              {STEPS.map((step, i) => (
                <div key={step.n} style={{ position: "relative" }}>
                  {i < STEPS.length - 1 && (
                    <div style={{ position: "absolute", top: 28, left: "calc(100% + 4px)", width: "calc(100% - 8px)", height: 1, background: "linear-gradient(90deg, var(--border), transparent)", display: "none" }} className="step-connector" />
                  )}
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, height: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: "1.5rem" }}>{step.icon}</span>
                      <span style={{ color: "var(--accent)", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em" }}>{step.n}</span>
                    </div>
                    <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1rem", margin: "0 0 8px" }}>{step.title}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ padding: "80px 24px", background: "var(--bg-primary)" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                Everything you need
              </h2>
              <p style={{ color: "var(--text-muted)", marginTop: 12, fontSize: "1rem" }}>Professional signing tools — no subscription required to get started.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 24px",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hover)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: 14 }}>{f.icon}</div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1rem", margin: "0 0 8px" }}>{f.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding: "80px 24px", background: "var(--bg-secondary)" }}>
          <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 20 }}>✍️</div>
            <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 16px" }}>
              Ready to sign your first document?
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", margin: "0 0 32px" }}>
              Create a free account and upload your first PDF in seconds.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Free Account →
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          borderTop: "1px solid var(--border)", padding: "24px", textAlign: "center",
          color: "var(--text-muted)", fontSize: "0.82rem", background: "var(--bg-primary)",
        }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: "1.1rem" }}>✍️</span>
            <span style={{ fontWeight: 700, color: "var(--text-secondary)" }}>SignFlow</span>
          </div>
          © {new Date().getFullYear()} SignFlow — Secure document signing, anywhere.
        </footer>
      </>
    );
  }
  