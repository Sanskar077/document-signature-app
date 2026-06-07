const Recipient = require("../models/Recipient");
  const Document = require("../models/Document");
  const AuditLog = require("../models/AuditLog");
  exports.getRecipients = async (req, res, next) => {
    try {
      const { documentId } = req.params;
      const doc = await Document.findById(documentId);
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      if (doc.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Access denied" });
      const recipients = await Recipient.find({ documentId }).sort({ createdAt: 1 });
      res.json({ success: true, count: recipients.length, recipients });
    } catch (err) { next(err); }
  };
  exports.addRecipient = async (req, res, next) => {
    try {
      const { documentId } = req.params;
      const { name, email, role } = req.body;
      if (!name || !email) return res.status(400).json({ success: false, message: "Name and email are required" });
      const normalizedRole = (role || "signer").toString().toLowerCase();
      const allowedRoles = ["signer", "validator", "witness"];
      if (!allowedRoles.includes(normalizedRole)) return res.status(400).json({ success: false, message: `Invalid role. Must be: ${allowedRoles.join(", ")}` });
      const doc = await Document.findById(documentId);
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      if (doc.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Access denied" });
      const existing = await Recipient.findOne({ documentId, email: email.toLowerCase().trim() });
      if (existing) return res.status(409).json({ success: false, message: "Recipient with this email already exists" });
      const recipient = await Recipient.create({ documentId, name: name.trim(), email: email.toLowerCase().trim(), role: normalizedRole });
      await AuditLog.create({ documentId, userId: req.user.id, action: "recipient_added", metadata: { name: name.trim(), email: email.toLowerCase().trim(), role: normalizedRole } });
      res.status(201).json({ success: true, recipient });
    } catch (err) { next(err); }
  };
  exports.removeRecipient = async (req, res, next) => {
    try {
      const { documentId, recipientId } = req.params;
      const doc = await Document.findById(documentId);
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      if (doc.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Access denied" });
      const recipient = await Recipient.findById(recipientId);
      if (!recipient) return res.status(404).json({ success: false, message: "Recipient not found" });
      await Recipient.findByIdAndDelete(recipientId);
      await AuditLog.create({ documentId, userId: req.user.id, action: "recipient_removed", metadata: { recipientId, name: recipient.name, email: recipient.email } });
      res.json({ success: true, message: "Recipient removed" });
    } catch (err) { next(err); }
  };
  