const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const message = (msg) => ({ success: false, message: msg });

// Generous in development so a hot-reloading frontend never locks itself out.
const factor = env.isProd ? 1 : 20;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000 * factor,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Too many requests. Please slow down and try again shortly.'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20 * factor,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Too many authentication attempts. Please try again in 15 minutes.'),
});

module.exports = { apiLimiter, authLimiter };
