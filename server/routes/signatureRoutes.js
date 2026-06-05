const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createSignature,
  getDocumentSignatures,
} = require("../controllers/signatureController");

const router = express.Router();

router.post("/", protect, createSignature);

router.get("/:id", protect, getDocumentSignatures);

module.exports = router;