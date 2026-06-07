const mongoose = require("mongoose");
  const signatureSchema = new mongoose.Schema({
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    x: { type: Number, default: 0 }, y: { type: Number, default: 0 }, page: { type: Number, default: 1 },
    type: { type: String, enum: ["typed","drawn","initials","stamp"], default: "typed" },
    data: { type: String, default: "" },
    signatureText: { type: String, default: null }, signatureStyle: { type: Number, default: 1 },
    signatureColor: { type: String, default: "#1e3a8a" },
    signatureImage: { type: String, default: null }, stampImage: { type: String, default: null },
    width: { type: Number, default: 180 }, height: { type: Number, default: 72 },
  }, { timestamps: true });
  module.exports = mongoose.model("Signature", signatureSchema);
  