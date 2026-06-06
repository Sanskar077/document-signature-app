const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "signed", "rejected"],
      default: "pending",
    },

    // ── Extended fields ──
    recipientCount: { type: Number, default: 0 },
    signingOrderEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
