// Quick script to update admin password
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/database.js';
import User from '../models/User.js';

const updateAdminPassword = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    const email = 'admin@gdg.com';
    const newPassword = 'admin@123';

    let user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('⚠️ User not found. Creating a new Admin user...');
      user = new User({
        name: 'Admin User',
        email,
        role: 'admin',
        oauthProvider: 'email',
        emailVerified: true
      });
    }

    // Set the password directly - the pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    console.log('✅ Password updated successfully!');
    console.log('📧 Email:', email);
    console.log('🔐 New Password:', newPassword);
    
    // Test the password immediately
    const testMatch = await user.comparePassword(newPassword);
    console.log('🧪 Password test:', testMatch ? '✅ PASS' : '❌ FAIL');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

updateAdminPassword();
