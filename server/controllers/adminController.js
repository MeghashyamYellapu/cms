const Admin = require('../models/Admin');
const { logAudit } = require('../middlewares/auditLog');

// @desc    Get all admins (non-Agent accounts)
// @route   GET /api/admins
// @access  Private (WebsiteAdmin, SuperAdmin)
exports.getAdmins = async (req, res) => {
  try {
    // WebsiteAdmin sees all; SuperAdmin sees only their own children
    const query = { role: { $ne: 'Agent' } };
    if (req.admin.role === 'SuperAdmin') {
      query.parentId = req.admin._id;
    }
    const { limit = 100 } = req.query;
    const safeLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 500);
    const admins = await Admin.find(query).select('-password').sort({ createdAt: -1 }).limit(safeLimit);

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
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Get agents belonging to the current Admin
// @route   GET /api/admins/agents
// @access  Private (Admin)
exports.getMyAgents = async (req, res) => {
  try {
    const agents = await Admin.find({ parentId: req.admin._id, role: 'Agent' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: agents.length,
      data: agents
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ success: false, message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// @desc    Create agent under current Admin (max 2)
// @route   POST /api/admins/agents
// @access  Private (Admin)
exports.createAgent = async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (phoneNumber && !/^[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Phone number must be a valid 10-digit number' });
    }

    const existingCount = await Admin.countDocuments({ parentId: req.admin._id, role: 'Agent' });
    if (existingCount >= 2) {
      return res.status(400).json({ success: false, message: 'You can have a maximum of 2 agents' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    if (phoneNumber) {
      const phoneExists = await Admin.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: 'An account with this phone number already exists' });
      }
    }

    const agent = await Admin.create({
      name,
      email,
      password,
      role: 'Agent',
      parentId: req.admin._id,
      status: 'Active',
      ...(phoneNumber && { phoneNumber })
    });

    await logAudit(req, 'CREATE_AGENT', 'Admin', agent._id, { agentEmail: email });

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: { id: agent._id, name: agent.name, email: agent.email, role: agent.role, status: agent.status }
    });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ success: false, message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// @desc    Update agent belonging to current Admin
// @route   PUT /api/admins/agents/:id
// @access  Private (Admin)
exports.updateAgent = async (req, res) => {
  try {
    const agent = await Admin.findOne({ _id: req.params.id, parentId: req.admin._id, role: 'Agent' });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const { name, email, status, password, phoneNumber } = req.body;

    if (phoneNumber !== undefined) {
      if (phoneNumber && !/^[6-9]\d{9}$/.test(phoneNumber)) {
        return res.status(400).json({ success: false, message: 'Phone number must be a valid 10-digit number' });
      }
      if (phoneNumber) {
        const phoneExists = await Admin.findOne({ phoneNumber, _id: { $ne: agent._id } });
        if (phoneExists) {
          return res.status(400).json({ success: false, message: 'An account with this phone number already exists' });
        }
      }
    }

    if (name) agent.name = name;
    if (email) agent.email = email;
    if (status) agent.status = status;
    if (password) agent.password = password;
    if (phoneNumber !== undefined) agent.phoneNumber = phoneNumber || undefined;

    await agent.save();

    await logAudit(req, 'UPDATE_AGENT', 'Admin', agent._id, { agentEmail: agent.email });

    res.status(200).json({ success: true, message: 'Agent updated successfully', data: agent });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ success: false, message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// @desc    Delete agent belonging to current Admin
// @route   DELETE /api/admins/agents/:id
// @access  Private (Admin)
exports.deleteAgent = async (req, res) => {
  try {
    const agent = await Admin.findOne({ _id: req.params.id, parentId: req.admin._id, role: 'Agent' });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    await agent.deleteOne();

    await logAudit(req, 'DELETE_AGENT', 'Admin', agent._id, { agentEmail: agent.email });

    res.status(200).json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ success: false, message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// @desc    Create new admin
// @route   POST /api/admins
// @access  Private (WebsiteAdmin, SuperAdmin)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Validate phone number format if provided
    if (phoneNumber && !/^[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Phone number must be a valid 10-digit number' });
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

    // Check phone uniqueness if provided
    if (phoneNumber) {
      const phoneExists = await Admin.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: 'An account with this phone number already exists' });
      }
    }

    // Create admin
    const adminData = {
      name,
      email,
      password,
      role: newRole,
      status: 'Active',
      companyDetails: req.body.companyDetails || {},
      ...(phoneNumber && { phoneNumber })
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
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Update admin
// @route   PUT /api/admins/:id
// @access  Private (WebsiteAdmin, SuperAdmin)
exports.updateAdmin = async (req, res) => {
  try {
    const { name, email, role, status, phoneNumber } = req.body;

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
      // SuperAdmin cannot modify peer SuperAdmins or WebsiteAdmins
      if (['SuperAdmin', 'WebsiteAdmin'].includes(admin.role) && admin._id.toString() !== req.admin._id.toString()) {
        return res.status(403).json({ success: false, message: 'You cannot modify this admin' });
      }
      // SuperAdmin can only modify Admins that belong to them
      if (admin.role === 'Admin' && admin.parentId?.toString() !== req.admin._id.toString()) {
        return res.status(403).json({ success: false, message: 'You cannot modify this admin' });
      }
      // SuperAdmin cannot promote to SuperAdmin/WebsiteAdmin
      if (role && ['SuperAdmin', 'WebsiteAdmin'].includes(role)) {
        return res.status(403).json({ success: false, message: 'You cannot assign this role' });
      }
    }

    // Validate and check phone uniqueness if being changed
    if (phoneNumber !== undefined) {
      if (phoneNumber && !/^[6-9]\d{9}$/.test(phoneNumber)) {
        return res.status(400).json({ success: false, message: 'Phone number must be a valid 10-digit number' });
      }
      if (phoneNumber) {
        const phoneExists = await Admin.findOne({ phoneNumber, _id: { $ne: admin._id } });
        if (phoneExists) {
          return res.status(400).json({ success: false, message: 'An account with this phone number already exists' });
        }
      }
    }

    // Update fields
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (status) admin.status = status;
    if (phoneNumber !== undefined) admin.phoneNumber = phoneNumber || undefined;
    
    // Update company details
    if (req.body.companyDetails) {
      if (!admin.companyDetails) {
          admin.companyDetails = {
              name: '', address: '', phone: '', email: '', gst: '', footer: 'Thank you for your business!'
          };
      }
      const newDetails = req.body.companyDetails;
      
      admin.companyDetails.name = newDetails.name !== undefined ? newDetails.name : admin.companyDetails.name;
      admin.companyDetails.address = newDetails.address !== undefined ? newDetails.address : admin.companyDetails.address;
      admin.companyDetails.phone = newDetails.phone !== undefined ? newDetails.phone : admin.companyDetails.phone;
      admin.companyDetails.email = newDetails.email !== undefined ? newDetails.email : admin.companyDetails.email;
      admin.companyDetails.footer = newDetails.footer !== undefined ? newDetails.footer : admin.companyDetails.footer;
      
      // Explicitly mark as modified for mixed/nested types if needed
      admin.markModified('companyDetails');
    }

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
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
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
      // SuperAdmin can only delete Admins that belong to them
      if (admin.role === 'Admin' && admin.parentId?.toString() !== req.admin._id.toString()) {
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
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};
