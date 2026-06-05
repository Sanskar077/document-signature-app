const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Document Signature API Running",
  });
});

// Auth Routes
app.use("/api/auth", authRoutes);

// Protected Route (Day 2 Testing)
app.get("/api/protected", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected route working",
    user: req.user,
  });
});

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;