const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tripsync";
        await mongoose.connect(mongoUri, {
            dbName: process.env.DB_NAME || "tripsync",
        });

        const isAtlas = mongoUri.includes(".mongodb.net") || mongoUri.startsWith("mongodb+srv://");
        const dbName = mongoose.connection.name || "tripsync";
        console.log(`✅ MongoDB Connected Successfully to "${dbName}" (${isAtlas ? "MongoDB Atlas" : "Local MongoDB"})`);
    } catch (error) {
        // Sanitize error message to prevent leaking credentials in logs
        const safeMessage = (error.message || "").replace(/\/\/[^:]+:[^@]+@/g, "//***:***@");
        console.error("❌ MongoDB Connection Failed:", safeMessage);
        process.exit(1);
    }
};

module.exports = connectDB;