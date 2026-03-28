// Test login credentials
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import User from '../models/User.js';

const testLogin = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    const [, , emailArg, passwordArg] = process.argv;
    const email = emailArg || process.env.TEST_LOGIN_EMAIL;
    const password = passwordArg || process.env.TEST_LOGIN_PASSWORD;

    if (!email || !password) {
      console.log('Usage: node scripts/testLogin.js <email> <password>');
      console.log('Or set env vars: TEST_LOGIN_EMAIL, TEST_LOGIN_PASSWORD');
      process.exit(1);
    }

    console.log('🧪 Testing login credentials...');
    console.log('📧 Email:', email);
    console.log('🔐 Password: [hidden]');
    console.log('');

    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found');
    console.log('👤 Name:', user.name);
    console.log('🔑 Role:', user.role);
    console.log('📧 Email verified:', user.emailVerified);
    console.log('🔒 Has password:', !!user.password);
    console.log('');

    // Test password
    const isMatch = await user.comparePassword(password);
    
    if (isMatch) {
      console.log('✅✅✅ PASSWORD CORRECT! ✅✅✅');
      console.log('\nYou can now login with:');
      console.log('Email:', email);
      console.log('Password: [the one you provided]');
    } else {
      console.log('❌❌❌ PASSWORD INCORRECT! ❌❌❌');
      console.log('\nTrying to reset password...');
      
      user.password = password;
      await user.save();
      
      // Test again
      const userUpdated = await User.findOne({ email }).select('+password');
      const isMatchNow = await userUpdated.comparePassword(password);
      
      if (isMatchNow) {
        console.log('✅ Password reset successful!');
        console.log('You can now login with:');
        console.log('Email:', email);
        console.log('Password: [the one you provided]');
      } else {
        console.log('❌ Password reset failed!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

testLogin();
