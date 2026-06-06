const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  generateLink,
  validateLink,
  savePublicSignature,
} = require("../controllers/publicSignatureController");

const router = express.Router();

// Generate Public Link
router.post(
  "/:id",
  protect,
  generateLink
);

// Validate Public Link
router.get(
  "/:token",
  validateLink
);

// Save Public Signature
router.post(
  "/:token/sign",
  savePublicSignature
);

module.exports = router;