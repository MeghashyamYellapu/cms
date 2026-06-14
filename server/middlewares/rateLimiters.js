const rateLimit = require('express-rate-limit');

// Tight limiter for login — 10 attempts per 15 min per IP
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Per-phone limiter for public portal — keyed by phone number in body
exports.portalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body?.phoneNumber || req.ip,
  message: { success: false, message: 'Too many lookup attempts. Please try again later.' }
});
