const express = require('express');
const router = express.Router();
const {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getMyAgents,
  createAgent,
  updateAgent,
  deleteAgent
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

// Agent management routes (Admin only) — must be before /:id to avoid collision
router.route('/agents')
  .get(authorize('Admin'), getMyAgents)
  .post(authorize('Admin'), createAgent);

router.route('/agents/:id')
  .put(authorize('Admin'), updateAgent)
  .delete(authorize('Admin'), deleteAgent);

// Admin management routes (WebsiteAdmin, SuperAdmin only)
router.route('/')
  .get(authorize('WebsiteAdmin', 'SuperAdmin'), getAdmins)
  .post(authorize('WebsiteAdmin', 'SuperAdmin'), createAdmin);

router.route('/:id')
  .put(authorize('WebsiteAdmin', 'SuperAdmin'), updateAdmin)
  .delete(authorize('WebsiteAdmin', 'SuperAdmin'), deleteAdmin);

module.exports = router;
