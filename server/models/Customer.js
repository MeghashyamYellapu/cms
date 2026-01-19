const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number']
  },
  aadhaarNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional
        // If it's all digits, validate it's 12 digits
        // If it's encrypted (contains non-digits), allow it
        if (/^\d+$/.test(v)) {
          return /^\d{12}$/.test(v);
        }
        return true;
      },
      message: 'Aadhaar must be 12 digits'
    }
  },
  address: {
    type: String,
    trim: true
  },
  area: {
    type: String,
    required: [true, 'Area is required'],
    trim: true,
    index: true
  },
  serviceType: {
    type: String,
    enum: ['SDV', 'APSFL', 'RailWire'],
    required: [true, 'Service type is required'],
    index: true
  },
  setTopBoxId: {
    type: String,
    trim: true
  },
  cafId: {
    type: String,
    trim: true
  },
  packageAmount: {
    type: Number,
    min: 0,
    default: 250
  },
  monthlyCharge: {
    type: Number,
    default: function() {
      return this.packageAmount || 250;
    }
  },
  previousBalance: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    index: true
  },
  whatsappEnabled: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  superAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for isolation
customerSchema.index({ customerId: 1, createdBy: 1 }, { unique: true });
customerSchema.index({ phoneNumber: 1, createdBy: 1 }, { unique: true });

// Auto-generate customerId before saving
customerSchema.pre('save', async function(next) {
  if (!this.customerId || this.customerId === '') {
    const count = await mongoose.model('Customer').countDocuments({ createdBy: this.createdBy });
    this.customerId = `CUST${String(count + 1).padStart(6, '0')}`;
  }
  
  // Encrypt Aadhaar number if present
  if (this.isModified('aadhaarNumber') && this.aadhaarNumber) {
    this.aadhaarNumber = CryptoJS.AES.encrypt(
      this.aadhaarNumber,
      process.env.ENCRYPTION_KEY || 'default-key-change-this'
    ).toString();
  }
  
  next();
});

// Method to get masked Aadhaar
customerSchema.methods.getMaskedAadhaar = function() {
  if (!this.aadhaarNumber) return '';
  try {
    const decrypted = CryptoJS.AES.decrypt(
      this.aadhaarNumber,
      process.env.ENCRYPTION_KEY || 'default-key-change-this'
    ).toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) return this.aadhaarNumber; // Fallback if not encrypted properly
    return `XXXX-XXXX-${decrypted.slice(-4)}`;
  } catch (error) {
    return 'XXXX-XXXX-XXXX';
  }
};

// Method to get decrypted Aadhaar (for authorized use only)
customerSchema.methods.getDecryptedAadhaar = function() {
  if (!this.aadhaarNumber) return '';
  try {
    return CryptoJS.AES.decrypt(
      this.aadhaarNumber,
      process.env.ENCRYPTION_KEY || 'default-key-change-this'
    ).toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return null;
  }
};

// Index for search optimization
customerSchema.index({ name: 'text', phoneNumber: 'text', customerId: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
