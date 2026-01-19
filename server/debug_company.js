// Debug script to check Admin company details in database
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Admin = require('./models/Admin');

const checkAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const admins = await Admin.find({}).select('name email role companyDetails parentId');
        
        console.log('\n=== ALL ADMINS ===');
        admins.forEach(admin => {
            console.log(`\nAdmin: ${admin.name} (${admin.email})`);
            console.log(`  Role: ${admin.role}`);
            console.log(`  Parent ID: ${admin.parentId || 'None'}`);
            console.log(`  Company Details:`, JSON.stringify(admin.companyDetails, null, 4));
        });
        
        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkAdmins();
