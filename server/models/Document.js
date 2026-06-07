const mongoose = require("mongoose");
  const documentSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    status: { type: String, enum: ["pending","in_progress","partially_signed","signed","rejected","expired","completed"], default: "pending" },
    recipientCount: { type: Number, default: 0 },
    signingOrderEnabled: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
  }, { timestamps: true });
  module.exports = mongoose.model("Document", documentSchema);
  