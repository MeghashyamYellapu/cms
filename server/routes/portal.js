const express = require('express');
const router = express.Router();
const { customerLookup, getBillDetails } = require('../controllers/portalController');
const rateLimit = require('express-rate-limit');

// Per-IP limiter (broader protection)
const portalIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many lookup attempts. Please try again after 15 minutes.' }
});

// Per-phone limiter — caps enumeration of a specific number
const portalPhoneLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `phone_${req.body?.phoneNumber || req.ip}`,
  message: { success: false, message: 'Too many lookup attempts for this number. Please try again later.' }
});

// @route   POST /api/portal/lookup
// @desc    Public customer lookup by phone number
// @access  Public
router.post('/lookup', portalIpLimiter, portalPhoneLimiter, customerLookup);

// @route   POST /api/portal/bill/:billId
// @desc    Get bill details (requires phone verification)
// @access  Public
router.post('/bill/:billId', portalLimiter, getBillDetails);

module.exports = router;
