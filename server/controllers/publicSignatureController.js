const { v4: uuidv4 } = require("uuid");

const SignatureLink = require("../models/SignatureLink");
const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");
const Signature = require("../models/Signature");
const { sendEmail, signatureRequestEmail } = require("../utils/emailService");

// ─── Generate Public Link ────────────────────────────────────────────────────
// POST /api/public-sign/:id  (protected)
exports.generateLink = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const token = uuidv4();

    const link = await SignatureLink.create({
      documentId: document._id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Determine frontend base URL from env or request origin
    const frontendBase =
      process.env.FRONTEND_URL ||
      (req.headers.origin ? req.headers.origin : "http://localhost:5173");

    const publicUrl = `${frontendBase}/public-sign/${link.token}`;

    // ── Email ──
    const recipientEmail = req.body.recipientEmail || "signer@example.com";
    const recipientName = req.body.recipientName || "Signer";

    const { subject, html, text } = signatureRequestEmail({
      recipientName,
      documentName: document.originalName,
      signingUrl: publicUrl,
    });

    await sendEmail({ to: recipientEmail, subject, html, text });

    // ── Audit trail ──
    await AuditLog.create({
      documentId: document._id,
      userId: req.user.id,
      action: "link_generated",
      metadata: { token, recipientEmail, publicUrl },
    });

    res.status(201).json({
      success: true,
      token: link.token,
      publicUrl,
      emailMock: {
        to: recipientEmail,
        subject,
        link: publicUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Validate Public Link ────────────────────────────────────────────────────
// GET /api/public-sign/:token  (public)
exports.validateLink = async (req, res) => {
  try {
    const { token } = req.params;

    const link = await SignatureLink.findOne({ token });

    if (!link) {
      return res.status(404).json({ success: false, message: "Invalid link" });
    }

    if (new Date() > link.expiresAt) {
      return res.status(400).json({ success: false, message: "Link expired" });
    }

    const document = await Document.findById(link.documentId);

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Audit — fire-and-forget
    AuditLog.create({
      documentId: document._id,
      action: "link_viewed",
      metadata: { token },
    }).catch(() => {});

    res.status(200).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Public Sign Action ──────────────────────────────────────────────────────
// POST /api/public-sign/:token/sign  (public — token is the auth mechanism)
exports.signDocument = async (req, res) => {
  try {
    const { token } = req.params;
    const {
      x,
      y,
      page,
      type,
      data,
      signatureText,
      signatureStyle,
      signatureColor,
      signatureImage,
      stampImage,
      width,
      height,
    } = req.body;

    const link = await SignatureLink.findOne({ token });

    if (!link) {
      return res.status(404).json({ success: false, message: "Invalid link" });
    }

    if (new Date() > link.expiresAt) {
      return res.status(400).json({ success: false, message: "Link has expired" });
    }

    const document = await Document.findById(link.documentId);

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Create signature
    const signature = await Signature.create({
      documentId: document._id,
      userId: document.owner,
      x: x ?? 50,
      y: y ?? 50,
      page: page ?? 1,
      type: type || "signature",
      data: data || null,
      signatureText: signatureText || null,
      signatureStyle: signatureStyle || 1,
      signatureColor: signatureColor || "#1e3a8a",
      signatureImage: signatureImage || null,
      stampImage: stampImage || null,
      width: width || null,
      height: height || null,
    });

    // Update document status to "signed"
    await Document.findByIdAndUpdate(document._id, { status: "signed" });

    // Audit trail
    await AuditLog.create({
      documentId: document._id,
      action: "signature_placed",
      metadata: { token, type, page, x, y, signatureId: signature._id },
    });

    res.status(200).json({
      success: true,
      message: "Signature recorded successfully",
      signatureId: signature._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
