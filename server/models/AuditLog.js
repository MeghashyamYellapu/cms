const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'CREATE_CUSTOMER',
      'UPDATE_CUSTOMER',
      'DELETE_CUSTOMER',
      'BULK_UPLOAD',
      'GENERATE_BILL',
      'RECORD_PAYMENT',
      'SEND_RECEIPT',
      'CREATE_ADMIN',
      'UPDATE_ADMIN',
      'BLOCK_ADMIN',
      'UPDATE_SETTINGS',
      'UPDATE_UPI_SETTINGS',
      'UPDATE_COMPANY_DETAILS',
      'RESET_SETTINGS',
      'SEND_RECEIPT_BOTH',
      'EXPORT_REPORT'
    ]
  },
  entity: {
    type: String,
    enum: ['Customer', 'Bill', 'Payment', 'Admin', 'System', 'Settings'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
