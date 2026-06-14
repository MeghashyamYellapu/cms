const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const { generateToken } = require('../middlewares/auth');
const { logAudit } = require('../middlewares/auditLog');

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Accept either `identifier` (new) or `email` (legacy) field
    const identifier = (req.body.identifier || req.body.email || '').trim();
    const { password } = req.body;

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email or phone number and password'
      });
    }

    // Detect whether the identifier looks like an email or a phone number
    const isPhone = /^[6-9]\d{9}$/.test(identifier);
    const isEmail = identifier.includes('@');

    if (!isPhone && !isEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address or 10-digit phone number'
      });
    }

    // Find admin by email OR phone number
    const query = isPhone
      ? { phoneNumber: identifier }
      : { email: identifier.toLowerCase() };

    const admin = await Admin.findOne(query).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is blocked
    if (admin.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Contact super admin.'
      });
    }

    // Check password
    const isPasswordMatch = await admin.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id);

    // Log audit
    await AuditLog.create({
      adminId: admin._id,
      action: 'LOGIN',
      entity: 'Admin',
      entityId: admin._id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          status: admin.status,
          companyDetails: admin.companyDetails,
          parentId: admin.parentId // Include parentId as well for context
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    const adminData = admin.toObject();
    if (!adminData.companyDetails) {
      adminData.companyDetails = {};
    }
    // Never expose password hash (already excluded by toJSON, but belt-and-suspenders)
    delete adminData.password;

    res.status(200).json({
      success: true,
      data: adminData
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Logout admin
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Log audit
    await AuditLog.create({
      adminId: req.admin._id,
      action: 'LOGOUT',
      entity: 'Admin',
      entityId: req.admin._id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const admin = await Admin.findById(req.admin._id).select('+password');

    // Check current password
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};
