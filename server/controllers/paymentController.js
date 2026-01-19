const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const { logAudit } = require('../middlewares/auditLog');
const { generateReceipt } = require('../utils/receiptGenerator');
const { sendWhatsAppReceipt } = require('../utils/whatsappService');

// Helper to add isolation filter for PAYMENTS
const getIsolationFilter = (req) => {
  const filter = {};
  if (req.admin.role === 'Admin') {
     filter.collectedBy = req.admin._id;
  } else if (req.admin.role === 'SuperAdmin') {
     filter.superAdminId = req.admin._id;
  }
  return filter;
};

// @desc    Record payment
// @route   POST /api/payments
// @access  Private
exports.recordPayment = async (req, res) => {
  try {
    const {
      customerId,
      billId,
      paidAmount,
      paymentMode,
      transactionId,
      notes
    } = req.body;

    // Validate input
    if (!customerId || !billId || !paidAmount || !paymentMode) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID, Bill ID, paid amount, and payment mode are required'
      });
    }

    // Get customer using isolation filter (Manual logic as Customer != Payment)
    const customerQuery = { _id: customerId };
    if (req.admin.role === 'Admin') {
       customerQuery.createdBy = req.admin._id;
    } else if (req.admin.role === 'SuperAdmin') {
       customerQuery.superAdminId = req.admin._id;
    }

    const customer = await Customer.findOne(customerQuery);

    const bill = await Bill.findById(billId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found (or access denied)'
      });
    }

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Calculate remaining balance
    const currentRemaining = bill.remainingBalance;
    const newRemaining = currentRemaining - paidAmount;

    // Check removed to allow overpayment/advance


    // Backfill superAdminId if missing (fix for legacy data)
    if (!customer.superAdminId) {
       if (req.superAdminId) {
         customer.superAdminId = req.superAdminId;
       } else if (req.admin) {
         // If SuperAdmin or WebsiteAdmin, assign to self
         if (req.admin.role === 'SuperAdmin' || req.admin.role === 'WebsiteAdmin') {
            customer.superAdminId = req.admin._id;
         }
         // If normal Admin (potentially orphaned legacy admin), assign to self or parent
         else if (req.admin.role === 'Admin') {
             customer.superAdminId = req.admin.parentId || req.admin._id;
         }
       }
       // Save the customer immediately to persist the fix
       await customer.save();
    }

    // Create payment record
    const payment = await Payment.create({
      customerId,
      billId,
      paidAmount,
      remainingBalance: newRemaining,
      paymentMode,
      transactionId,
      collectedBy: req.admin._id,
      notes,
      superAdminId: customer.superAdminId // Now guaranteed to have a value if backfill worked
    });

    // Update bill
    bill.paidAmount += paidAmount;
    await bill.save();

    // Update customer's previous balance
    customer.previousBalance = newRemaining;
    await customer.save();

    // Populate payment data
    await payment.populate('customerId');
    await payment.populate('billId');
    await payment.populate('collectedBy', 'name');

    // Generate PDF receipt
    let receiptPath = null;
    try {
      receiptPath = await generateReceipt(payment);
    } catch (error) {
      console.error('Receipt generation error:', error);
    }

    // Send WhatsApp receipt
    if (customer.whatsappEnabled && receiptPath) {
      try {
        const whatsappResult = await sendWhatsAppReceipt(customer, payment, receiptPath);
        
        if (whatsappResult.success) {
          payment.receiptSent = true;
          payment.whatsappStatus = 'Sent';
          payment.whatsappMessageId = whatsappResult.messageId;
        } else {
          payment.whatsappStatus = 'Failed';
        }
      } catch (error) {
        console.error('WhatsApp send error:', error);
        payment.whatsappStatus = 'Failed';
      }
    } else {
      payment.whatsappStatus = 'Not Enabled';
    }

    await payment.save();

    // Log audit
    await logAudit(req, 'RECORD_PAYMENT', 'Payment', payment._id, {
      customerId: customer.customerId,
      customerName: customer.name,
      paidAmount,
      paymentMode,
      receiptId: payment.receiptId
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all payments with filters
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      customerId = '',
      paymentMode = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const query = { ...getIsolationFilter(req) };

    if (customerId) query.customerId = customerId;
    if (paymentMode) query.paymentMode = paymentMode;

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('customerId', 'customerId name phoneNumber area serviceType')
      .populate('billId', 'month year totalPayable previousBalance')
      .populate('collectedBy', 'name')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
exports.getPayment = async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getIsolationFilter(req) };
    const payment = await Payment.findOne(query)
      .populate('customerId')
      .populate('billId')
      .populate('collectedBy', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get customer payments
// @route   GET /api/payments/customer/:customerId
// @access  Private
exports.getCustomerPayments = async (req, res) => {
  try {
    const query = { customerId: req.params.customerId, ...getIsolationFilter(req) };
    const payments = await Payment.find(query)
      .populate('billId', 'month year')
      .populate('collectedBy', 'name')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get customer payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Resend WhatsApp receipt
// @route   POST /api/payments/:id/resend-receipt
// @access  Private
exports.resendReceipt = async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getIsolationFilter(req) };
    const payment = await Payment.findOne(query)
      .populate('customerId')
      .populate('billId')
      .populate('collectedBy', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const customer = payment.customerId;

    if (!customer.whatsappEnabled) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp is not enabled for this customer'
      });
    }

    // Generate receipt
    const receiptPath = await generateReceipt(payment);

    // Send WhatsApp
    const whatsappResult = await sendWhatsAppReceipt(customer, payment, receiptPath);

    if (whatsappResult.success) {
      payment.receiptSent = true;
      payment.whatsappStatus = 'Sent';
      payment.whatsappMessageId = whatsappResult.messageId;
      await payment.save();

      // Log audit
      await logAudit(req, 'SEND_RECEIPT', 'Payment', payment._id, {
        receiptId: payment.receiptId,
        customerName: customer.name
      });

      res.status(200).json({
        success: true,
        message: 'Receipt sent successfully via WhatsApp'
      });
    } else {
      payment.whatsappStatus = 'Failed';
      await payment.save();

      res.status(500).json({
        success: false,
        message: 'Failed to send WhatsApp receipt',
        error: whatsappResult.error
      });
    }
  } catch (error) {
    console.error('Resend receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private
exports.getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { ...getIsolationFilter(req) };
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const totalPayments = await Payment.countDocuments(query);

    const paymentStats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$paidAmount' },
          avgAmount: { $avg: '$paidAmount' }
        }
      }
    ]);

    // Payment mode breakdown
    const paymentModeStats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMode',
          count: { $sum: 1 },
          amount: { $sum: '$paidAmount' }
        }
      }
    ]);

    // Daily collections
    const dailyCollections = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$paidAmount' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPayments,
        totalAmount: paymentStats[0]?.totalAmount || 0,
        avgAmount: paymentStats[0]?.avgAmount || 0,
        paymentModeStats,
        dailyCollections
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Download receipt PDF
// @route   GET /api/payments/:id/download-receipt
// @access  Private
exports.downloadReceipt = async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getIsolationFilter(req) };
    const payment = await Payment.findOne(query)
      .populate('customerId')
      .populate('billId')
      .populate('collectedBy', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Generate receipt if not exists
    const path = require('path');
    const fs = require('fs');
    
    // Check for PNG first, then HTML fallback
    let receiptPath = path.join(__dirname, '../receipts', `receipt_${payment.receiptId}.png`);
    let fileName = `Receipt_${payment.receiptId}.png`;
    
    if (!fs.existsSync(receiptPath)) {
      // Try HTML version
      receiptPath = path.join(__dirname, '../receipts', `receipt_${payment.receiptId}.html`);
      fileName = `Receipt_${payment.receiptId}.html`;
      
      // If neither exists, generate new receipt
      if (!fs.existsSync(receiptPath)) {
        await generateReceipt(payment);
        
        // Check again which format was created
        const pngPath = path.join(__dirname, '../receipts', `receipt_${payment.receiptId}.png`);
        if (fs.existsSync(pngPath)) {
          receiptPath = pngPath;
          fileName = `Receipt_${payment.receiptId}.png`;
        }
      }
    }

    // Send file for download
    res.download(receiptPath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading receipt'
        });
      }
    });
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
