/**
 * Seed GDG Admin Users
 * Run: node scripts/seedAdmins.js
 * 
 * Creates admin users with different roles:
 * - super_admin: Full system access
 * - admin: User management + everything except super admin functions
 * - event_manager: Event and registration management
 *
 * Preset mode requires these env vars:
 * - GDG_PRESET_SUPER_ADMIN_PASSWORD
 * - GDG_PRESET_ADMIN_PASSWORD
 * - GDG_PRESET_EVENT_MANAGER_PASSWORD
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/database.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const getRequiredEnv = (name) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const seedAdmins = async () => {
  try {
    console.log('\n🌱 GDG Admin User Seeding\n');
    
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Option to seed preset admins
    const usePreset = await question('Seed preset admin accounts? (yes/no): ');
    
    if (usePreset.toLowerCase() === 'yes' || usePreset.toLowerCase() === 'y') {
      await seedPresetAdmins();
    } else {
      await seedCustomAdmin();
    }

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admins:', error);
    rl.close();
    process.exit(1);
  }
};

const seedPresetAdmins = async () => {
  let superAdminPassword;
  let adminPassword;
  let eventManagerPassword;

  try {
    superAdminPassword = getRequiredEnv('GDG_PRESET_SUPER_ADMIN_PASSWORD');
    adminPassword = getRequiredEnv('GDG_PRESET_ADMIN_PASSWORD');
    eventManagerPassword = getRequiredEnv('GDG_PRESET_EVENT_MANAGER_PASSWORD');
  } catch (error) {
    console.error('❌ Preset admin seeding aborted:', error.message);
    console.log('\nSet required env vars and rerun:');
    console.log('  GDG_PRESET_SUPER_ADMIN_PASSWORD');
    console.log('  GDG_PRESET_ADMIN_PASSWORD');
    console.log('  GDG_PRESET_EVENT_MANAGER_PASSWORD\n');
    throw error;
  }

  const presetAdmins = [
    {
      name: 'GDG Super Admin',
      email: 'superadmin@gdg.mmmut.app',
      password: superAdminPassword,
      passwordEnvVar: 'GDG_PRESET_SUPER_ADMIN_PASSWORD',
      role: 'super_admin'
    },
    {
      name: 'GDG Admin',
      email: 'admin@gdg.mmmut.app',
      password: adminPassword,
      passwordEnvVar: 'GDG_PRESET_ADMIN_PASSWORD',
      role: 'admin'
    },
    {
      name: 'Event Manager',
      email: 'eventmanager@gdg.mmmut.app',
      password: eventManagerPassword,
      passwordEnvVar: 'GDG_PRESET_EVENT_MANAGER_PASSWORD',
      role: 'event_manager'
    }
  ];

  for (const adminData of presetAdmins) {
    try {
      const existingUser = await User.findOne({ email: adminData.email });
      
      if (existingUser) {
        existingUser.name = adminData.name;
        existingUser.role = adminData.role;
        existingUser.password = adminData.password;
        existingUser.oauthProvider = 'email';
        existingUser.emailVerified = true;
        existingUser.isApproved = true;
        await existingUser.save();
        console.log(`♻️  ${adminData.role.toUpperCase()} repaired/updated: ${adminData.email}`);
        continue;
      }

      const admin = await User.create({
        name: adminData.name,
        email: adminData.email,
        password: adminData.password,
        role: adminData.role,
        oauthProvider: 'email',
        emailVerified: true,
        isApproved: true
      });

      console.log(`✅ ${adminData.role.toUpperCase()} created`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: configured via ${adminData.passwordEnvVar}\n`);
    } catch (error) {
      console.error(`❌ Error creating ${adminData.role}:`, error.message);
    }
  }

  console.log('\n📝 Preset Admins Summary:');
  console.log('════════════════════════════════════════');
  console.log('🏆 Super Admin Portal (/super-admin)');
  console.log('   Email: superadmin@gdg.mmmut.app');
  console.log('   Password: configured via GDG_PRESET_SUPER_ADMIN_PASSWORD');
  console.log('   Roles: Users, Events, Registrations, Emails, Certificates, Teams, Analytics, Settings');
  console.log('\n👨‍💼 Admin Portal (/admin)');
  console.log('   Email: admin@gdg.mmmut.app');
  console.log('   Password: configured via GDG_PRESET_ADMIN_PASSWORD');
  console.log('   Roles: Events, Registrations, Emails, Certificates, Teams, Analytics, Settings');
  console.log('\n📅 Event Manager Portal (/event-manager)');
  console.log('   Email: eventmanager@gdg.mmmut.app');
  console.log('   Password: configured via GDG_PRESET_EVENT_MANAGER_PASSWORD');
  console.log('   Roles: Events, Registrations');
  console.log('════════════════════════════════════════\n');

  console.log('🔐 Login Flow:');
  console.log('1. Go to: /admin/login (or /super-admin/login or /event-manager/login)');
  console.log('2. Enter email and password from above');
  console.log('3. Enter OTP sent to your email');
  console.log('4. You will be logged in\n');

  console.log('⚠️  IMPORTANT:');
  console.log('   - OTP is required for every login');
  console.log('   - OTP expires in 2 minutes');
  console.log('   - Change passwords immediately on first login!');
  console.log('   - Check spam folder if email not received\n');
};

const seedCustomAdmin = async () => {
  console.log('\nCreating custom admin user...\n');

  const name = await question('Enter admin name: ');
  const email = await question('Enter admin email: ');
  const password = await question('Enter admin password: ');

  console.log('\nSelect role:');
  console.log('1. super_admin (Full access, user management)');
  console.log('2. admin (Full access except user role changes)');
  console.log('3. event_manager (Events & registrations only)');
  const roleChoice = await question('Enter choice (1/2/3): ');

  const roleMap = {
    '1': 'super_admin',
    '2': 'admin',
    '3': 'event_manager'
  };

  const role = roleMap[roleChoice] || 'admin';

  try {
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      const update = await question(`User with ${email} already exists. Update role to ${role}? (yes/no): `);
      
      if (update.toLowerCase() === 'yes' || update.toLowerCase() === 'y') {
        existingUser.name = name || existingUser.name;
        existingUser.role = role;
        existingUser.password = password;
        existingUser.oauthProvider = 'email';
        existingUser.emailVerified = true;
        existingUser.isApproved = true;
        await existingUser.save();
        console.log(`\n✅ User updated to ${role} with password login enabled`);
      }
      return;
    }

    const admin = await User.create({
      name,
      email,
      password,
      role,
      oauthProvider: 'email',
      emailVerified: true,
      isApproved: true
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📝 Details:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log('\n🔐 Login Instructions:');
    console.log(`1. Go to: /admin/login`);
    console.log(`2. Enter email: ${admin.email}`);
    console.log('3. Enter the password you provided during setup');
    console.log('4. Enter OTP from your email');
    console.log('5. Access admin dashboard\n');
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
};

seedAdmins();
