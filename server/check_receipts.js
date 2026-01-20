const mongoose = require('mongoose');
require('dotenv').config();

async function checkReceipts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const prefix = 'RCP2601';
    
    // Get last 5 receipts sorted by receiptId descending
    const payments = await mongoose.connection.db
      .collection('payments')
      .find({ receiptId: { $regex: `^${prefix}` } })
      .sort({ receiptId: -1 })
      .limit(10)
      .toArray();
    
    console.log('\nLast 10 receipts with prefix', prefix + ':');
    payments.forEach(p => console.log(' -', p.receiptId));
    
    // Count total
    const count = await mongoose.connection.db
      .collection('payments')
      .countDocuments({ receiptId: { $regex: `^${prefix}` } });
    
    console.log('\nTotal count:', count);
    console.log('Next receipt should be:', `${prefix}${String(count + 1).padStart(6, '0')}`);
    
    // Check for the problematic receipt
    const problematic = await mongoose.connection.db
      .collection('payments')
      .findOne({ receiptId: 'RCP2601000026' });
    
    if (problematic) {
      console.log('\nProblematic receipt RCP2601000026 EXISTS:');
      console.log(' - Customer:', problematic.customerId);
      console.log(' - Created:', problematic.createdAt);
    } else {
      console.log('\nRCP2601000026 does NOT exist in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkReceipts();
