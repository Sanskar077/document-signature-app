import { useState, useRef, useEffect } from "react";
  import { Link, useNavigate } from "react-router-dom";
  import { useAuth } from "../context/AuthContext";
  import Navbar from "../components/Navbar";

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  type Step = "form" | "otp";

  export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();

    // Step 1 — registration form
    const [step, setStep] = useState<Step>("form");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Step 2 — OTP
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [verifying, setVerifying] = useState(false);
    const [otpError, setOtpError] = useState("");
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [devOtp, setDevOtp] = useState<string>("");
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
      if (resendCooldown <= 0) return;
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }, [resendCooldown]);

    // Auto-focus first OTP box when step changes
    useEffect(() => {
      if (step === "otp") {
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    }, [step]);

    // ── Step 1: Register ──
    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      if (password !== confirm) { setError("Passwords do not match"); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
      setLoading(true);
      try {
        // Register the account
        const regRes = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.message || "Registration failed");

        // Automatically send OTP
        const otpRes = await fetch(`${API_BASE}/api/auth/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        const otpData = await otpRes.json();
        if (otpData.devOtp) setDevOtp(otpData.devOtp);

        setResendCooldown(60);
        setStep("otp");
      } catch (err: unknown) {
        setError((err as Error).message ?? "Registration failed");
      } finally {
        setLoading(false);
      }
    };

    // ── OTP input handlers ──
    const handleOtpChange = (index: number, value: string) => {
      const cleaned = value.replace(/\D/g, "").slice(-1);
      const next = [...otp];
      next[index] = cleaned;
      setOtp(next);
      setOtpError("");

      // Auto-advance
      if (cleaned && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all 6 filled
      if (cleaned && index === 5) {
        const code = [...next.slice(0, 5), cleaned].join("");
        if (code.length === 6) verifyOtp(code);
      }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
      if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;
      const next = [...otp];
      pasted.split("").forEach((ch, i) => { if (i < 6) next[i] = ch; });
      setOtp(next);
      const filledTo = Math.min(pasted.length - 1, 5);
      otpRefs.current[filledTo]?.focus();
      if (pasted.length === 6) verifyOtp(pasted);
    };

    // ── Step 2: Verify OTP ──
    const verifyOtp = async (code?: string) => {
      const finalCode = code ?? otp.join("");
      if (finalCode.length < 6) { setOtpError("Please enter all 6 digits"); return; }
      setVerifying(true);
      setOtpError("");
      try {
        const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), otp: finalCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Invalid code");
        // Log in with the verified token
        login(data.token, data.user);
        navigate("/dashboard");
      } catch (err: unknown) {
        setOtpError((err as Error).message ?? "Verification failed");
        // Clear & refocus on error
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } finally {
        setVerifying(false);
      }
    };

    // Resend OTP
    const handleResend = async () => {
      if (resendCooldown > 0) return;
      setResendLoading(true);
      setOtpError("");
      try {
        const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to resend");
        if (data.devOtp) setDevOtp(data.devOtp);
        setOtp(["", "", "", "", "", ""]);
        setResendCooldown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } catch (err: unknown) {
        setOtpError((err as Error).message ?? "Failed to resend");
      } finally {
        setResendLoading(false);
      }
    };

    const otpFull = otp.join("").length === 6;

    const inputBase: React.CSSProperties = {
      width: "100%", padding: "12px 14px", borderRadius: 10,
      background: "var(--bg-input)", border: "1px solid var(--border)",
      color: "var(--text-primary)", fontSize: "0.875rem", outline: "none",
      boxSizing: "border-box" as const,
    };

    return (
      <>
        <Navbar />
        <div style={{
          minHeight: "calc(100vh - var(--navbar-h))",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, background: "var(--bg-primary)",
        }}>
          <div style={{ width: "100%", maxWidth: 440 }}>

            {/* ── Step indicator ── */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
              {(["form", "otp"] as Step[]).map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: step === s ? "var(--accent)" : i < (step === "otp" ? 1 : 0) ? "#10b981" : "var(--bg-card)",
                    border: `2px solid ${step === s ? "var(--accent)" : i < (step === "otp" ? 1 : 0) ? "#10b981" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 800,
                    color: step === s || i < (step === "otp" ? 1 : 0) ? "white" : "var(--text-muted)",
                    transition: "all 0.3s",
                  }}>
                    {i < (step === "otp" ? 1 : 0) ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: step === s ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {s === "form" ? "Account" : "Verify Email"}
                  </span>
                  {i < 1 && <div style={{ width: 32, height: 1, background: step === "otp" ? "#10b981" : "var(--border)", margin: "0 4px", transition: "background 0.3s" }} />}
                </div>
              ))}
            </div>

            {/* ─────────────────── STEP 1: Form ─────────────────── */}
            {step === "form" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✍️</div>
                  <h1 style={{ color: "var(--text-primary)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 6px" }}>
                    Create your account
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
                    Start signing documents for free
                  </p>
                </div>

                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px" }}>
                  <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      { label: "Full Name",        value: name,     setter: setName,     type: "text",     placeholder: "Jane Smith",           autoComplete: "name" },
                      { label: "Email Address",    value: email,    setter: setEmail,    type: "email",    placeholder: "you@example.com",      autoComplete: "email" },
                      { label: "Password",         value: password, setter: setPassword, type: "password", placeholder: "Min. 6 characters",    autoComplete: "new-password" },
                      { label: "Confirm Password", value: confirm,  setter: setConfirm,  type: "password", placeholder: "Repeat password",      autoComplete: "new-password" },
                    ].map(f => (
                      <div key={f.label}>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
                          {f.label}
                        </label>
                        <input
                          type={f.type}
                          value={f.value}
                          onChange={e => f.setter(e.target.value)}
                          placeholder={f.placeholder}
                          required
                          autoComplete={f.autoComplete}
                          style={inputBase}
                          onFocus={e => (e.currentTarget.style.borderColor = "var(--border-focus)")}
                          onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                        />
                      </div>
                    ))}

                    {error && (
                      <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 12px", color: "var(--danger)", fontSize: "0.82rem" }}>
                        ⚠ {error}
                      </div>
                    )}

                    <button type="submit" disabled={loading} style={{
                      padding: "12px", borderRadius: 10, background: "var(--accent)", border: "none",
                      color: "white", fontWeight: 700, fontSize: "0.95rem",
                      cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
                      marginTop: 4, transition: "opacity 0.15s",
                    }}>
                      {loading ? "Creating account…" : "Continue →"}
                    </button>
                  </form>
                </div>

                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 20 }}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
                </p>
              </>
            )}

            {/* ─────────────────── STEP 2: OTP ─────────────────── */}
            {step === "otp" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📬</div>
                  <h1 style={{ color: "var(--text-primary)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 6px" }}>
                    Check your email
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
                    We sent a 6-digit code to
                  </p>
                  <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.95rem", margin: "4px 0 0" }}>
                    {email}
                  </p>
                </div>

                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px" }}>

                  {/* Dev mode hint */}
                  {devOtp && (
                    <div style={{
                      background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)",
                      borderRadius: 10, padding: "10px 14px", marginBottom: 24,
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ fontSize: "1rem" }}>🛠</span>
                      <div>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Dev mode — your code</p>
                        <p style={{ color: "var(--accent)", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "0.2em", margin: 0 }}>{devOtp}</p>
                      </div>
                    </div>
                  )}

                  {/* 6-box OTP input */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24 }}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        disabled={verifying}
                        style={{
                          width: 48, height: 56, borderRadius: 12, textAlign: "center",
                          fontSize: "1.5rem", fontWeight: 800, outline: "none",
                          background: digit ? "var(--accent-light)" : "var(--bg-input)",
                          border: `2px solid ${digit ? "var(--accent)" : otpError ? "var(--danger)" : "var(--border)"}`,
                          color: digit ? "var(--accent)" : "var(--text-primary)",
                          transition: "all 0.15s", caretColor: "var(--accent)",
                        }}
                        onFocus={e => { if (!digit) e.currentTarget.style.borderColor = "var(--border-focus)"; }}
                        onBlur={e => { if (!digit && !otpError) e.currentTarget.style.borderColor = "var(--border)"; }}
                      />
                    ))}
                  </div>

                  {/* Error */}
                  {otpError && (
                    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 12px", color: "var(--danger)", fontSize: "0.82rem", marginBottom: 16, textAlign: "center" }}>
                      ⚠ {otpError}
                    </div>
                  )}

                  {/* Verify button */}
                  <button
                    onClick={() => verifyOtp()}
                    disabled={!otpFull || verifying}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 10, border: "none",
                      background: otpFull ? "var(--accent)" : "var(--bg-secondary)",
                      color: otpFull ? "white" : "var(--text-disabled)",
                      fontWeight: 700, fontSize: "0.95rem",
                      cursor: otpFull && !verifying ? "pointer" : "default",
                      transition: "all 0.2s", marginBottom: 16,
                    }}
                  >
                    {verifying ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                        Verifying…
                      </span>
                    ) : "Verify & Create Account ✓"}
                  </button>

                  {/* Resend */}
                  <div style={{ textAlign: "center" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "0 0 6px" }}>
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || resendLoading}
                      style={{
                        background: "none", border: "none", padding: 0,
                        color: resendCooldown > 0 ? "var(--text-disabled)" : "var(--accent)",
                        fontWeight: 700, fontSize: "0.875rem",
                        cursor: resendCooldown > 0 ? "default" : "pointer",
                      }}
                    >
                      {resendLoading ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </button>
                  </div>
                </div>

                {/* Back link */}
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 20 }}>
                  Wrong email?{" "}
                  <button
                    onClick={() => { setStep("form"); setOtp(["","","","","",""]); setOtpError(""); setDevOtp(""); }}
                    style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", padding: 0 }}
                  >
                    Go back
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </>
    );
  }
  