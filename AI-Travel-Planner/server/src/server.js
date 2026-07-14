require("dotenv").config();

const app = require("./app");
const tripRoutes = require("./routes/tripRoutes");
const connectDB = require("./config/db");

app.use("/api/trips", tripRoutes);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 TripSync Server is running on port ${PORT}`);
});