const rateLimit = require("express-rate-limit");

/**
 * Standard error response formatter for rate limit violations
 */
const createLimiterHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message,
    retryAfter: res.getHeader("Retry-After") || 60,
  });
};

/**
 * General API limiter: 300 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimiterHandler("Too many requests from this IP. Please try again after 15 minutes."),
  skip: (req) => process.env.DISABLE_RATE_LIMIT === "true",
});

/**
 * Authentication & OTP limiter: 15 requests per 15 minutes
 * Prevents credential stuffing, brute force, and OTP spam
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimiterHandler("Too many authentication attempts. Please try again after 15 minutes."),
  skip: (req) => process.env.DISABLE_RATE_LIMIT === "true",
});

/**
 * AI Itinerary Generation limiter: 10 requests per 15 minutes
 * Protects expensive Google GenAI quota and server resources
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimiterHandler("AI itinerary generation limit reached. Please try again after a few minutes."),
  skip: (req) => process.env.DISABLE_RATE_LIMIT === "true",
});

/**
 * Google Places search & details limiter: 60 requests per minute
 * Protects Google Places API costs while accommodating active typing
 */
const placesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimiterHandler("Places search query rate limit reached. Please slow down your requests."),
  skip: (req) => process.env.DISABLE_RATE_LIMIT === "true",
});

/**
 * Review creation limiter: 25 requests per hour
 * Prevents automated community review spamming
 */
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimiterHandler("Review submission limit reached. Please wait before submitting more reviews."),
  skip: (req) => process.env.DISABLE_RATE_LIMIT === "true",
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
  placesLimiter,
  reviewLimiter,
};
