const express = require("express");
  const { registerUser, loginUser, forgotPassword, resetPassword, sendOTP, verifyOTP } = require("../controllers/authController");
  const router = express.Router();
  router.post("/register", registerUser);
  router.post("/login", loginUser);
  router.post("/forgot-password", forgotPassword);
  router.post("/reset-password/:token", resetPassword);
  router.post("/send-otp", sendOTP);
  router.post("/verify-otp", verifyOTP);
  module.exports = router;
  