const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const Admin = require('../models/Admin');

// @desc    Public customer lookup by phone number
// @route   POST /api/portal/lookup
// @access  Public
exports.customerLookup = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Validate phone number format
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Find customer by phone number
    const customer = await Customer.findOne({ phoneNumber }).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'No customer found with this phone number'
      });
    }

    // Mask Aadhaar number (show only last 4 digits)
    let maskedAadhaar = 'XXXX-XXXX-XXXX';
    if (customer.aadhaarNumber) {
      try {
        // Aadhaar is encrypted, so we can't show even masked version reliably
        // Just indicate it's on file
        maskedAadhaar = 'XXXX-XXXX-****';
      } catch (e) {
        maskedAadhaar = 'On File';
      }
    }

    // Get recent bills (last 12 months)
    const bills = await Bill.find({ customerId: customer._id })
      .sort({ year: -1, month: -1 })
      .limit(12)
      .lean();

    // Get payment history (last 20 payments)
    const payments = await Payment.find({ customerId: customer._id })
      .sort({ paymentDate: -1 })
      .limit(20)
      .select('receiptId paidAmount paymentMode paymentDate remainingBalance')
      .lean();

    // Prepare response with limited/masked data
    const customerData = {
      customerId: customer.customerId,
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      maskedAadhaar: maskedAadhaar,
      address: customer.address,
      area: customer.area,
      serviceType: customer.serviceType,
      setTopBoxId: customer.setTopBoxId || 'N/A',
      cafId: customer.cafId || 'N/A',
      packageAmount: customer.packageAmount,
      currentBalance: customer.previousBalance,
      status: customer.status,
      joinDate: customer.createdAt
    };

    // Calculate summary
    const summary = {
      totalBills: bills.length,
      paidBills: bills.filter(b => b.status === 'Paid').length,
      unpaidBills: bills.filter(b => b.status === 'Unpaid').length,
      partialBills: bills.filter(b => b.status === 'Partial').length,
      totalOutstanding: bills.reduce((sum, b) => sum + (b.remainingBalance || 0), 0),
      totalPaid: payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0)
    };

    // Fetch Admin Details for Company Info
    let companyDetails = null;
    if (customer.createdBy) {
      const admin = await Admin.findById(customer.createdBy).select('companyDetails parentId');
      
      if (admin) {
        // 1. Try Admin's own details
        if (admin.companyDetails && admin.companyDetails.name) {
          companyDetails = admin.companyDetails;
        } 
        // 2. Try Parent Admin's details (if SuperAdmin)
        else if (admin.parentId) {
          const parentAdmin = await Admin.findById(admin.parentId).select('companyDetails');
          if (parentAdmin && parentAdmin.companyDetails && parentAdmin.companyDetails.name) {
            companyDetails = parentAdmin.companyDetails;
          }
        }
      }
    }

    // Default company details if none found
    if (!companyDetails) {
      companyDetails = {
        name: 'Cable Service Provider',
        phone: '',
        email: '',
        address: ''
      };
    }

    res.status(200).json({
      success: true,
      data: {
        customer: customerData,
        company: companyDetails,
        bills: bills.map(b => ({
          month: b.month,
          year: b.year,
          packageAmount: b.packageAmount,
          previousBalance: b.previousBalance,
          totalPayable: b.totalPayable,
          paidAmount: b.paidAmount,
          remainingBalance: b.remainingBalance,
          status: b.status,
          generatedAt: b.generatedAt
        })),
        payments: payments.map(p => ({
          receiptId: p.receiptId,
          amount: p.paidAmount,
          mode: p.paymentMode,
          date: p.paymentDate,
          remainingAfter: p.remainingBalance
        })),
        summary
      }
    });

  } catch (error) {
    console.error('Customer lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// @desc    Get customer bill details for payment
// @route   POST /api/portal/bill/:billId
// @access  Public (but requires phone verification)
exports.getBillDetails = async (req, res) => {
  try {
    const { billId } = req.params;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone verification required'
      });
    }

    const bill = await Bill.findById(billId).populate('customerId', 'name phoneNumber customerId');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Verify phone number matches
    if (bill.customerId.phoneNumber !== phoneNumber) {
      return res.status(403).json({
        success: false,
        message: 'Phone number does not match bill owner'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        billId: bill._id,
        customerName: bill.customerId.name,
        customerId: bill.customerId.customerId,
        month: bill.month,
        year: bill.year,
        packageAmount: bill.packageAmount,
        previousBalance: bill.previousBalance,
        totalPayable: bill.totalPayable,
        paidAmount: bill.paidAmount,
        remainingBalance: bill.remainingBalance,
        status: bill.status
      }
    });

  } catch (error) {
    console.error('Get bill details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
