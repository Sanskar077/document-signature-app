const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorEmail: {
      type: String,
      default: null,
    },
    action: {
      type: String,
      enum: [
        "document_uploaded",
        "link_generated",
        "link_viewed",
        "signature_placed",
        "document_finalized",
        "recipient_added",
        "recipient_removed",
      ],
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
