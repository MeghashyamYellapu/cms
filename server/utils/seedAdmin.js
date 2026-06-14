require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    // Check if super admin already exists
    const existingAdmin = await Admin.findOne({ role: 'SuperAdmin' });

    if (existingAdmin) {
      console.log('⚠️  Super Admin already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log('   To reset password, delete the admin and run this script again.');
      process.exit(0);
    }

    // Create super admin — default password is intentionally weak for first-boot only
    const superAdmin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@cableoperator.com',
      password: 'Admin@123',
      role: 'SuperAdmin',
      status: 'Active'
    });

    console.log('✅ Super Admin created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log(`   Email: ${superAdmin.email}`);
    console.log('   Password: Admin@123');
    console.log('\n🚨 SECURITY WARNING:');
    console.log('   The default password "Admin@123" is publicly known.');
    console.log('   Log in immediately and change it before putting this system into production.');
    console.log('   Failure to do so will expose your system to unauthorised access.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding super admin:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
