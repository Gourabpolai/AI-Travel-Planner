const path = require("path");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const itineraryRoutes = require("./routes/itinerary.routes");
const placesRoutes = require("./routes/places.routes");
const destinationsRoutes = require("./routes/destinations.routes");
const expenseRoutes = require("./routes/expense.routes");
const packingRoutes = require("./routes/packingItem.routes");
const tripRoutes = require("./routes/tripRoutes");
const reviewRoutes = require("./routes/review.routes");
const { notFoundHandler, globalErrorHandler } = require("./middleware/errorMiddleware");

const { sanitizeInput } = require("./middleware/sanitize");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

/* -------------------- Security & Core Middleware -------------------- */

// Hardened HTTP security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Preserved for API server compatibility
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows client to fetch destination images & photos
    xContentTypeOptions: true, // Prevents MIME-sniffing
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" }, // Prevents clickjacking
    hidePoweredBy: true, // Removes X-Powered-By header
  })
);

// Explicit CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matched origins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("CORS origin not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(morgan("dev"));

// Body parser with explicit 1MB payload size limit
app.use(express.json({ limit: "1mb" }));

// NoSQL operator injection sanitizer
app.use(sanitizeInput);

app.use(cookieParser());

// Baseline rate limiter across all /api routes
app.use("/api", apiLimiter);

// Static destination photographs storage (with 7-day immutable client caching and traversal protection)
app.use(
  "/destination-images",
  express.static(path.join(__dirname, "../../client/public/destination-images"), {
    maxAge: "7d",
    immutable: true,
    dotfiles: "ignore",
    index: false,
  })
);

/* -------------------- Routes -------------------- */

app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/itineraries", itineraryRoutes);

app.use("/api/places", placesRoutes);

app.use("/api/destinations", destinationsRoutes);

app.use("/api/expenses", expenseRoutes);

app.use("/api/packing", packingRoutes);

app.use("/api/trips", tripRoutes);

app.use("/api/reviews", reviewRoutes);

/* -------------------- Error Handlers -------------------- */

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;