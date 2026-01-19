const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const { logAudit } = require('../middlewares/auditLog');

// Helper to add isolation filter for BILLS
const getIsolationFilter = (req) => {
  const filter = {};
  if (req.admin.role === 'Admin') {
     filter.generatedBy = req.admin._id;
  } else if (req.admin.role === 'SuperAdmin') {
     filter.superAdminId = req.admin._id;
  }
  return filter;
};

// Helper to filter customers during generation
const getCustomerIsolationFilter = (req) => {
  const filter = {};
  if (req.admin.role === 'Admin') {
     filter.createdBy = req.admin._id;
  } else if (req.admin.role === 'SuperAdmin') {
     filter.superAdminId = req.admin._id;
  }
  return filter;
}

// @desc    Generate monthly bills
// @route   POST /api/bills/generate
// @access  Private
exports.generateMonthlyBills = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    // Get all active customers FOR THIS SuperAdmin/Admin
    const customerQuery = { status: 'Active', ...getCustomerIsolationFilter(req) };
    const customers = await Customer.find(customerQuery);


    const results = {
      success: [],
      errors: [],
      skipped: []
    };

    const currentSuperAdminId = req.superAdminId || req.admin._id; // Fallback for WebsiteAdmin self-generation?

    for (const customer of customers) {
      try {
        // Check if bill already exists for this month
        // We implicitly assume customers found belong to the correct scope, 
        // so checking by customerId is enough.
        const existingBill = await Bill.findOne({
          customerId: customer._id,
          month,
          year
        });

        if (existingBill) {
          results.skipped.push({
            customerId: customer.customerId,
            name: customer.name,
            reason: 'Bill already exists for this month'
          });
          continue;
        }

        // Calculate total payable
        const totalPayable = customer.packageAmount + customer.previousBalance;

        // Create bill
        const bill = await Bill.create({
          customerId: customer._id,
          month,
          year,
          packageAmount: customer.packageAmount,
          previousBalance: customer.previousBalance, // Snapshot before
          totalPayable,
          generatedBy: req.admin._id,
          superAdminId: customer.superAdminId // Use customer's superAdmin for consistency
        });

        // Update customer's outstanding balance
        customer.previousBalance = (customer.previousBalance || 0) + customer.packageAmount;
        await customer.save();

        results.success.push({
          customerId: customer.customerId,
          name: customer.name,
          billId: bill._id,
          totalPayable
        });
      } catch (error) {
        results.errors.push({
          customerId: customer.customerId,
          name: customer.name,
          error: error.message
        });
      }
    }

    // Log audit
    await logAudit(req, 'GENERATE_BILL', 'Bill', null, {
      month,
      year,
      totalCustomers: customers.length,
      successCount: results.success.length,
      errorCount: results.errors.length,
      skippedCount: results.skipped.length
    });

    res.status(200).json({
      success: true,
      message: `Bills generated for ${month} ${year}`,
      data: results
    });
  } catch (error) {
    console.error('Generate bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all bills with filters
// @route   GET /api/bills
// @access  Private
exports.getBills = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      month = '',
      year = '',
      status = '',
      customerId = ''
    } = req.query;

    const query = { ...getIsolationFilter(req) };

    if (month) query.month = month;
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;

    const bills = await Bill.find(query)
      .populate('customerId', 'customerId name phoneNumber area serviceType')
      .populate('generatedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Bill.countDocuments(query);

    res.status(200).json({
      success: true,
      data: bills,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single bill
// @route   GET /api/bills/:id
// @access  Private
exports.getBill = async (req, res) => {
  try {
    const query = { _id: req.params.id, ...getIsolationFilter(req) };
    const bill = await Bill.findOne(query)
      .populate('customerId')
      .populate('generatedBy', 'name');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bill
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get customer bills
// @route   GET /api/bills/customer/:customerId
// @access  Private
exports.getCustomerBills = async (req, res) => {
  try {
    // Ensure customer belongs to context first? Not strictly necessary if we query Bills by isolation filter
    // But good to check. 
    // Assuming Bill has superAdminId populated correctly.
    const query = { customerId: req.params.customerId, ...getIsolationFilter(req) };
    
    const bills = await Bill.find(query)
      .populate('generatedBy', 'name')
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      data: bills
    });
  } catch (error) {
    console.error('Get customer bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update bill status (manual)
// @route   PUT /api/bills/:id
// @access  Private
exports.updateBill = async (req, res) => {
  try {
    const { status, paidAmount } = req.body;
    const query = { _id: req.params.id, ...getIsolationFilter(req) };

    let bill = await Bill.findOne(query);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    if (status) bill.status = status;
    if (paidAmount !== undefined) bill.paidAmount = paidAmount;

    await bill.save();

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully',
      data: bill
    });
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get billing statistics
// @route   GET /api/bills/stats
// @access  Private
exports.getBillStats = async (req, res) => {
  try {
    const { month, year } = req.query;

    const query = { ...getIsolationFilter(req) };
    if (month) query.month = month;
    if (year) query.year = parseInt(year);

    const totalBills = await Bill.countDocuments(query);
    const paidBills = await Bill.countDocuments({ ...query, status: 'Paid' });
    const unpaidBills = await Bill.countDocuments({ ...query, status: 'Unpaid' });
    const partialBills = await Bill.countDocuments({ ...query, status: 'Partial' });

    // Calculate revenue
    const revenueStats = await Bill.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalPayable: { $sum: '$totalPayable' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: '$remainingBalance' }
        }
      }
    ]);

    const revenue = revenueStats[0] || {
      totalPayable: 0,
      totalPaid: 0,
      totalPending: 0
    };

    res.status(200).json({
      success: true,
      data: {
        totalBills,
        paidBills,
        unpaidBills,
        partialBills,
        ...revenue
      }
    });
  } catch (error) {
    console.error('Get bill stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get monthly revenue trend
// @route   GET /api/bills/revenue-trend
// @access  Private
exports.getRevenueTrend = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    // Isolation filter for aggregate
    const filter = { year: parseInt(year), ...getIsolationFilter(req) };

    if (filter.superAdminId) {
        // Mongoose aggregate needs objectId cast usually if raw? 
        // No, mongoose handles it if passed in match step.
    }

    const trend = await Bill.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$month',
          totalPayable: { $sum: '$totalPayable' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: '$remainingBalance' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: trend
    });
  } catch (error) {
    console.error('Get revenue trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
