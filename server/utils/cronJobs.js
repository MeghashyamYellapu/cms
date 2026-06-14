const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const Customer = require('../models/Customer');
const Bill = require('../models/Bill');

/**
 * Initialize cron jobs
 */
exports.initCronJobs = () => {
  // Run on 1st of every month at 00:01 AM
  const billingDay = process.env.BILLING_DAY || 1;
  const cronExpression = `1 0 ${billingDay} * *`;

  console.log(`📅 Scheduling monthly billing cron job: ${cronExpression}`);

  cron.schedule(cronExpression, async () => {
    console.log('🔄 Running automated monthly billing...');
    
    try {
      const now = new Date();
      const month = now.toLocaleString('en-US', { month: 'long' });
      const year = now.getFullYear();

      console.log(`Generating bills for ${month} ${year}`);

      // Get all active customers with their ownership fields
      const customers = await Customer.find({ status: 'Active' }).select('+createdBy +superAdminId');
      
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const customer of customers) {
        try {
          // Check if bill already exists
          const existingBill = await Bill.findOne({
            customerId: customer._id,
            month,
            year
          });

          if (existingBill) {
            skippedCount++;
            continue;
          }

          // Calculate total payable
          const totalPayable = customer.packageAmount + customer.previousBalance;

          // Create bill — stamp with customer's ownership so it appears in the right admin's view
          await Bill.create({
            customerId: customer._id,
            month,
            year,
            packageAmount: customer.packageAmount,
            previousBalance: customer.previousBalance,
            totalPayable,
            generatedBy: customer.createdBy,
            superAdminId: customer.superAdminId
          });

          // Update customer's outstanding balance to include this new bill amount
          customer.previousBalance = (customer.previousBalance || 0) + customer.packageAmount;
          await customer.save();

          successCount++;
        } catch (error) {
          console.error(`Error generating bill for customer ${customer.customerId}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Monthly billing completed:`);
      console.log(`   - Total customers: ${customers.length}`);
      console.log(`   - Bills created: ${successCount}`);
      console.log(`   - Skipped: ${skippedCount}`);
      console.log(`   - Errors: ${errorCount}`);
    } catch (error) {
      console.error('❌ Automated billing error:', error);
    }
  });

  // Purge receipt files older than 30 days — runs daily at 02:00 AM
  cron.schedule('0 2 * * *', () => {
    try {
      const receiptsDir = path.join(__dirname, '../receipts');
      if (!fs.existsSync(receiptsDir)) return;

      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      let purged = 0;
      for (const file of fs.readdirSync(receiptsDir)) {
        const filePath = path.join(receiptsDir, file);
        try {
          const { mtimeMs } = fs.statSync(filePath);
          if (mtimeMs < cutoff) {
            fs.unlinkSync(filePath);
            purged++;
          }
        } catch (e) {
          console.error(`Failed to delete receipt file ${file}:`, e.message);
        }
      }
      if (purged > 0) console.log(`🗑️  Purged ${purged} receipt file(s) older than 30 days`);
    } catch (error) {
      console.error('Receipt cleanup error:', error);
    }
  });

  console.log('✅ Cron jobs initialized');
};

/**
 * Manual trigger for monthly billing (for testing)
 */
exports.triggerMonthlyBilling = async () => {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();

  const customers = await Customer.find({ status: 'Active' }).select('+createdBy +superAdminId');

  const results = {
    success: [],
    errors: [],
    skipped: []
  };

  for (const customer of customers) {
    try {
      const existingBill = await Bill.findOne({
        customerId: customer._id,
        month,
        year
      });

      if (existingBill) {
        results.skipped.push({
          customerId: customer.customerId,
          name: customer.name
        });
        continue;
      }

      const totalPayable = customer.packageAmount + customer.previousBalance;

      const bill = await Bill.create({
        customerId: customer._id,
        month,
        year,
        packageAmount: customer.packageAmount,
        previousBalance: customer.previousBalance,
        totalPayable,
        generatedBy: customer.createdBy,
        superAdminId: customer.superAdminId
      });

      results.success.push({
        customerId: customer.customerId,
        name: customer.name,
        billId: bill._id
      });
    } catch (error) {
      results.errors.push({
        customerId: customer.customerId,
        name: customer.name,
        error: error.message
      });
    }
  }

  return results;
};
