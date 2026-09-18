require("dotenv").config();

// Process level stability handlers for unhandled promise rejections and exceptions
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION! Keeping server process alive:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 UNHANDLED REJECTION! Keeping server process alive:", reason?.message || reason);
});

// Environment validation
const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === "production";
  if (!process.env.JWT_SECRET) {
    if (isProduction) {
      console.error("💥 FATAL: JWT_SECRET environment variable is missing in production!");
      process.exit(1);
    } else {
      console.warn("⚠️  WARNING: JWT_SECRET is not set in environment. Using dev fallback secret.");
      process.env.JWT_SECRET = "tripsync-dev-insecure-secret-change-in-production";
    }
  }
};

validateEnvironment();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB();

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Production-resilient TripSync Server is running on port ${PORT}`);
});