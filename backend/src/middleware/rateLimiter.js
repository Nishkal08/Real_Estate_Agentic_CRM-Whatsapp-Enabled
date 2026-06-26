const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

/** General API rate limiter — 100 requests per 15 minutes */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 100000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

/** Stricter limiter for auth endpoints — 1000 per 15 minutes (relaxed for dev) */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts, please try again later.' },
});

module.exports = { apiLimiter, authLimiter };
