const Settings = require('../models/Settings');
const Admin = require('../models/Admin');
const { logAudit } = require('../middlewares/auditLog');

// Helper function to find company details from admin or parent chain
const getCompanyDetailsFromAdminChain = async (admin) => {
    // First check if this admin has their own company details
    if (admin && admin.companyDetails && admin.companyDetails.name) {
        return admin.companyDetails;
    }
    
    // If not, check if they have a parent (SuperAdmin) with company details
    if (admin && admin.parentId) {
        const parentAdmin = await Admin.findById(admin.parentId);
        if (parentAdmin && parentAdmin.companyDetails && parentAdmin.companyDetails.name) {
            return parentAdmin.companyDetails;
        }
    }
    
    // No custom details found in chain
    return null;
};

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.getSettings();
    settings = settings.toObject(); // Convert to plain object to allow overwriting

    // Explicitly fetch latest admin details to ensure company info is fresh
    const currentAdmin = await Admin.findById(req.admin._id);

    // Get company details from admin or their parent chain
    const companyDetails = await getCompanyDetailsFromAdminChain(currentAdmin);
    
    // Overlay company details if found
    if (companyDetails) {
        settings.companyName = companyDetails.name;
        if (companyDetails.address) settings.companyAddress = companyDetails.address;
        if (companyDetails.phone) settings.companyPhone = companyDetails.phone;
        if (companyDetails.email) settings.companyEmail = companyDetails.email;
        if (companyDetails.footer) settings.receiptFooter = companyDetails.footer;
    }
    
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
// @access  Private (SuperAdmin, WebsiteAdmin, Admin)
exports.updateSettings = async (req, res) => {
  try {
    // For Admin and SuperAdmin: Update their OWN profile's company details
    // This enables inheritance: SuperAdmin's details flow down to their child Admins
    if (req.admin.role === 'Admin' || req.admin.role === 'SuperAdmin') {
        // Fetch fresh admin from DB to ensure we have the latest
        const admin = await Admin.findById(req.admin._id);
        
        if (!admin.companyDetails) {
            admin.companyDetails = {
                name: '', address: '', phone: '', email: '', gst: '', footer: 'Thank you for your business!'
            };
        }
        
        if (req.body.companyName !== undefined) admin.companyDetails.name = req.body.companyName;
        if (req.body.companyAddress !== undefined) admin.companyDetails.address = req.body.companyAddress;
        if (req.body.companyPhone !== undefined) admin.companyDetails.phone = req.body.companyPhone;
        if (req.body.companyEmail !== undefined) admin.companyDetails.email = req.body.companyEmail;
        
        admin.markModified('companyDetails');
        await admin.save();
        
        // Log audit
        await logAudit(req, 'UPDATE_COMPANY_DETAILS', 'Admin', admin._id, {
            updatedFields: ['companyDetails']
        });
        
        return res.status(200).json({
            success: true,
            message: 'Company settings updated successfully',
            data: {
                companyName: admin.companyDetails.name,
                companyAddress: admin.companyDetails.address,
                companyPhone: admin.companyDetails.phone,
                companyEmail: admin.companyDetails.email
            }
        });
    }

    // For WebsiteAdmin: Update Global Settings (system-wide defaults)
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
      message: 'Global settings updated successfully',
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
