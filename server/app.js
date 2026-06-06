const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const protect = require("./middleware/authMiddleware");
const signatureRoutes = require("./routes/signatureRoutes");
const publicSignatureRoutes = require("./routes/publicSignatureRoutes");
const recipientRoutes = require("./routes/recipientRoutes");
const auditRoutes = require("./routes/auditRoutes");

const app = express();

// ── Core Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Files ──
app.use("/uploads", express.static("uploads"));
app.use("/signed", express.static("signed"));

// ── Public Routes ──
app.use("/api/public-sign", publicSignatureRoutes);

// ── Home Route ──
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SignFlow API v2 Running",
    routes: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET  /api/docs",
      "POST /api/docs/upload",
      "GET  /api/docs/:id",
      "POST /api/docs/:id/finalize",
      "POST /api/signatures",
      "GET  /api/signatures/:id",
      "POST /api/public-sign/:id",
      "GET  /api/public-sign/:token",
      "POST /api/public-sign/:token/sign",
      "GET  /api/recipients/:documentId",
      "POST /api/recipients/:documentId",
      "DELETE /api/recipients/:documentId/:recipientId",
      "GET  /api/audit/:documentId",
    ],
  });
});

// ── Auth Routes ──
app.use("/api/auth", authRoutes);

// ── Document Routes ──
app.use("/api/docs", documentRoutes);

// ── Signature Routes ──
app.use("/api/signatures", signatureRoutes);

// ── Recipient Routes (NEW) ──
app.use("/api/recipients", recipientRoutes);

// ── Audit Routes (NEW) ──
app.use("/api/audit", auditRoutes);

// ── Protected Test Route ──
app.get("/api/protected", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected route working",
    user: req.user,
  });
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;