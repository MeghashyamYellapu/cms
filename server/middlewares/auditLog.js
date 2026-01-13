const AuditLog = require('../models/AuditLog');

// Log audit trail
exports.logAudit = async (req, action, entity, entityId = null, details = {}) => {
  try {
    await AuditLog.create({
      adminId: req.admin._id,
      action,
      entity,
      entityId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw error - audit logging should not break the main flow
  }
};
