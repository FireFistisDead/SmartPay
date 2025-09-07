const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Drop the problematic address index
    try {
      await usersCollection.dropIndex('address_1');
      console.log('Dropped address_1 index');
    } catch (error) {
      console.log('Index may not exist:', error.message);
    }

    // Create a new sparse unique index for address
    await usersCollection.createIndex(
      { address: 1 }, 
      { 
        unique: true, 
        sparse: true, // This allows multiple null values
        name: 'address_sparse_unique'
      }
    );
    console.log('Created new sparse unique index for address');

    // List all indexes to verify
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    console.log('Database fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database fix failed:', error);
    process.exit(1);
  }
}

fixDatabase();
