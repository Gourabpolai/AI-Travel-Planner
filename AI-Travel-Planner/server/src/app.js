const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const itineraryRoutes = require("./routes/itinerary.routes");

const app = express();

/* -------------------- Middleware -------------------- */

app.use(helmet());

app.use(cors());

app.use(morgan("dev"));

app.use(express.json());

app.use(cookieParser());

/* -------------------- Routes -------------------- */

app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/itineraries", itineraryRoutes);
module.exports = app;