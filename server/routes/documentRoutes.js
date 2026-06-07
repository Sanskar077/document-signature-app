const express = require("express");
  const protect = require("../middleware/authMiddleware");
  const upload = require("../middleware/uploadMiddleware");
  const { uploadDocument, getUserDocuments, getDocumentById, getDocumentFile, finalizeDocument } = require("../controllers/documentController");
  const router = express.Router();
  router.post("/upload", protect, upload.single("document"), uploadDocument);
  router.get("/", protect, getUserDocuments);
  router.post("/:id/finalize", protect, finalizeDocument);
  router.get("/:id/file", protect, getDocumentFile);
  router.get("/:id", protect, getDocumentById);
  module.exports = router;
  