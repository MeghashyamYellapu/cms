const mongoose = require('mongoose');
const Admin = require('./server/models/Admin');
const Customer = require('./server/models/Customer');
const Bill = require('./server/models/Bill');
const Payment = require('./server/models/Payment');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const migrateData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Find the Main SuperAdmin (now WebsiteAdmin or the first SuperAdmin)
        // We assume the system was single-tenant until now.
        // We find the user who has the most customers created or just the first created admin.
        const mainAdmin = await Admin.findOne().sort({ createdAt: 1 });
        
        if (!mainAdmin) {
            console.log('No admins found. Exiting.');
            process.exit();
        }

        console.log(`Main Admin ID: ${mainAdmin._id} (${mainAdmin.role})`);
        
        // If main admin is not WebsiteAdmin yet, promote them (safety check)
        if (mainAdmin.role !== 'WebsiteAdmin') {
             console.log('Promoting main admin to WebsiteAdmin...');
             mainAdmin.role = 'WebsiteAdmin';
             await mainAdmin.save();
        }

        const ownerId = mainAdmin._id;

        // 2. Update Legacy Admins (Assign them to Main Admin)
        const admins = await Admin.find({ 
            _id: { $ne: ownerId }, 
            parentId: { $exists: false } // or null
        });

        console.log(`Found ${admins.length} legacy admins to update.`);
        for (const admin of admins) {
            admin.parentId = ownerId;
            await admin.save();
        }

        // 3. Update Customers
        const resultCust = await Customer.updateMany(
            { superAdminId: { $exists: false } },
            { $set: { superAdminId: ownerId } }
        );
        console.log(`Updated ${resultCust.modifiedCount} customers.`);

        // 4. Update Bills
        const resultBills = await Bill.updateMany(
            { superAdminId: { $exists: false } },
            { $set: { superAdminId: ownerId } }
        );
        console.log(`Updated ${resultBills.modifiedCount} bills.`);

        // 5. Update Payments
        const resultPay = await Payment.updateMany(
            { superAdminId: { $exists: false } },
            { $set: { superAdminId: ownerId } }
        );
        console.log(`Updated ${resultPay.modifiedCount} payments.`);

        console.log('Migration Complete.');
        process.exit();
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
};

migrateData();
