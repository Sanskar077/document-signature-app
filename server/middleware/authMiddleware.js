const jwt = require("jsonwebtoken");
  const User = require("../models/User");
  const protect = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Authentication required." });
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password -resetPasswordToken -otpCode");
      if (!user) return res.status(401).json({ success: false, message: "User not found. Please sign in again." });
      req.user = { id: user._id.toString(), name: user.name, email: user.email };
      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") return res.status(401).json({ success: false, message: "Invalid token." });
      if (error.name === "TokenExpiredError") return res.status(401).json({ success: false, message: "Session expired. Please sign in again." });
      next(error);
    }
  };
  module.exports = protect;
  