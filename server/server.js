require("dotenv").config();
  const mongoose = require("mongoose");
  const app = require("./app");
  const port = process.env.PORT || 5000;

  const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/signflow");
      console.log("✅ MongoDB connected");
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err.message);
      process.exit(1);
    }
  };

  connectDB().then(() => {
    app.listen(port, () => console.log(`🚀 SignFlow API running on http://localhost:${port}`));
  });
  