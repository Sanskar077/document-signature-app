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

    x: {
      type: Number,
      required: true,
    },

    y: {
      type: Number,
      required: true,
    },

    page: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "signed"],
      default: "signed",
    },

    // ── Extended fields (Day 12+) ──
    type: {
      type: String,
      enum: ["signature", "typed", "drawn", "initials", "stamp", "date", "text"],
      default: "signature",
    },

    data: {
      type: String,   // text|styleId for typed/initials, or data URL for drawn/stamp
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Signature", signatureSchema);