// Script to drop old unique indexes and create new compound indexes
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const customersCollection = db.collection('customers');
        
        // List current indexes
        console.log('\n=== CURRENT INDEXES ===');
        const indexes = await customersCollection.indexes();
        console.log(JSON.stringify(indexes, null, 2));
        
        // Drop problematic unique indexes on customerId and phoneNumber (if they exist as standalone)
        console.log('\n=== DROPPING OLD INDEXES ===');
        
        try {
            await customersCollection.dropIndex('customerId_1');
            console.log('Dropped customerId_1 index');
        } catch (e) {
            console.log('customerId_1 index not found or already dropped');
        }
        
        try {
            await customersCollection.dropIndex('phoneNumber_1');
            console.log('Dropped phoneNumber_1 index');
        } catch (e) {
            console.log('phoneNumber_1 index not found or already dropped');
        }
        
        // Create new compound indexes for isolation
        console.log('\n=== CREATING NEW COMPOUND INDEXES ===');
        
        try {
            await customersCollection.createIndex(
                { customerId: 1, createdBy: 1 }, 
                { unique: true, name: 'customerId_createdBy_unique' }
            );
            console.log('Created customerId_createdBy_unique index');
        } catch (e) {
            console.log('customerId_createdBy index error:', e.message);
        }
        
        try {
            await customersCollection.createIndex(
                { phoneNumber: 1, createdBy: 1 }, 
                { unique: true, name: 'phoneNumber_createdBy_unique' }
            );
            console.log('Created phoneNumber_createdBy_unique index');
        } catch (e) {
            console.log('phoneNumber_createdBy index error:', e.message);
        }
        
        // Show final indexes
        console.log('\n=== FINAL INDEXES ===');
        const finalIndexes = await customersCollection.indexes();
        console.log(JSON.stringify(finalIndexes, null, 2));
        
        console.log('\n✅ Index migration complete!');
        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        mongoose.disconnect();
    }
};

fixIndexes();
