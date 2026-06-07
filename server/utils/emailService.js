const nodemailer = require("nodemailer");

const getTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`[EMAIL MOCK] SMTP not configured. Email NOT sent.
To: ${to}
Subject: ${subject}
${text || "No text body"}`);
    return { success: false, mock: true };
  }

  try {
    await transporter.verify(); // test connection before sending
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"SignFlow" <noreply@signflow.app>',
      to,
      subject,
      html,
      text,
    });
    console.log(`[EMAIL] Sent to ${to} — subject: ${subject}`);
    return { success: true, mock: false };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

module.exports = { sendEmail };