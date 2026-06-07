const crypto = require("crypto");
  const Document = require("../models/Document");
  const Signature = require("../models/Signature");
  const AuditLog = require("../models/AuditLog");
  const ShareLink = require("../models/ShareLink");
  const { generateSignedPdf } = require("../utils/pdfSigner");
  const path = require("path");
  const fs = require("fs");

  const UPLOADS_DIR = path.join(__dirname, "../uploads");
  const SIGNED_DIR  = path.join(__dirname, "../signed");
  function resolveFilePath(fp) { return path.join(UPLOADS_DIR, path.basename(fp)); }

  exports.generatePublicLink = async (req, res, next) => {
    try {
      const { id: documentId } = req.params;
      const doc = await Document.findById(documentId);
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      if (doc.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Access denied" });
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await ShareLink.findOneAndDelete({ documentId });
      await ShareLink.create({ documentId, token, expiresAt, createdBy: req.user.id });
      await Document.findByIdAndUpdate(documentId, { status: "in_progress" });
      await AuditLog.create({ documentId, userId: req.user.id, action: "link_generated", metadata: { expiresAt } });
      const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
      const publicUrl = `${frontendBase}/public/sign/${token}`;
      res.json({ success: true, token, publicUrl, expiresAt });
    } catch (err) { next(err); }
  };

  exports.getPublicDocument = async (req, res, next) => {
    try {
      const { token } = req.params;
      const link = await ShareLink.findOne({ token, expiresAt: { $gt: new Date() } });
      if (!link) return res.status(404).json({ success: false, message: "Signing link not found or has expired" });
      const doc = await Document.findById(link.documentId);
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      await AuditLog.create({ documentId: doc._id, actorEmail: null, action: "link_viewed", metadata: { token } });
      res.json({ success: true, document: { _id: doc._id, originalName: doc.originalName, fileName: path.basename(doc.filePath), status: doc.status }, token });
    } catch (err) { next(err); }
  };

  exports.getPublicFile = async (req, res, next) => {
    try {
      const { token } = req.params;
      const link = await ShareLink.findOne({ token, expiresAt: { $gt: new Date() } });
      if (!link) return res.status(404).json({ success: false, message: "Link expired" });
      const doc = await Document.findById(link.documentId);
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      const filePath = resolveFilePath(doc.filePath);
      if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: "File not found" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(doc.originalName)}"`);
      fs.createReadStream(filePath).pipe(res);
    } catch (err) { next(err); }
  };

  exports.publicAddSignature = async (req, res, next) => {
    try {
      const { token } = req.params;
      const link = await ShareLink.findOne({ token, expiresAt: { $gt: new Date() } });
      if (!link) return res.status(404).json({ success: false, message: "Signing link not found or has expired" });
      const { x, y, page, type, data, signatureText, signatureStyle, signatureColor, signatureImage, stampImage, width, height, signerName, signerEmail } = req.body;
      const doc = await Document.findById(link.documentId);
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      const signature = await Signature.create({
        documentId: link.documentId, x, y, page: page || 1, type: type || "typed", data: data || "",
        signatureText, signatureStyle: signatureStyle || 1, signatureColor: signatureColor || "#1e3a8a",
        signatureImage: signatureImage || null, stampImage: stampImage || null, width: width || 180, height: height || 72,
      });
      await Document.findByIdAndUpdate(link.documentId, { status: "signed" });
      await AuditLog.create({ documentId: link.documentId, actorEmail: signerEmail || "external@signer", action: "signature_placed", metadata: { type, signerName, signerEmail, page: page || 1 } });
      res.status(201).json({ success: true, signature });
    } catch (err) { next(err); }
  };

  exports.publicFinalizeDocument = async (req, res, next) => {
    try {
      const { token } = req.params;
      const link = await ShareLink.findOne({ token, expiresAt: { $gt: new Date() } });
      if (!link) return res.status(404).json({ success: false, message: "Link expired" });
      const doc = await Document.findById(link.documentId);
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      const signatures = await Signature.find({ documentId: doc._id });
      if (signatures.length === 0) return res.status(400).json({ success: false, message: "No signatures found" });
      const inputPath = resolveFilePath(doc.filePath);
      if (!fs.existsSync(inputPath)) return res.status(404).json({ success: false, message: "Source PDF not found" });
      if (!fs.existsSync(SIGNED_DIR)) fs.mkdirSync(SIGNED_DIR, { recursive: true });
      const outputFileName = `signed-${Date.now()}-${path.basename(doc.filePath)}`;
      const outputPath = path.join(SIGNED_DIR, outputFileName);
      await generateSignedPdf(inputPath, outputPath, signatures);
      await Document.findByIdAndUpdate(doc._id, { status: "completed" });
      res.json({ success: true, downloadPath: `/signed/${outputFileName}`, fileName: outputFileName });
    } catch (err) { next(err); }
  };
  