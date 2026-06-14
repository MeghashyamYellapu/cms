const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPayment,
  getCustomerPayments,
  recordPayment,
  resendReceipt,
  downloadReceipt,
  getPaymentStats,
  sendReceiptBoth
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

router
  .route('/')
  .get(getPayments)
  .post(recordPayment);

router.get('/customer/:customerId', getCustomerPayments);
router.get('/stats', getPaymentStats);
// Resend/send-both requires Admin or above — Agents cannot trigger outbound messaging
router.post('/:id/resend-receipt', authorize('WebsiteAdmin', 'SuperAdmin', 'Admin'), resendReceipt);
router.post('/:id/send-receipt-both', authorize('WebsiteAdmin', 'SuperAdmin', 'Admin'), sendReceiptBoth);
router.get('/:id/download-receipt', downloadReceipt);

router
  .route('/:id')
  .get(getPayment);

module.exports = router;
