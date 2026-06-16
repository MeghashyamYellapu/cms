const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkUpload,
  getBulkUploads,
  getBulkUploadDetail,
  getCustomerStats,
  getAreas
} = require('../controllers/customerController');
const { protect, authorize } = require('../middlewares/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `customers_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedExt = /\.(xlsx|xls|csv)$/i;
    const extname = allowedExt.test(path.extname(file.originalname));

    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/msexcel',
      'application/x-msexcel',
      'application/x-ms-excel',
      'application/x-excel',
      'application/x-dos_ms_excel',
      'application/xls',
      'application/x-xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
      'text/x-csv',
      'application/x-csv',
      'text/comma-separated-values',
      'text/x-comma-separated-values',
      'application/octet-stream' // some OS/browsers send this for xlsx
    ];
    const mimetype = allowedMimes.includes(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) or CSV files are allowed'));
    }
  }
});

// All routes are protected
router.use(protect);

// Stats and utilities
router.get('/stats', getCustomerStats);
router.get('/areas', getAreas);

// Bulk upload (Agent cannot upload)
router.post('/bulk-upload', authorize('WebsiteAdmin', 'SuperAdmin', 'Admin'), upload.single('file'), bulkUpload);
router.get('/bulk-uploads', authorize('WebsiteAdmin', 'SuperAdmin', 'Admin'), getBulkUploads);
router.get('/bulk-uploads/:uploadId', authorize('WebsiteAdmin', 'SuperAdmin', 'Admin'), getBulkUploadDetail);

// CRUD operations
router.route('/')
  .get(getCustomers)
  .post(authorize('WebsiteAdmin', 'SuperAdmin', 'Admin'), createCustomer);

router.route('/:id')
  .get(getCustomer)
  .put(authorize('WebsiteAdmin', 'SuperAdmin', 'Admin'), updateCustomer)
  .delete(authorize('WebsiteAdmin', 'SuperAdmin', 'Admin'), deleteCustomer);

module.exports = router;
