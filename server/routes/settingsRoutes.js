const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  resetSettings
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

// Get settings - accessible to all authenticated users
router.get('/', getSettings);

// Update and reset - SuperAdmin only
router.put('/', authorize('SuperAdmin'), updateSettings);
router.post('/reset', authorize('SuperAdmin'), resetSettings);

module.exports = router;
