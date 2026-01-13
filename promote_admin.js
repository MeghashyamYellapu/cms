const mongoose = require('mongoose');
const Admin = require('./server/models/Admin');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const promoteToWebsiteAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find the first SuperAdmin
        const admin = await Admin.findOne({ role: 'SuperAdmin' });

        if (!admin) {
            console.log('No SuperAdmin found to promote.');
            // Try finding any admin
            const anyAdmin = await Admin.findOne();
            if (anyAdmin) {
                anyAdmin.role = 'WebsiteAdmin';
                await anyAdmin.save();
                console.log(`Promoted ${anyAdmin.email} to WebsiteAdmin`);
            } else {
                console.log('No admins found at all.');
            }
        } else {
            admin.role = 'WebsiteAdmin';
            await admin.save();
            console.log(`Promoted SuperAdmin ${admin.email} to WebsiteAdmin`);
        }

        process.exit();
    } catch (error) {
        console.error('Error promoting admin:', error);
        process.exit(1);
    }
};

promoteToWebsiteAdmin();
