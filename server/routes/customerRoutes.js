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
    const filetypes = /xlsx|xls|csv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    // Check mime type more loosely or strictly for common excel types
    const excelMimes = [
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
      'text/x-comma-separated-values'
    ];
    
    const mimetype = excelMimes.includes(file.mimetype);

    // If extension sends check but mimetype is weird (sometimes happens), trust extension if octet-stream
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// All routes are protected
router.use(protect);

// Stats and utilities
router.get('/stats', getCustomerStats);
router.get('/areas', getAreas);

// Bulk upload
router.post('/bulk-upload', upload.single('file'), bulkUpload);

// CRUD operations
router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(authorize('SuperAdmin'), deleteCustomer);

module.exports = router;
