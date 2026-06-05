const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const protect = require("./middleware/authMiddleware");
const signatureRoutes = require("./routes/signatureRoutes");
const app = express();
const publicSignatureRoutes =
  require(
    "./routes/publicSignatureRoutes"
  );
// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  "/api/public-sign",
  publicSignatureRoutes
);
app.use("/api/signatures", signatureRoutes);

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Home Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Document Signature API Running",
  });
});

// Auth Routes
app.use("/api/auth", authRoutes);

// Document Routes
app.use("/api/docs", documentRoutes);

// Temporary Protected Route (JWT Test)
app.get("/api/protected", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected route working",
    user: req.user,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;