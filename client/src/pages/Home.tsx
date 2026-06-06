import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const FEATURES = [
  {
    icon: "✍️",
    title: "Multiple Signature Styles",
    desc: "Type, draw, or upload your signature with professional style options.",
  },
  {
    icon: "📄",
    title: "PDF Upload & Preview",
    desc: "Upload any PDF document and preview it page-by-page in the browser.",
  },
  {
    icon: "🔗",
    title: "Shareable Signing Links",
    desc: "Generate secure, time-limited public links for external signers.",
  },
  {
    icon: "👥",
    title: "Multi-Signer Workflow",
    desc: "Assign multiple recipients with different roles: signer, validator, witness.",
  },
  {
    icon: "🔒",
    title: "JWT-Secured",
    desc: "Every request is protected with industry-standard JSON Web Tokens.",
  },
  {
    icon: "📊",
    title: "Audit Trail",
    desc: "Complete activity timeline for every document action and signing event.",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>

        <div className="hero-content animate-slide-up">
          <div className="hero-badge">
            ⚡ Secure · Fast · Professional
          </div>

          <h1 className="hero-title">
            Sign Documents with<br />
            <span>Confidence & Clarity</span>
          </h1>

          <p className="hero-desc">
            SignFlow is the modern document signing platform built for teams. Upload
            PDFs, place signatures, share secure links, and track every action in
            real time.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg" id="hero-cta-register">
              Start Signing Free →
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg" id="hero-cta-login">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: "var(--space-12)" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "var(--space-3)",
              }}
            >
              Everything you need to go paperless
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
              A full-featured signing suite, purpose-built for modern workflows.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section
        style={{
          padding: "var(--space-16) var(--space-6)",
          background: "var(--bg-primary)",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "var(--space-4)",
          }}
        >
          Ready to get started?
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-6)" }}>
          Create your free account and sign your first document in minutes.
        </p>
        <Link to="/register" className="btn btn-primary btn-lg" id="footer-cta">
          Create Free Account
        </Link>
      </section>
    </>
  );
}
