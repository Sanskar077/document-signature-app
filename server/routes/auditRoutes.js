const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getAuditLog } = require("../controllers/auditController");

const router = express.Router();

router.get("/:documentId", protect, getAuditLog);

module.exports = router;
