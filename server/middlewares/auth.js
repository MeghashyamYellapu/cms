const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get admin from token
    req.admin = await Admin.findById(decoded.id);

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if admin is blocked
    if (req.admin.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Contact super admin.'
      });
    }

    // Determine Super Admin Context
    if (req.admin.role === 'WebsiteAdmin') {
       req.superAdminId = null; // Global access
    } else if (req.admin.role === 'SuperAdmin') {
       req.superAdminId = req.admin._id;
    } else if (req.admin.role === 'Admin') {
       // If Admin has no parent (e.g. created by WebsiteAdmin or legacy), isolate to self
       // This prevents "undefined" which leads to Global Access in filters
       req.superAdminId = req.admin.parentId || req.admin._id; 
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.'
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.admin.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};
