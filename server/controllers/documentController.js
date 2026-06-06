const Document = require("../models/Document");
const Signature = require("../models/Signature");
const AuditLog = require("../models/AuditLog");
const path = require("path");
const fs = require("fs");
const { generateSignedPdf } = require("../utils/pdfSigner");

// Upload Document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const document = await Document.create({
      owner: req.user.id,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
    });

    // Audit trail
    await AuditLog.create({
      documentId: document._id,
      userId: req.user.id,
      action: "document_uploaded",
      metadata: { fileName: req.file.filename, originalName: req.file.originalname },
    });

    res.status(201).json({
      success: true,
      document,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Documents of Logged-In User
exports.getUserDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      owner: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Document
exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

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

    res.status(200).json({
      success: true,
      document,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Finalize Document — generate signed PDF
exports.finalizeDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

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

    const signatures = await Signature.find({ documentId: document._id });

    if (signatures.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No signatures found. Please add a signature before finalizing.",
      });
    }

    const signedDir = path.join(__dirname, "../signed");
    if (!fs.existsSync(signedDir)) {
      fs.mkdirSync(signedDir, { recursive: true });
    }

    const outputFileName = `signed-${Date.now()}-${document.fileName}`;
    const outputPath = path.join(signedDir, outputFileName);

    await generateSignedPdf(document.filePath, outputPath, signatures);

    // Update document status to "signed"
    await Document.findByIdAndUpdate(document._id, { status: "signed" });

    // Audit trail
    await AuditLog.create({
      documentId: document._id,
      userId: req.user.id,
      action: "document_finalized",
      metadata: { outputFileName, signatureCount: signatures.length },
    });

    res.status(200).json({
      success: true,
      message: "Signed PDF generated successfully",
      downloadPath: `/signed/${outputFileName}`,
      fileName: outputFileName,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
