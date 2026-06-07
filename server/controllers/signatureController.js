const Signature = require("../models/Signature");
  const Document = require("../models/Document");
  const AuditLog = require("../models/AuditLog");

  exports.addSignature = async (req, res, next) => {
    try {
      const { documentId, x, y, page, type, data, signatureText, signatureStyle, signatureColor, signatureImage, stampImage, width, height } = req.body;
      if (!documentId) return res.status(400).json({ success: false, message: "documentId is required" });
      const doc = await Document.findById(documentId);
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      if (doc.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Access denied" });
      const signature = await Signature.create({
        documentId, userId: req.user.id, x, y, page: page || 1, type: type || "typed", data: data || "",
        signatureText, signatureStyle: signatureStyle || 1, signatureColor: signatureColor || "#1e3a8a",
        signatureImage: signatureImage || null, stampImage: stampImage || null,
        width: width || 180, height: height || 72,
      });
      await Document.findByIdAndUpdate(documentId, { status: "signed" });
      await AuditLog.create({ documentId, userId: req.user.id, action: "signature_placed", metadata: { type, page: page || 1 } });
      res.status(201).json({ success: true, signature });
    } catch (err) { next(err); }
  };

  exports.getSignatures = async (req, res, next) => {
    try {
      const signatures = await Signature.find({ documentId: req.params.docId });
      res.json({ success: true, count: signatures.length, signatures });
    } catch (err) { next(err); }
  };
  