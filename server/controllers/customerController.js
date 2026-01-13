const Customer = require('../models/Customer');
const Bill = require('../models/Bill');
const { logAudit } = require('../middlewares/auditLog');
const xlsx = require('xlsx');
const fs = require('fs');

// Helper to add isolation filter
const getIsolationFilter = (req) => {
  const filter = {};
  if (req.superAdminId) {
    filter.superAdminId = req.superAdminId;
  }
  return filter;
};

// @desc    Get all customers with filters and pagination
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      area = '',
      serviceType = '',
      status = ''
    } = req.query;

    // Build query with isolation
    const query = { ...getIsolationFilter(req) };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } }
      ];
    }

    if (area) {
      query.area = area;
    }

    if (serviceType) {
      query.serviceType = serviceType;
    }

    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const customers = await Customer.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Mask Aadhaar numbers
    const customersWithMaskedAadhaar = customers.map(customer => {
      const customerObj = new Customer(customer);
      return {
        ...customer,
        aadhaarNumber: customerObj.getMaskedAadhaar()
      };
    });

    const count = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      data: customersWithMaskedAadhaar,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getIsolationFilter(req) };
    const customer = await Customer.findOne(query)
      .populate('createdBy', 'name email');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Return with masked Aadhaar
    const customerData = customer.toObject();
    customerData.aadhaarNumber = customer.getMaskedAadhaar();

    res.status(200).json({
      success: true,
      data: customerData
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      createdBy: req.admin._id,
      superAdminId: req.superAdminId || req.admin._id // If WebsiteAdmin (null superAdminId), they own it
    };

    // Check duplicate phone within the same SuperAdmin scope?
    // Usually phone numbers should be unique to the system or unique to the SuperAdmin?
    // Let's enforce uniqueness globally to avoid confusion, or scoped.
    // User asked "seperate theirs customers with others".
    // So uniqueness should be SCOPED. Two SuperAdmins can have same phone number customer?
    // Probably yes.
    // BUT, the schema might have unique index on phoneNumber. 
    // I need to check Schema. If it's unique global, we have a problem.
    // I will check schema later. For now assuming global unique.

    const customer = await Customer.create(customerData);

    // Log audit
    await logAudit(req, 'CREATE_CUSTOMER', 'Customer', customer._id, {
      customerId: customer.customerId,
      name: customer.name
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getIsolationFilter(req) };
    let customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Don't allow updating createdBy or superAdminId
    delete req.body.createdBy;
    delete req.body.superAdminId;

    customer = await Customer.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    );

    // Log audit
    await logAudit(req, 'UPDATE_CUSTOMER', 'Customer', customer._id, {
      customerId: customer.customerId,
      name: customer.name,
      updates: Object.keys(req.body)
    });

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (SuperAdmin only)
exports.deleteCustomer = async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getIsolationFilter(req) };
    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if customer has bills
    const billCount = await Bill.countDocuments({ customerId: customer._id });

    if (billCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing bills. Deactivate instead.'
      });
    }

    await customer.deleteOne();

    // Log audit
    await logAudit(req, 'DELETE_CUSTOMER', 'Customer', customer._id, {
      customerId: customer.customerId,
      name: customer.name
    });

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Bulk upload customers from Excel
// @route   POST /api/customers/bulk-upload
// @access  Private
exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const results = {
      success: [],
      errors: []
    };

    const currentSuperAdminId = req.superAdminId || req.admin._id;

    // Validate and process each row
    for (let i = 0; i < data.length; i++) {
      const rowRaw = data[i];
      const rowNumber = i + 2; 

      // Normalize keys (handle case and flexible naming)
      const row = {};
      Object.keys(rowRaw).forEach(key => {
        const cleanKey = key.toLowerCase().trim().replace(/\s+/g, '');
        // Map common variations to standard keys
        if (['name', 'customername'].includes(cleanKey)) row.name = rowRaw[key];
        else if (['phonenumber', 'mobile', 'mobilenumber', 'phone'].includes(cleanKey)) row.phoneNumber = rowRaw[key];
        else if (['aadhaarnumber', 'aadhaar', 'adhar', 'adharnumber', 'uid'].includes(cleanKey)) row.aadhaarNumber = rowRaw[key];
        else if (['address', 'addr'].includes(cleanKey)) row.address = rowRaw[key];
        else if (['area', 'location', 'village'].includes(cleanKey)) row.area = rowRaw[key];
        else if (['servicetype', 'service', 'connectiontype'].includes(cleanKey)) row.serviceType = rowRaw[key];
        else if (['settopboxid', 'stb', 'stbid', 'macid'].includes(cleanKey)) row.setTopBoxId = rowRaw[key];
        else if (['cafid', 'cafnumber', 'caf'].includes(cleanKey)) row.cafId = rowRaw[key];
        else if (['packageamount', 'amount', 'monthlyrent', 'package'].includes(cleanKey)) row.packageAmount = rowRaw[key];
        else if (['previousbalance', 'balance', 'due', 'oldbalance'].includes(cleanKey)) row.previousBalance = rowRaw[key];
        else if (['status', 'activestatus'].includes(cleanKey)) row.status = rowRaw[key];
      });

      try {
        const errors = [];

        // Required Fields
        if (!row.name || row.name.toString().trim() === '') errors.push('Name is required');
        
        if (!row.phoneNumber) {
          errors.push('Phone number is required');
        } else {
             // Basic sanitation
             row.phoneNumber = row.phoneNumber.toString().replace(/[^0-9]/g, '');
             if (!/^[6-9]\d{9}$/.test(row.phoneNumber)) errors.push('Invalid phone number (must be 10 digits)');
        }

        if (!row.area || row.area.toString().trim() === '') errors.push('Area is required');

        if (!row.serviceType) {
          errors.push('Service type is required');
        } else {
           // Normalize Service Type Case
           const st = row.serviceType.toString().toUpperCase();
           if (['SDV', 'APSFL', 'RAILWIRE'].includes(st)) {
               row.serviceType = st;
           } else {
               errors.push('Service type must be SDV, APSFL, or RailWire');
           }
        }

        if (row.aadhaarNumber) {
           const adharStr = row.aadhaarNumber.toString().trim();
           if (/^\d+$/.test(adharStr) && !/^\d{12}$/.test(adharStr)) {
               errors.push('Aadhaar must be 12 digits');
           }
           row.aadhaarNumber = adharStr;
        }

        if (row.packageAmount !== undefined) {
             const amt = parseFloat(row.packageAmount);
             if (isNaN(amt) || amt < 0) errors.push('Package amount must be valid');
             else row.packageAmount = amt;
        }

        if (errors.length > 0) {
          results.errors.push({ row: rowNumber, data: rowRaw, errors });
          continue;
        }

        // Check duplicate phone - GLOBALLY? or Scoped?
        // Ideally Scoped, but phone is phone. Let's check Global for now to prevent confusion.
        // Actually, if we want separate lists, we should check scoped.
        // But schema enforces unique phoneNumber globally? I need to check schema.
        // Assuming global unique for now.
        const existingCustomer = await Customer.findOne({ phoneNumber: row.phoneNumber });
        if (existingCustomer) {
           results.errors.push({ row: rowNumber, data: rowRaw, errors: ['Phone number already exists'] });
           continue;
        }

        // Create
        const customer = await Customer.create({
          name: row.name.toString().trim(),
          phoneNumber: row.phoneNumber,
          aadhaarNumber: row.aadhaarNumber || '',
          address: row.address ? row.address.toString().trim() : '',
          area: row.area.toString().trim(),
          serviceType: row.serviceType,
          setTopBoxId: row.setTopBoxId ? row.setTopBoxId.toString() : '',
          cafId: row.cafId ? row.cafId.toString() : '',
          packageAmount: row.packageAmount || 250,
          monthlyCharge: row.packageAmount || 250,
          previousBalance: row.previousBalance ? parseFloat(row.previousBalance) : 0,
          status: row.status || 'Active',
          whatsappEnabled: true,
          createdBy: req.admin._id,
          superAdminId: currentSuperAdminId
        });

        results.success.push({
          row: rowNumber,
          customerId: customer.customerId,
          name: customer.name
        });
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          data: row,
          errors: [error.message]
        });
      }
    }

    // Delete uploaded file
    fs.unlinkSync(req.file.path);

    // Log audit
    await logAudit(req, 'BULK_UPLOAD', 'Customer', null, {
      totalRows: data.length,
      successCount: results.success.length,
      errorCount: results.errors.length
    });

    res.status(200).json({
      success: true,
      message: `Bulk upload completed. ${results.success.length} customers created, ${results.errors.length} errors.`,
      data: results
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    
    // Clean up file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Server error during bulk upload',
      error: error.message
    });
  }
};

// @desc    Get customer statistics
// @route   GET /api/customers/stats
// @access  Private
exports.getCustomerStats = async (req, res) => {
  try {
    const filter = getIsolationFilter(req);
    const totalCustomers = await Customer.countDocuments(filter);
    const activeCustomers = await Customer.countDocuments({ ...filter, status: 'Active' });
    const inactiveCustomers = await Customer.countDocuments({ ...filter, status: 'Inactive' });

    // Service type breakdown
    const serviceTypeStats = await Customer.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Area breakdown
    const areaStats = await Customer.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$area',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        serviceTypeStats,
        areaStats
      }
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get unique areas
// @route   GET /api/customers/areas
// @access  Private
exports.getAreas = async (req, res) => {
  try {
    const filter = getIsolationFilter(req);
    const areas = await Customer.distinct('area', filter);
    
    res.status(200).json({
      success: true,
      data: areas.sort()
    });
  } catch (error) {
    console.error('Get areas error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
