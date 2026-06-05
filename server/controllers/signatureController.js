const Signature = require("../models/Signature");
const Document = require("../models/Document");
const mongoose = require("mongoose");
// Save Signature Coordinates
exports.createSignature = async (req, res) => {
  try {
    const { documentId, x, y, page } = req.body;

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

    const signature = await Signature.create({
      documentId,
      userId: req.user.id,
      x,
      y,
      page,
    });

    res.status(201).json({
      success: true,
      signature,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Signatures for Document

exports.getDocumentSignatures = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const signatures = await Signature.find({
      documentId: id,
    });

    res.status(200).json({
      success: true,
      count: signatures.length,
      signatures,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};