const mongoose = require("mongoose");
  const shareLinkSchema = new mongoose.Schema({
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  }, { timestamps: true });
  module.exports = mongoose.model("ShareLink", shareLinkSchema);
  