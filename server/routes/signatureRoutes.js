const express = require("express");
  const protect = require("../middleware/authMiddleware");
  const { addSignature, getSignatures } = require("../controllers/signatureController");
  const router = express.Router();
  router.post("/", protect, addSignature);
  router.get("/:docId", protect, getSignatures);
  module.exports = router;
  