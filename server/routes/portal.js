const express = require('express');
const router = express.Router();
const { customerLookup, getBillDetails } = require('../controllers/portalController');

// Rate limiting for portal endpoints (prevent abuse)
const rateLimit = require('express-rate-limit');

const portalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message: 'Too many lookup attempts. Please try again after 15 minutes.'
  }
});

// @route   POST /api/portal/lookup
// @desc    Public customer lookup by phone number
// @access  Public
router.post('/lookup', portalLimiter, customerLookup);

// @route   POST /api/portal/bill/:billId
// @desc    Get bill details (requires phone verification)
// @access  Public
router.post('/bill/:billId', portalLimiter, getBillDetails);

module.exports = router;
