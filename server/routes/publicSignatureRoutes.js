const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  generateLink,
  validateLink,
} = require("../controllers/publicSignatureController");

const router = express.Router();

router.post(
  "/:id",
  protect,
  generateLink
);

router.get(
  "/:token",
  validateLink
);

module.exports = router;