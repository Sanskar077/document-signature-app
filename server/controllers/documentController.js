const Document = require("../models/Document");
  const Signature = require("../models/Signature");
  const AuditLog = require("../models/AuditLog");
  const path = require("path");
  const fs = require("fs");
  const { generateSignedPdf } = require("../utils/pdfSigner");

  const UPLOADS_DIR = path.join(__dirname, "../uploads");
  const SIGNED_DIR = path.join(__dirname, "../signed");

  function resolveFilePath(storedPath) {
    return path.join(UPLOADS_DIR, path.basename(storedPath));
  }

  exports.uploadDocument = async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
      const document = await Document.create({
        owner: req.user.id,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.filename,
        fileSize: req.file.size,
      });
      await AuditLog.create({ documentId: document._id, userId: req.user.id, action: "document_uploaded", metadata: { fileName: req.file.filename, originalName: req.file.originalname } });
      res.status(201).json({ success: true, document });
    } catch (error) { next(error); }
  };

  exports.getDocumentFile = async (req, res, next) => {
    try {
      const document = await Document.findById(req.params.id);
      if (!document) return res.status(404).json({ success: false, message: "Document not found" });
      if (document.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Access denied" });
      const filePath = resolveFilePath(document.filePath);
      if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: "File not found on server. Please re-upload the document." });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(document.originalName)}"`);
      fs.createReadStream(filePath).pipe(res);
    } catch (error) { next(error); }
  };

  exports.getUserDocuments = async (req, res, next) => {
    try {
      const documents = await Document.find({ owner: req.user.id }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, count: documents.length, documents });
    } catch (error) { next(error); }
  };

  exports.getDocumentById = async (req, res, next) => {
    try {
      const document = await Document.findById(req.params.id);
      if (!document) return res.status(404).json({ success: false, message: "Document not found" });
      if (document.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Access denied" });
      const doc = document.toObject();
      doc.fileName = path.basename(document.filePath);
      res.status(200).json({ success: true, document: doc });
    } catch (error) { next(error); }
  };

  exports.finalizeDocument = async (req, res, next) => {
    try {
      const document = await Document.findById(req.params.id);
      if (!document) return res.status(404).json({ success: false, message: "Document not found" });
      if (document.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Access denied" });
      const signatures = await Signature.find({ documentId: document._id });
      if (signatures.length === 0) return res.status(400).json({ success: false, message: "No signatures found. Add a signature before finalizing." });
      const inputPath = resolveFilePath(document.filePath);
      if (!fs.existsSync(inputPath)) return res.status(404).json({ success: false, message: "Source PDF not found. Please re-upload the document." });
      if (!fs.existsSync(SIGNED_DIR)) fs.mkdirSync(SIGNED_DIR, { recursive: true });
      const outputFileName = `signed-${Date.now()}-${path.basename(document.filePath)}`;
      const outputPath = path.join(SIGNED_DIR, outputFileName);
      await generateSignedPdf(inputPath, outputPath, signatures);
      await Document.findByIdAndUpdate(document._id, { status: "signed" });
      await AuditLog.create({ documentId: document._id, userId: req.user.id, action: "document_finalized", metadata: { outputFileName, signatureCount: signatures.length } });
      res.status(200).json({ success: true, message: "Signed PDF generated", downloadPath: `/signed/${outputFileName}`, fileName: outputFileName });
    } catch (error) { next(error); }
  };
  