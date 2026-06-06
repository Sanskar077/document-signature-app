const mongoose = require("mongoose");

const recipientSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["signer", "validator", "witness"],
      default: "signer",
    },
    status: {
      type: String,
      enum: ["pending", "viewed", "signed", "rejected"],
      default: "pending",
    },
    signatureLinkToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipient", recipientSchema);
