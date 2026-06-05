const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  generateLink,
} = require(
  "../controllers/publicSignatureController"
);

const router = express.Router();

router.post(
  "/:id",
  protect,
  generateLink
);

module.exports = router;