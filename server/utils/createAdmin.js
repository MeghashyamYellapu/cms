require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Get admin details
    console.log('📝 Create New Admin Account\n');
    
    const name = await question('Enter name: ');
    const email = await question('Enter email: ');
    const password = await question('Enter password: ');
    const roleInput = await question('Enter role (Admin/SuperAdmin) [Admin]: ');
    const role = roleInput || 'Admin';

    // Validate inputs
    if (!name || !email || !password) {
      console.error('\n❌ Error: Name, email, and password are required');
      process.exit(1);
    }

    if (!['Admin', 'SuperAdmin'].includes(role)) {
      console.error('\n❌ Error: Role must be either "Admin" or "SuperAdmin"');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.error(`\n❌ Error: Admin with email "${email}" already exists`);
      process.exit(1);
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password,
      role,
      status: 'Active'
    });

    console.log('\n✅ Admin created successfully!\n');
    console.log('📧 Login Credentials:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}\n`);
    console.log('🔐 You can now login with these credentials!');
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    rl.close();
    process.exit(1);
  }
};

createAdmin();
