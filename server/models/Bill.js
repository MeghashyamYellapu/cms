const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  packageAmount: {
    type: Number,
    required: true,
    min: 0
  },
  previousBalance: {
    type: Number,
    default: 0
  },
  totalPayable: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingBalance: {
    type: Number,
    default: function() {
      return this.totalPayable;
    }
  },
  status: {
    type: String,
    enum: ['Paid', 'Partial', 'Unpaid'],
    default: 'Unpaid',
    index: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  superAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    index: true
  }
}, {
  timestamps: true
});

// Compound index for unique bill per customer per month
billSchema.index({ customerId: 1, month: 1, year: 1 }, { unique: true });

// Calculate remaining balance before saving
billSchema.pre('save', function(next) {
  this.remainingBalance = this.totalPayable - this.paidAmount;
  
  // Update status based on payment
  if (this.paidAmount === 0) {
    this.status = 'Unpaid';
  } else if (this.paidAmount >= this.totalPayable) {
    this.status = 'Paid';
  } else {
    this.status = 'Partial';
  }
  
  next();
});

module.exports = mongoose.model('Bill', billSchema);
