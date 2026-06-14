const mongoose = require('mongoose');
require('./Counter'); // ensure Counter schema is registered before the pre-save hook runs

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

// Auto-generate receipt ID using an atomic counter — eliminates the race condition
paymentSchema.pre('save', async function(next) {
  if (!this.receiptId || this.receiptId === '') {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `RCP${year}${month}`;

    // Atomic increment — findOneAndUpdate with $inc is guaranteed unique under concurrent writes
    const Counter = mongoose.model('Counter');
    const counter = await Counter.findOneAndUpdate(
      { _id: `receipt_${prefix}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.receiptId = `${prefix}${String(counter.seq).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
