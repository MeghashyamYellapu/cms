const express = require('express');
const router = express.Router();
const {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// All routes require SuperAdmin role
router.use(protect);
router.use(authorize('WebsiteAdmin', 'SuperAdmin'));

router.route('/')
  .get(getAdmins)
  .post(createAdmin);

router.route('/:id')
  .put(updateAdmin)
  .delete(deleteAdmin);

module.exports = router;
