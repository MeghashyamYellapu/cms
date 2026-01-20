const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true
  },
  receiptId: {
    type: String,
    unique: true
  },
  paidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  remainingBalance: {
    type: Number,
    default: 0
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'],
    required: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  superAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    index: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  receiptSent: {
    type: Boolean,
    default: false
  },
  whatsappStatus: {
    type: String,
    enum: ['Pending', 'Sent', 'Failed', 'Not Enabled'],
    default: 'Pending'
  },
  whatsappMessageId: {
    type: String
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Auto-generate receipt ID before saving (Globally unique with retry)
paymentSchema.pre('save', async function(next) {
  if (!this.receiptId || this.receiptId === '') {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `RCP${year}${month}`;
    
    // Count all payments with this month's prefix for accurate numbering
    const count = await mongoose.model('Payment').countDocuments({
      receiptId: { $regex: `^${prefix}` }
    });
    
    // Also find the highest receipt number to handle any gaps
    const lastPayment = await mongoose.model('Payment')
      .findOne({ receiptId: { $regex: `^${prefix}` } })
      .sort({ createdAt: -1, _id: -1 })
      .select('receiptId')
      .lean();
    
    let nextNumber = count + 1;
    
    // If there's a last payment, ensure we're higher than its number
    if (lastPayment && lastPayment.receiptId) {
      const lastNumber = parseInt(lastPayment.receiptId.replace(prefix, ''), 10);
      if (!isNaN(lastNumber) && lastNumber >= nextNumber) {
        nextNumber = lastNumber + 1;
      }
    }
    
    // Format: RCP[YY][MM][sequence] - globally unique
    this.receiptId = `${prefix}${String(nextNumber).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
