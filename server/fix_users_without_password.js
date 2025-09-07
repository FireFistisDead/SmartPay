const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartpay', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Import User model
const User = require('./src/models/User');

async function fixUsersWithoutPassword() {
  try {
    console.log('Looking for users without passwords...');
    
    // Find users without passwords
    const users = await User.find({ 
      email: { $exists: true, $ne: null },
      password: { $exists: false }
    }).limit(5);
    
    console.log(`Found ${users.length} users without passwords:`);
    
    for (const user of users) {
      console.log(`- Email: ${user.email}, ID: ${user._id}`);
    }
    
    if (users.length > 0) {
      const firstUser = users[0];
      const defaultPassword = 'password123';
      
      console.log(`\nAdding password to user: ${firstUser.email}`);
      
      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
      
      // Update the user's password
      await User.findByIdAndUpdate(firstUser._id, { 
        password: hashedPassword 
      });
      
      console.log('Password added successfully!');
      console.log(`Email: ${firstUser.email}`);
      console.log(`Password: ${defaultPassword}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run if called directly
if (require.main === module) {
  fixUsersWithoutPassword();
}
