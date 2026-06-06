const AuditLog = require("../models/AuditLog");
const Document = require("../models/Document");

// GET /api/audit/:documentId
exports.getAuditLog = async (req, res) => {
  try {
    const { documentId } = req.params;

    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    if (doc.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Access denied" });

    const logs = await AuditLog.find({ documentId })
      .sort({ createdAt: 1 })
      .populate("userId", "name email");

    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
