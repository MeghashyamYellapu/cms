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

// Auto-generate receipt ID before saving (Scoped to Admin)
paymentSchema.pre('save', async function(next) {
  if (!this.receiptId || this.receiptId === '') {
    // Count only payments by this same collector for scoped numbering
    const count = await mongoose.model('Payment').countDocuments({ 
      collectedBy: this.collectedBy 
    });
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    // Format: RCP[YY][MM]-[sequence] - unique per admin
    this.receiptId = `RCP${year}${month}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
