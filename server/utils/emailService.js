const nodemailer = require("nodemailer");
  const MOCK = process.env.NODE_ENV !== "production" || !process.env.SMTP_HOST;

  const getTransporter = () => {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    }
    return null;
  };

  const sendEmail = async ({ to, subject, html, text }) => {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[EMAIL MOCK] To: ${to}
Subject: ${subject}
${text || "No text body"}`);
      return { success: true, mock: true };
    }
    await transporter.sendMail({ from: process.env.SMTP_FROM || '"SignFlow" <noreply@signflow.app>', to, subject, html, text });
    return { success: true, mock: false };
  };

  module.exports = { sendEmail };
  