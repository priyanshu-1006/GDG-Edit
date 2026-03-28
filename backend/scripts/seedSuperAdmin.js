/**
 * Seed Immerse Super Admin with credentials
 * Run: node scripts/seedSuperAdmin.js
 *
 * Required env vars:
 * - IMMERSE_SUPER_ADMIN_EMAIL
 * - IMMERSE_SUPER_ADMIN_PASSWORD
 *
 * Optional env var:
 * - IMMERSE_SUPER_ADMIN_NAME
 */

import 'dotenv/config';
import ImmerseAdmin from '../models/ImmerseAdmin.js';
import connectDB from '../config/database.js';

const seedSuperAdmin = async () => {
    try {
        console.log('\n🌱 Seeding Immerse Super Admin...\n');
        
        await connectDB();

        const superAdminEmail = process.env.IMMERSE_SUPER_ADMIN_EMAIL;
        const superAdminPassword = process.env.IMMERSE_SUPER_ADMIN_PASSWORD;
        const superAdminName = process.env.IMMERSE_SUPER_ADMIN_NAME || 'Super Admin';

        if (!superAdminEmail || !superAdminPassword) {
            console.error('❌ Missing required environment variables.');
            console.error('   Required: IMMERSE_SUPER_ADMIN_EMAIL, IMMERSE_SUPER_ADMIN_PASSWORD');
            process.exit(1);
        }

        // Check if super admin already exists
        const existingAdmin = await ImmerseAdmin.findOne({ 
            email: superAdminEmail 
        });

        if (existingAdmin) {
            console.log('⚠️  Super Admin already exists!');
            console.log('   Email:', existingAdmin.email);
            console.log('   Name:', existingAdmin.name);
            console.log('   Role:', existingAdmin.role);
            console.log('   Active:', existingAdmin.isActive);
            console.log('\n💡 To create a different admin, modify the email in the script.');
            process.exit(0);
        }

        // Create super admin
        const admin = await ImmerseAdmin.create({
            name: superAdminName,
            email: superAdminEmail,
            password: superAdminPassword,
            role: 'immerse_super_admin',
            isActive: true
        });

        console.log('✅ Super Admin created successfully!\n');
        console.log('📝 Credentials:');
        console.log(`   Email: ${admin.email}`);
        console.log('   Password: configured via IMMERSE_SUPER_ADMIN_PASSWORD');
        console.log(`   Role: ${admin.role}`);
        console.log(`   Active: ${admin.isActive}`);
        console.log('\n🔐 Login Details:');
        console.log('   1. Go to: /immerse/login');
        console.log('   2. Enter email and password');
        console.log('   3. Enter OTP sent to your email');
        console.log('   4. You will be logged in\n');
        console.log('⚠️  Important Notes:');
        console.log('   - OTP is required for every login');
        console.log('   - OTP expires in 2 minutes');
        console.log('   - Check spam folder if email not received\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding super admin:', error);
        console.error('\n🔧 Troubleshooting:');
        console.error('   - Check MongoDB connection');
        console.error('   - Ensure .env file is configured');
        console.error('   - Check MONGODB_URI variable\n');
        process.exit(1);
    }
};

seedSuperAdmin();
