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
const { protect } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

router
  .route('/')
  .get(getPayments)
  .post(recordPayment);

router.get('/customer/:customerId', getCustomerPayments);
router.get('/stats', getPaymentStats);
router.post('/:id/resend-receipt', resendReceipt);
router.post('/:id/send-receipt-both', sendReceiptBoth);
router.get('/:id/download-receipt', downloadReceipt);

router
  .route('/:id')
  .get(getPayment);

module.exports = router;
