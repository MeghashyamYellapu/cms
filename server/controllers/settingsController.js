const Settings = require('../models/Settings');
const { logAudit } = require('../middlewares/auditLog');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (SuperAdmin only)
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.getSettings();
    
    // Update fields
    const allowedFields = [
      'companyName',
      'companyAddress',
      'companyPhone',
      'companyEmail',
      'companyLogo',
      'billingDay',
      'defaultPackageAmount',
      'receiptHeader',
      'receiptFooter',
      'whatsappEnabled',
      'whatsappApiKey',
      'whatsappPhoneId',
      'whatsappMessageTemplate',
      'enableNotifications',
      'enableAutoBackup'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });
    
    settings.updatedBy = req.admin._id;
    await settings.save();
    
    // Log audit
    await logAudit(req, 'UPDATE_SETTINGS', 'Settings', settings._id, {
      updatedFields: Object.keys(req.body)
    });
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Reset settings to default
// @route   POST /api/settings/reset
// @access  Private (SuperAdmin only)
exports.resetSettings = async (req, res) => {
  try {
    await Settings.deleteMany({});
    const settings = await Settings.create({
      updatedBy: req.admin._id
    });
    
    // Log audit
    await logAudit(req, 'RESET_SETTINGS', 'Settings', settings._id);
    
    res.status(200).json({
      success: true,
      message: 'Settings reset to default',
      data: settings
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
