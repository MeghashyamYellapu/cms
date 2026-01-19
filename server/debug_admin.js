const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Admin = require('./models/Admin');
const Bill = require('./models/Bill');
const Payment = require('./models/Payment');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.MONGODB_URI) {
    // try default location
    dotenv.config();
}

console.log('Connecting to DB...');

const debug = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // Find latest admin
    const admin = await Admin.findOne().sort({ createdAt: -1 });
    
    if (!admin) {
        console.log('No admins found.');
        return;
    }

    console.log('Latest Admin Created:', {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        parentId: admin.parentId,
        createdAt: admin.createdAt
    });

    if (admin.role === 'Admin') {
        if (!admin.parentId) {
            console.error('⚠️ WARNING: Admin has NO parentId. Isolation filter will be empty (access all OR access none?). Context: logic uses parentId as superAdminId.');
            
            // This is likely the bug. If parentId is null, filter is {}.
            // Why would query fail?
            
            // Let's try to query bills with empty filter
            const count = await Bill.countDocuments({});
            console.log('Total bills in system:', count);
        } else {
            console.log('Admin has valid parentId:', admin.parentId);
            
            // Check isolating query
            const filter = { superAdminId: admin.parentId };
            try {
                const bills = await Bill.find(filter).limit(5);
                console.log(`Querying bills for superAdminId ${admin.parentId}... Found ${bills.length}`);
            } catch (e) {
                console.error('ERROR Querying bills:', e);
            }
        }
    } else {
        console.log('Latest admin is NOT role "Admin". Role is:', admin.role);
    }

  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

debug();
