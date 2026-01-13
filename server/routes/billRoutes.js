const express = require('express');
const router = express.Router();
const {
  generateMonthlyBills,
  getBills,
  getBill,
  getCustomerBills,
  updateBill,
  getBillStats,
  getRevenueTrend
} = require('../controllers/billController');
const { protect } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

// Stats and analytics
router.get('/stats', getBillStats);
router.get('/revenue-trend', getRevenueTrend);

// Generate bills
router.post('/generate', generateMonthlyBills);

// Customer bills
router.get('/customer/:customerId', getCustomerBills);

// CRUD operations
router.route('/')
  .get(getBills);

router.route('/:id')
  .get(getBill)
  .put(updateBill);

module.exports = router;
