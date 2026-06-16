const mongoose = require('mongoose');

const bulkUploadSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  superAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    index: true
  },
  totalRows: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  errorCount: {
    type: Number,
    default: 0
  },
  successDetails: [{
    row: Number,
    customerId: String,
    name: String,
    phoneNumber: String
  }],
  errorDetails: [{
    row: Number,
    data: mongoose.Schema.Types.Mixed,
    errors: [String]
  }]
}, {
  timestamps: true
});

bulkUploadSchema.index({ createdBy: 1, createdAt: -1 });
bulkUploadSchema.index({ superAdminId: 1, createdAt: -1 });

module.exports = mongoose.model('BulkUpload', bulkUploadSchema);
