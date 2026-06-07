const crypto = require("crypto");
  const User = require("../models/User");
  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");
  const { sendEmail } = require("../utils/emailService");

  exports.registerUser = async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) return res.status(400).json({ success: false, message: "All fields are required" });
      if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      const exists = await User.findOne({ email: email.toLowerCase().trim() });
      if (exists) return res.status(409).json({ success: false, message: "An account with this email already exists" });
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: hashedPassword });
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) { next(error); }
  };

  exports.loginUser = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ success: false, message: "Invalid email or password" });
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) { next(error); }
  };

  exports.forgotPassword = async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: "Email is required" });
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return res.json({ success: true, message: "If an account exists with that email, a reset link has been sent." });
      const rawToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });
      const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
      const resetUrl = `${frontendBase}/reset-password/${rawToken}`;
      const html = `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#1a1b23;border-radius:16px;overflow:hidden"><div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px"><h1 style="color:white;margin:0;font-size:24px">✍️ SignFlow</h1><p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Password Reset</p></div><div style="padding:40px;color:#f1f2f6"><p>Hello <strong>${user.name}</strong>,</p><p style="color:#9ca3af">Click the button below to reset your password. This link expires in 1 hour.</p><div style="margin:32px 0;text-align:center"><a href="${resetUrl}" style="background:#6366f1;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px">Reset Password →</a></div><p style="font-size:13px;color:#6b7280">If you didn't request this, safely ignore this email.</p></div></div>`;
      await sendEmail({ to: user.email, subject: "SignFlow — Password Reset Request", html, text: `Reset your password: ${resetUrl}` });
      res.json({ success: true, message: "If an account exists with that email, a reset link has been sent.", ...(process.env.NODE_ENV !== "production" && { devResetUrl: resetUrl }) });
    } catch (error) { next(error); }
  };

  exports.resetPassword = async (req, res, next) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      if (!password || password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });
      if (!user) return res.status(400).json({ success: false, message: "Reset link is invalid or has expired" });
      user.password = await bcrypt.hash(password, 12);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      res.json({ success: true, message: "Password reset successfully. You can now log in." });
    } catch (error) { next(error); }
  };

  exports.sendOTP = async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: "Email is required" });
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return res.status(404).json({ success: false, message: "No account found with this email" });
      const otp = user.createOTP();
      await user.save({ validateBeforeSave: false });
      const html = `<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#1a1b23;border-radius:16px;overflow:hidden"><div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px"><h1 style="color:white;margin:0">✍️ SignFlow</h1></div><div style="padding:40px;color:#f1f2f6"><p>Hello <strong>${user.name}</strong>, your verification code is:</p><div style="margin:24px 0;text-align:center;background:#0d0e12;border-radius:12px;padding:24px"><span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#6366f1">${otp}</span></div><p style="font-size:13px;color:#6b7280">This code expires in 10 minutes.</p></div></div>`;
      await sendEmail({ to: user.email, subject: "SignFlow — Verification Code", html, text: `Your verification code: ${otp}` });
      res.json({ success: true, message: "OTP sent to your email", ...(process.env.NODE_ENV !== "production" && { devOtp: otp }) });
    } catch (error) { next(error); }
  };

  exports.verifyOTP = async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });
      const hashedOtp = crypto.createHash("sha256").update(otp.toString()).digest("hex");
      const user = await User.findOne({ email: email.toLowerCase().trim(), otpCode: hashedOtp, otpExpires: { $gt: Date.now() } });
      if (!user) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      user.otpCode = null; user.otpExpires = null; user.isVerified = true;
      await user.save({ validateBeforeSave: false });
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.json({ success: true, message: "OTP verified", token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) { next(error); }
  };
  