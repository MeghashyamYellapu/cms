const Admin = require('../models/Admin');
const { logAudit } = require('../middlewares/auditLog');

// @desc    Get all admins
// @route   GET /api/admins
// @access  Private (WebsiteAdmin, SuperAdmin)
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new admin
// @route   POST /api/admins
// @access  Private (WebsiteAdmin, SuperAdmin)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Role Hierarchy Check
    const creatorRole = req.admin.role;
    const newRole = role || 'Admin';

    if (creatorRole !== 'WebsiteAdmin') {
      // Non-WebsiteAdmins (i.e. SuperAdmins) cannot create other SuperAdmins or WebsiteAdmins
      if (['SuperAdmin', 'WebsiteAdmin'].includes(newRole)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to create this role'
        });
      }
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Create admin
    const adminData = {
      name,
      email,
      password,
      role: newRole,
      status: 'Active'
    };

    // If Creator is SuperAdmin, they become the parent of the new Admin
    if (req.admin.role === 'SuperAdmin' && newRole === 'Admin') {
       adminData.parentId = req.admin._id;
    }

    const admin = await Admin.create(adminData);

    // Log audit
    await logAudit(req, 'CREATE_ADMIN', 'Admin', admin._id, {
      adminEmail: email,
      adminRole: admin.role
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update admin
// @route   PUT /api/admins/:id
// @access  Private (WebsiteAdmin, SuperAdmin)
exports.updateAdmin = async (req, res) => {
  try {
    const { name, email, role, status } = req.body;

    let admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent super admin from blocking themselves
    if (admin._id.toString() === req.admin._id.toString() && status === 'Blocked') {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself'
      });
    }

    // Hierarchy Check for Update
    if (req.admin.role !== 'WebsiteAdmin') {
      // SuperAdmin trying to modify a peer SuperAdmin or WebsiteAdmin
      // Exception: They can edit their OWN profile (name/email), but usually frontend handles that separatedly. 
      // Assuming this endpoint is for "Admin Management table".
      if (['SuperAdmin', 'WebsiteAdmin'].includes(admin.role) && admin._id.toString() !== req.admin._id.toString()) {
         return res.status(403).json({ success: false, message: 'You cannot modify this admin' });
      }
      
      // SuperAdmin trying to promote someone to SuperAdmin/WebsiteAdmin
      if (role && ['SuperAdmin', 'WebsiteAdmin'].includes(role)) {
         return res.status(403).json({ success: false, message: 'You cannot assign this role' });
      }
    }

    // Update fields
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (status) admin.status = status;

    await admin.save();

    // Log audit
    await logAudit(req, 'UPDATE_ADMIN', 'Admin', admin._id, {
      adminEmail: admin.email,
      updates: Object.keys(req.body)
    });

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: admin
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete admin
// @route   DELETE /api/admins/:id
// @access  Private (WebsiteAdmin, SuperAdmin)
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent deleting self
    if (admin._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself'
      });
    }

    // Hierarchy Check for Delete
    if (req.admin.role !== 'WebsiteAdmin') {
      // SuperAdmin cannot delete other SuperAdmins or WebsiteAdmins
      if (['SuperAdmin', 'WebsiteAdmin'].includes(admin.role)) {
         return res.status(403).json({ success: false, message: 'You cannot delete this admin' });
      }
    }

    await admin.deleteOne();

    // Log audit
    await logAudit(req, 'DELETE_ADMIN', 'Admin', admin._id, {
      adminEmail: admin.email
    });

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
