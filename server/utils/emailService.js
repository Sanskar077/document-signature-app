/**
 * emailService.js — Provider-agnostic email abstraction layer.
 *
 * Current provider: MOCK (logs to console)
 *
 * To switch providers set EMAIL_PROVIDER env var:
 *   EMAIL_PROVIDER=nodemailer  → uses Nodemailer + SMTP
 *   EMAIL_PROVIDER=resend      → uses Resend API
 *   EMAIL_PROVIDER=sendgrid    → uses SendGrid API
 *   (default)                  → MockProvider (console log)
 *
 * Interface for all providers:
 *   sendEmail({ to, subject, html, text? }) → Promise<void>
 */

/* ─── Mock Provider ─── */
const MockProvider = {
  async sendEmail({ to, subject, html }) {
    console.log("\n========== EMAIL (MOCK) ==========");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${html.replace(/<[^>]+>/g, "").slice(0, 200)}`);
    console.log("==================================\n");
  },
};

/* ─── Nodemailer Provider (future) ─── */
const NodemailerProvider = {
  async sendEmail({ to, subject, html, text }) {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@signflow.app",
      to,
      subject,
      html,
      text,
    });
  },
};

/* ─── Resend Provider (future) ─── */
const ResendProvider = {
  async sendEmail({ to, subject, html }) {
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@signflow.app",
      to,
      subject,
      html,
    });
  },
};

/* ─── Provider selection ─── */
function getProvider() {
  switch ((process.env.EMAIL_PROVIDER || "mock").toLowerCase()) {
    case "nodemailer": return NodemailerProvider;
    case "resend":     return ResendProvider;
    default:           return MockProvider;
  }
}

/**
 * Send an email.
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.text]
 */
async function sendEmail({ to, subject, html, text }) {
  const provider = getProvider();
  await provider.sendEmail({ to, subject, html, text });
}

/* ─── Templates ─── */
function signatureRequestEmail({ recipientName, documentName, signingUrl, expiresIn = "7 days" }) {
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Inter,sans-serif;background:#0d0e12;color:#f1f2f6;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#1a1b23;border:1px solid #2a2b35;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
      <h1 style="margin:0;font-size:24px;color:#fff;">✍️ SignFlow</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);">Document Signature Request</p>
    </div>
    <div style="padding:40px;">
      <p style="font-size:16px;line-height:1.6;">Hello <strong>${recipientName}</strong>,</p>
      <p style="color:#9ca3af;line-height:1.7;">
        You have been invited to sign the document 
        <strong style="color:#f1f2f6;">"${documentName}"</strong>.
      </p>
      <div style="margin:32px 0;text-align:center;">
        <a href="${signingUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;">
          Sign Document →
        </a>
      </div>
      <p style="font-size:13px;color:#6b7280;">
        This link expires in <strong>${expiresIn}</strong>. If you did not expect this email, you can safely ignore it.
      </p>
    </div>
    <div style="padding:20px 40px;border-top:1px solid #2a2b35;font-size:12px;color:#6b7280;">
      Powered by SignFlow
    </div>
  </div>
</body>
</html>`;

  return {
    subject: `Action Required: Sign "${documentName}"`,
    html,
    text: `You have been invited to sign "${documentName}". Visit: ${signingUrl}`,
  };
}

module.exports = { sendEmail, signatureRequestEmail };
