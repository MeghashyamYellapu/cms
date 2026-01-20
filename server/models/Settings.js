const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Company Information
  companyName: {
    type: String,
    default: 'Cable Operator Services'
  },
  companyAddress: {
    type: String,
    default: '123 Main Street, City, State'
  },
  companyPhone: {
    type: String,
    default: '+91-9876543210'
  },
  companyEmail: {
    type: String,
    default: 'info@cableoperator.com'
  },
  companyLogo: {
    type: String,
    default: ''
  },
  
  // Billing Settings
  billingDay: {
    type: Number,
    default: 1,
    min: 1,
    max: 31
  },
  defaultPackageAmount: {
    type: Number,
    default: 500
  },
  
  // Receipt Settings
  receiptHeader: {
    type: String,
    default: 'PAYMENT RECEIPT'
  },
  receiptFooter: {
    type: String,
    default: 'This is a digitally generated receipt and does not require a physical signature'
  },
  
  // WhatsApp Settings (Optional)
  whatsappEnabled: {
    type: Boolean,
    default: false
  },
  whatsappApiKey: {
    type: String,
    default: ''
  },
  whatsappPhoneId: {
    type: String,
    default: ''
  },
  whatsappMessageTemplate: {
    type: String,
    default: 'Hello {customerName},\n\nPayment received successfully! ✅\n\nService: {serviceType}\nPackage: ₹{packageAmount}\nPaid Amount: ₹{paidAmount}\nRemaining Balance: ₹{remainingBalance}\nReceipt ID: {receiptId}\n\nThank you for your payment!\n\n- {companyName}'
  },
  
  // UPI Payment Settings
  upiEnabled: {
    type: Boolean,
    default: false
  },
  upiId: {
    type: String,
    default: ''
  },
  
  // System Settings
  enableNotifications: {
    type: Boolean,
    default: true
  },
  enableAutoBackup: {
    type: Boolean,
    default: false
  },
  
  // Last Updated
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
