import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import connectDB from '../config/database.js';
import User from '../models/User.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createAdminUser = async () => {
  try {
    console.log('🚀 GDG Admin User Creation Script\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get user details
    const name = await question('Enter admin name: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');

    console.log('\nSelect role:');
    console.log('1. event_manager (Can manage events and registrations)');
    console.log('2. admin (Full admin access except user role changes)');
    console.log('3. super_admin (Complete access including role management)');
    const roleChoice = await question('Enter choice (1/2/3): ');

    const roleMap = {
      '1': 'event_manager',
      '2': 'admin',
      '3': 'super_admin'
    };

    const role = roleMap[roleChoice] || 'admin';

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('\n⚠️  User with this email already exists!');
      const update = await question('Do you want to update their role to ' + role + '? (yes/no): ');

      if (update.toLowerCase() === 'yes' || update.toLowerCase() === 'y') {
        existingUser.role = role;
        await existingUser.save();
        console.log('\n✅ User role updated successfully!');
        console.log('📧 Email:', existingUser.email);
        console.log('👤 Name:', existingUser.name);
        console.log('🔑 Role:', existingUser.role);
      } else {
        console.log('\n❌ Operation cancelled');
      }
    } else {
      // Create new admin user
      // Password will be hashed by the User model pre-save hook

      const adminUser = await User.create({
        name,
        email,
        password: password, // Send plain password
        role,
        oauthProvider: 'email',
        emailVerified: true // Auto-verify admin users
      });

      console.log('\n✅ Admin user created successfully!');
      console.log('📧 Email:', adminUser.email);
      console.log('👤 Name:', adminUser.name);
      console.log('🔑 Role:', adminUser.role);
      console.log('\n🔐 You can now login with these credentials');
    }

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from database');
    process.exit(0);
  }
};

createAdminUser();
