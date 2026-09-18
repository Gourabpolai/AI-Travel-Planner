/**
 * NoSQL Operator Injection Sanitizer Middleware
 *
 * Recursively strips keys starting with '$' or containing '.' from:
 * - req.body
 * - req.query
 * - req.params
 *
 * Completely neutralizes MongoDB operator injection attacks
 * (e.g., { "$gt": "" }, { "$ne": null }) without external dependencies.
 */

function sanitize(val) {
  if (!val || typeof val !== "object") {
    return val;
  }

  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) {
      val[i] = sanitize(val[i]);
    }
    return val;
  }

  for (const key of Object.keys(val)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete val[key];
    } else {
      val[key] = sanitize(val[key]);
    }
  }

  return val;
}

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    sanitize(req.body);
  }
  if (req.query && typeof req.query === "object") {
    sanitize(req.query);
  }
  if (req.params && typeof req.params === "object") {
    sanitize(req.params);
  }
  next();
};

module.exports = {
  sanitize,
  sanitizeInput,
};
