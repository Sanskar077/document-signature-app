const mongoose = require("mongoose");
  const bcrypt = require("bcryptjs");
  const crypto = require("crypto");
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    otpCode: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
  }, { timestamps: true });
  userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    return resetToken;
  };
  userSchema.methods.createOTP = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpCode = crypto.createHash("sha256").update(otp).digest("hex");
    this.otpExpires = Date.now() + 10 * 60 * 1000;
    return otp;
  };
  module.exports = mongoose.model("User", userSchema);
  