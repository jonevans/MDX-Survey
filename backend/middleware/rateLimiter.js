const rateLimit = require('express-rate-limit');

// Environment-based rate limiting
const isDevelopment = process.env.NODE_ENV === 'development';

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Higher limits for development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Authentication rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 20, // More restrictive in production
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests (only count failed attempts)
  skipSuccessfulRequests: true,
  // Skip rate limiting for development/testing
  skip: (req) => {
    return isDevelopment;
  }
});

// More permissive rate limiting for authenticated users
const authenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs for authenticated users
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiting for AI endpoints (expensive operations)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 AI requests per hour
  message: {
    error: 'Too many AI requests from this IP, please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  authenticatedLimiter,
  aiLimiter
};