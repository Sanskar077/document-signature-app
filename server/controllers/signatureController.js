const Signature = require("../models/Signature");
const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");
const mongoose = require("mongoose");

// Create Signature
exports.createSignature = async (req, res) => {
  try {
    const {
      documentId,
      x,
      y,
      page,
      type,
      data,
      signatureText,
      signatureStyle,
      signatureColor,
      signatureImage,
      stampImage,
      width,
      height,
    } = req.body;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check for existing signature (allow update)
    const existingSignature = await Signature.findOne({
      documentId,
      userId: req.user.id,
    });

    let signature;
    const sigData = {
      documentId,
      userId: req.user.id,
      x,
      y,
      page: page || 1,
      type: type || "signature",
      data: data || null,
      signatureText: signatureText || null,
      signatureStyle: signatureStyle || 1,
      signatureColor: signatureColor || "#1e3a8a",
      signatureImage: signatureImage || null,
      stampImage: stampImage || null,
      width: width || null,
      height: height || null,
    };

    if (existingSignature) {
      // Update the existing signature instead of blocking
      signature = await Signature.findByIdAndUpdate(
        existingSignature._id,
        sigData,
        { new: true }
      );
    } else {
      signature = await Signature.create(sigData);
    }

    // ── Update document status to "signed" ──
    await Document.findByIdAndUpdate(documentId, { status: "signed" });

    // ── Audit trail ──
    await AuditLog.create({
      documentId,
      userId: req.user.id,
      action: "signature_placed",
      metadata: { type, page, x, y, signatureId: signature._id },
    });

    res.status(201).json({
      success: true,
      signature,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Signatures By Document
exports.getDocumentSignatures = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const signatures = await Signature.find({ documentId: id });

    res.status(200).json({
      success: true,
      count: signatures.length,
      signatures,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
