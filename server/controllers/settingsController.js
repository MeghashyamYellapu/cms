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
    
    // For Admin/SuperAdmin: Overlay their UPI settings if they have them
    if (currentAdmin && (currentAdmin.role === 'Admin' || currentAdmin.role === 'SuperAdmin')) {
      if (currentAdmin.upiSettings) {
        settings.upiEnabled = currentAdmin.upiSettings.upiEnabled || false;
        settings.upiId = currentAdmin.upiSettings.upiId || '';
      } else {
        // If admin hasn't set UPI settings yet, keep global or default
        settings.upiEnabled = settings.upiEnabled || false;
        settings.upiId = settings.upiId || '';
      }
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
    // Handle UPI settings - Store in Admin profile for Admin/SuperAdmin, global for WebsiteAdmin
    const hasUpiSettings = req.body.upiEnabled !== undefined || req.body.upiId !== undefined;
    
    if (hasUpiSettings) {
      // For Admin and SuperAdmin: Store UPI settings in their profile
      if (req.admin.role === 'Admin' || req.admin.role === 'SuperAdmin') {
        const admin = await Admin.findById(req.admin._id);
        
        if (!admin.upiSettings) {
          admin.upiSettings = { upiEnabled: false, upiId: '' };
        }
        
        if (req.body.upiEnabled !== undefined) {
          admin.upiSettings.upiEnabled = req.body.upiEnabled;
        }
        if (req.body.upiId !== undefined) {
          admin.upiSettings.upiId = req.body.upiId;
        }
        
        admin.markModified('upiSettings');
        await admin.save();
        
        // Log audit
        await logAudit(req, 'UPDATE_UPI_SETTINGS', 'Admin', admin._id, {
          updatedFields: ['upiSettings']
        });
        
        // If only UPI settings were updated, return here
        if (Object.keys(req.body).every(key => ['upiEnabled', 'upiId'].includes(key))) {
          return res.status(200).json({
            success: true,
            message: 'UPI settings updated successfully',
            data: {
              upiEnabled: admin.upiSettings.upiEnabled,
              upiId: admin.upiSettings.upiId
            }
          });
        }
      } else {
        // For WebsiteAdmin: Store in global Settings
        let settings = await Settings.getSettings();
        
        if (req.body.upiEnabled !== undefined) {
          settings.upiEnabled = req.body.upiEnabled;
        }
        if (req.body.upiId !== undefined) {
          settings.upiId = req.body.upiId;
        }
        
        settings.updatedBy = req.admin._id;
        await settings.save();
        
        // Log audit
        await logAudit(req, 'UPDATE_UPI_SETTINGS', 'Settings', settings._id, {
          updatedFields: ['upiEnabled', 'upiId']
        });
        
        // If only UPI settings were updated, return here
        if (Object.keys(req.body).every(key => ['upiEnabled', 'upiId'].includes(key))) {
          return res.status(200).json({
            success: true,
            message: 'UPI settings updated successfully',
            data: {
              upiEnabled: settings.upiEnabled,
              upiId: settings.upiId
            }
          });
        }
      }
    }
    
    // For Admin and SuperAdmin: Update their OWN profile's company details
    // This enables inheritance: SuperAdmin's details flow down to their child Admins
    if (req.admin.role === 'Admin' || req.admin.role === 'SuperAdmin') {
        // Check if company details are being updated
        const hasCompanyDetails = req.body.companyName !== undefined || 
                                   req.body.companyAddress !== undefined || 
                                   req.body.companyPhone !== undefined || 
                                   req.body.companyEmail !== undefined;
        
        if (hasCompanyDetails) {
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
      'upiEnabled',
      'upiId',
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
