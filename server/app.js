const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const signatureRoutes = require("./routes/signatureRoutes");
const publicSignatureRoutes = require("./routes/publicSignatureRoutes");
const recipientRoutes = require("./routes/recipientRoutes");
const auditRoutes = require("./routes/auditRoutes");

const app = express();

// CORS — strips trailing slash before comparing so both
// "https://example.com" and "https://example.com/" match
const allowedOrigin = (process.env.CLIENT_URL || "").replace(/\/$/, "");

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin) or if no CLIENT_URL set
      if (!allowedOrigin || !origin) return callback(null, true);
      if (origin.replace(/\/$/, "") === allowedOrigin) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static — absolute paths
const UPLOADS_DIR = path.join(__dirname, "uploads");
const SIGNED_DIR = path.join(__dirname, "signed");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(SIGNED_DIR)) fs.mkdirSync(SIGNED_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/signed", express.static(SIGNED_DIR));

// Health check
app.get("/", (req, res) => res.json({ success: true, message: "SignFlow API v2", version: "2.0.0" }));

// API routes — specific public-sign sub-routes registered BEFORE the wildcard /:id route
app.use("/api/auth", authRoutes);
app.use("/api/docs", documentRoutes);
app.use("/api/signatures", signatureRoutes);
app.use("/api/public-sign", publicSignatureRoutes);
app.use("/api/recipients", recipientRoutes);
app.use("/api/audit", auditRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.stack || err.message);
  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: Object.values(err.errors).map(e => e.message).join(", ") });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }
  if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid ID format" });
  if (err.name === "JsonWebTokenError") return res.status(401).json({ success: false, message: "Invalid token" });
  if (err.name === "TokenExpiredError") return res.status(401).json({ success: false, message: "Session expired" });
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ success: false, message: "File too large. Max 20 MB." });
  res.status(err.statusCode || 500).json({ success: false, message: err.message || "An unexpected error occurred." });
});

module.exports = app;