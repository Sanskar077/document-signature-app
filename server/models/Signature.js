const mongoose = require("mongoose");

const signatureSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    x: { type: Number, required: true },
    y: { type: Number, required: true },
    page: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "signed"],
      default: "signed",
    },

    // ── Signature type ──
    type: {
      type: String,
      enum: ["signature", "typed", "drawn", "initials", "stamp", "date", "text"],
      default: "signature",
    },

    // ── Raw data field (backward compatible) ──
    // For typed/initials: "text|styleId"
    // For drawn/stamp: data URL string
    data: {
      type: String,
      default: null,
    },

    // ── Extended fields ──
    signatureText: { type: String, default: null },
    signatureStyle: { type: Number, default: 1 },
    signatureColor: { type: String, default: "#1e3a8a" },
    signatureImage: { type: String, default: null },  // data URL for drawn
    stampImage: { type: String, default: null },       // data URL for stamp

    // ── Size fields ──
    width: { type: Number, default: null },
    height: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Signature", signatureSchema);
