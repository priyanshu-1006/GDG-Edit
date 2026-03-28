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

    const [, , emailArg, passwordArg, roleArg] = process.argv;
    const email = emailArg || process.env.ADMIN_EMAIL_TO_UPDATE;
    const newPassword = passwordArg || process.env.ADMIN_NEW_PASSWORD;
    const role = roleArg || 'admin';

    if (!email || !newPassword) {
      console.log('Usage: node scripts/updatePassword.js <email> <newPassword> [role]');
      console.log('Or set env vars: ADMIN_EMAIL_TO_UPDATE, ADMIN_NEW_PASSWORD');
      process.exit(1);
    }

    let user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('⚠️ User not found. Creating a new Admin user...');
      user = new User({
        name: 'Admin User',
        email,
        role,
        oauthProvider: 'email',
        emailVerified: true
      });
    }

    // Set the password directly - the pre-save hook will hash it
    user.password = newPassword;
    user.oauthProvider = 'email';
    user.emailVerified = true;
    if (role) user.role = role;
    await user.save();

    console.log('✅ Password updated successfully!');
    console.log('📧 Email:', email);
    console.log('🔐 New Password: [hidden]');
    console.log('🔑 Role:', user.role);
    
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
