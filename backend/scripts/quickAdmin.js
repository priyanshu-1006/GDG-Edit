import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/database.js';
import User from '../models/User.js';

/**
 * Quick Admin User Creator
 * Usage: node scripts/quickAdmin.js "Name" "email@example.com" "password" "role"
 * Example: node scripts/quickAdmin.js "Admin User" "admin@gdg.com" "admin123" "super_admin"
 * 
 * Roles: event_manager, admin, super_admin
 */

const createQuickAdmin = async () => {
  try {
    const [, , name, email, password, role = 'admin'] = process.argv;

    if (!name || !email || !password) {
      console.log('❌ Missing required arguments!\n');
      console.log('Usage: node scripts/quickAdmin.js "Name" "email@example.com" "password" "role"\n');
      console.log('Example: node scripts/quickAdmin.js "Admin User" "admin@gdg.com" "admin123" "super_admin"\n');
      console.log('Roles: event_manager, admin, super_admin (default: admin)');
      process.exit(1);
    }

    // Validate role
    const validRoles = ['event_manager', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      console.log(`❌ Invalid role: ${role}`);
      console.log('Valid roles:', validRoles.join(', '));
      process.exit(1);
    }

    console.log('🚀 Creating admin user...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('⚠️  User already exists. Updating role...\n');
      existingUser.role = role;
      existingUser.emailVerified = true;
      await existingUser.save();

      console.log('✅ User updated successfully!');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Name:', existingUser.name);
      console.log('🔑 Role:', existingUser.role);
    } else {
      // Create admin user
      // Password will be hashed by the User model
      const adminUser = await User.create({
        name,
        email,
        password: password,
        role,
        oauthProvider: 'email',
        emailVerified: true
      });

      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', adminUser.email);
      console.log('👤 Name:', adminUser.name);
      console.log('🔑 Role:', adminUser.role);
    }

    console.log('\n🔐 Login credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Done!');
    process.exit(0);
  }
};

createQuickAdmin();
