/**
 * Production-level Express Error Handler Middleware
 * Handles 404 Route Not Found and 500 Global Application Errors.
 */

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const globalErrorHandler = (err, req, res, next) => {
  // Handle Mongoose malformed ObjectId (CastError)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid format for field: ${err.path || "id"}`,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", ") || "Validation failed",
    });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  // Log error details server-side safely
  console.error(`💥 [EXPRESS ERROR] [${req.method} ${req.originalUrl || req.url}]:`, err.message);

  const isProduction = process.env.NODE_ENV === "production";
  const clientMessage = isProduction && statusCode === 500
    ? "Internal Server Error"
    : err.message || "Internal Server Error";

  const responseBody = {
    success: false,
    message: clientMessage,
    fallbackAvailable: true,
  };

  if (!isProduction && err.stack) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
