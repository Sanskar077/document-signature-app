const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  generateLink,
  validateLink,
  signDocument,
} = require("../controllers/publicSignatureController");

const router = express.Router();

// Protected — owner generates a link for a document
router.post("/:id", protect, generateLink);

// Public — validate token (existing endpoint, behaviour unchanged)
router.get("/:token", validateLink);

// Public — submit signature via token (NEW endpoint)
router.post("/:token/sign", signDocument);

module.exports = router;