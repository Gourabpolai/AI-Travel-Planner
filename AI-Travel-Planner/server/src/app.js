require("dotenv").config();
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

// Reverse proxy trust configuration (only enabled when explicitly configured)
if (process.env.TRUST_PROXY) {
  const trustProxyVal =
    process.env.TRUST_PROXY === "true"
      ? true
      : isNaN(Number(process.env.TRUST_PROXY))
      ? process.env.TRUST_PROXY
      : Number(process.env.TRUST_PROXY);
  app.set("trust proxy", trustProxyVal);
}

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

// Explicit CORS origin normalization and configuration
const normalizeOrigin = (urlStr) => {
  if (!urlStr || typeof urlStr !== "string") return "";
  const trimmed = urlStr.trim().replace(/^['"]+|['"]+$/g, "").replace(/\/+$/, "");
  try {
    const parsed = new URL(trimmed);
    return parsed.origin.toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
};

const parseOriginList = (val) => {
  if (!val || typeof val !== "string") return [];
  return val
    .split(",")
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);
};

const defaultAllowedOrigins = [
  "https://ai-travel-planner-zeta.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].map(normalizeOrigin);

const getAllowedOrigins = () => {
  const envOrigins = [
    ...parseOriginList(process.env.CORS_ORIGIN),
    ...parseOriginList(process.env.SITE_URL),
    ...parseOriginList(process.env.FRONTEND_URL),
    ...parseOriginList(process.env.CLIENT_URL),
  ];
  return new Set([...defaultAllowedOrigins, ...envOrigins]);
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = getAllowedOrigins();
      const normalizedRequestOrigin = normalizeOrigin(origin);

      if (allowedOrigins.has(normalizedRequestOrigin)) {
        return callback(null, true);
      }

      // Permissive fallback in development if no explicit CORS_ORIGIN is set
      if (process.env.NODE_ENV !== "production" && !process.env.CORS_ORIGIN) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    maxAge: 86400,
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

// Static SEO Crawler files (robots.txt and sitemap.xml)
app.get("/robots.txt", (req, res) => {
  const fs = require("fs");
  const robotsPath = path.join(__dirname, "../../client/public/robots.txt");
  if (fs.existsSync(robotsPath)) {
    return res.type("text/plain").sendFile(robotsPath);
  }
  const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || "https://tripsync.app").replace(/\/$/, "");
  return res
    .type("text/plain")
    .send(
      `User-agent: *\nAllow: /\nAllow: /destination/\nAllow: /destinations/\nAllow: /destination-images/\nDisallow: /api/\nDisallow: /dashboard\nDisallow: /profile\nDisallow: /trips/\nDisallow: /signin\nDisallow: /signup\n\nSitemap: ${siteUrl}/sitemap.xml\n`
    );
});

app.get("/sitemap.xml", (req, res) => {
  const fs = require("fs");
  const sitemapPath = path.join(__dirname, "../../client/public/sitemap.xml");
  if (fs.existsSync(sitemapPath)) {
    return res.type("application/xml").sendFile(sitemapPath);
  }
  return res.status(404).json({ success: false, message: "Sitemap not found" });
});

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