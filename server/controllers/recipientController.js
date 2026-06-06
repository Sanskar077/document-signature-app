const Recipient = require("../models/Recipient");
const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");

// GET /api/recipients/:documentId  — list all recipients for a document
exports.getRecipients = async (req, res) => {
  try {
    const { documentId } = req.params;

    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    if (doc.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Access denied" });

    const recipients = await Recipient.find({ documentId }).sort({ createdAt: 1 });
    res.json({ success: true, count: recipients.length, recipients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/recipients/:documentId  — add a recipient
exports.addRecipient = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { name, email, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    if (doc.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Access denied" });

    const recipient = await Recipient.create({ documentId, name, email, role });

    await AuditLog.create({
      documentId,
      userId: req.user.id,
      action: "recipient_added",
      metadata: { name, email, role },
    });

    res.status(201).json({ success: true, recipient });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/recipients/:documentId/:recipientId
exports.removeRecipient = async (req, res) => {
  try {
    const { documentId, recipientId } = req.params;

    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    if (doc.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Access denied" });

    await Recipient.findByIdAndDelete(recipientId);

    await AuditLog.create({
      documentId,
      userId: req.user.id,
      action: "recipient_removed",
      metadata: { recipientId },
    });

    res.json({ success: true, message: "Recipient removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
