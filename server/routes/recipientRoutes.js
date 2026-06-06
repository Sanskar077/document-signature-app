const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getRecipients,
  addRecipient,
  removeRecipient,
} = require("../controllers/recipientController");

const router = express.Router();

router.get("/:documentId", protect, getRecipients);
router.post("/:documentId", protect, addRecipient);
router.delete("/:documentId/:recipientId", protect, removeRecipient);

module.exports = router;
