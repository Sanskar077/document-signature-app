const express = require("express");
  const protect = require("../middleware/authMiddleware");
  const AuditLog = require("../models/AuditLog");
  const Document = require("../models/Document");
  const router = express.Router();
  router.get("/:docId", protect, async (req, res, next) => {
    try {
      const doc = await Document.findById(req.params.docId);
      if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
      if (doc.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Access denied" });
      const logs = await AuditLog.find({ documentId: req.params.docId }).sort({ createdAt: 1 }).populate("userId", "name email");
      res.json({ success: true, count: logs.length, logs });
    } catch (err) { next(err); }
  });
  module.exports = router;
  