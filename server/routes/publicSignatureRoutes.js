const express = require("express");
  const protect = require("../middleware/authMiddleware");
  const { generatePublicLink, getPublicDocument, getPublicFile, publicAddSignature, publicFinalizeDocument } = require("../controllers/publicSignatureController");
  const router = express.Router();
  router.post("/:id", protect, generatePublicLink);
  router.get("/view/:token", getPublicDocument);
  router.get("/file/:token", getPublicFile);
  router.post("/sign/:token", publicAddSignature);
  router.post("/finalize/:token", publicFinalizeDocument);
  module.exports = router;
  