const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  logout,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rateLimiters');

// Public routes — login has its own tight rate limit
router.post('/login', loginLimiter, login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

module.exports = router;
