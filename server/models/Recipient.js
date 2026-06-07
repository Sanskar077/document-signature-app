const mongoose = require("mongoose");
  const recipientSchema = new mongoose.Schema({
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["signer","validator","witness"], default: "signer" },
    status: { type: String, enum: ["pending","signed","declined"], default: "pending" },
    signedAt: { type: Date, default: null },
  }, { timestamps: true });
  module.exports = mongoose.model("Recipient", recipientSchema);
  