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

async function fixUserPassword() {
  try {
    // Get the user email from command line or use a default
    const email = process.argv[2] || 'test@example.com'; // Replace with actual email
    const password = process.argv[3] || 'password123'; // Replace with desired password
    
    console.log(`Looking for user with email: ${email}`);
    
    // Find the user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }
    
    console.log('User found:', user.email);
    console.log('Current password exists:', !!user.password);
    
    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Update the user's password
    user.password = hashedPassword;
    await user.save();
    
    console.log('Password updated successfully!');
    console.log('You can now login with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (error) {
    console.error('Error fixing user password:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run if called directly
if (require.main === module) {
  fixUserPassword();
}
