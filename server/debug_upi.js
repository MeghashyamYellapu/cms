const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
console.log('Connecting to MongoDB...');

mongoose.connect(MONGO_URI).then(async () => {
  const Admin = require('./models/Admin');
  const Settings = require('./models/Settings');
  const Customer = require('./models/Customer');
  
  console.log('=== ADMINS UPI SETTINGS ===');
  const admins = await Admin.find({}).select('name role upiSettings companyDetails');
  admins.forEach(a => {
    console.log(`\n${a.name} (${a.role}):`);
    console.log('  upiSettings:', JSON.stringify(a.upiSettings));
    console.log('  companyDetails:', a.companyDetails?.name || 'Not set');
  });
  
  console.log('\n=== GLOBAL SETTINGS ===');
  const settings = await Settings.findOne();
  console.log('upiEnabled:', settings?.upiEnabled);
  console.log('upiId:', settings?.upiId);
  
  console.log('\n=== CUSTOMER MEGGI ===');
  const customer = await Customer.findOne({ name: /meggi/i }).populate('createdBy', 'name role upiSettings');
  if (customer) {
    console.log('Customer:', customer.name);
    console.log('Phone:', customer.phoneNumber);
    console.log('Balance:', customer.previousBalance);
    console.log('Created By:', customer.createdBy?.name, '(' + customer.createdBy?.role + ')');
    console.log('Admin UPI Settings:', JSON.stringify(customer.createdBy?.upiSettings));
  } else {
    console.log('Customer meggi not found');
  }
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
