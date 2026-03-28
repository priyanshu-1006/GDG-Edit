/**
 * Create initial Immerse Super Admin
 * Run: node scripts/createImmerseAdmin.js
 */

import 'dotenv/config';
import ImmerseAdmin from '../models/ImmerseAdmin.js';
import connectDB from '../config/database.js';

const createImmerseAdmin = async () => {
    try {
        await connectDB();

        const bootstrapEmail = process.env.IMMERSE_BOOTSTRAP_ADMIN_EMAIL;
        const bootstrapPassword = process.env.IMMERSE_BOOTSTRAP_ADMIN_PASSWORD;
        const bootstrapName = process.env.IMMERSE_BOOTSTRAP_ADMIN_NAME || 'Immerse Admin';

        if (!bootstrapEmail || !bootstrapPassword) {
            console.error('❌ Missing bootstrap admin credentials in environment variables.');
            console.error('   Required: IMMERSE_BOOTSTRAP_ADMIN_EMAIL, IMMERSE_BOOTSTRAP_ADMIN_PASSWORD');
            console.error('   Optional: IMMERSE_BOOTSTRAP_ADMIN_NAME');
            process.exit(1);
        }

        // Check if super admin already exists
        const existingAdmin = await ImmerseAdmin.findOne({ role: 'immerse_super_admin' });
        if (existingAdmin) {
            console.log('⚠️ Immerse Super Admin already exists:');
            console.log('   Email:', existingAdmin.email);
            console.log('   Name:', existingAdmin.name);
            process.exit(0);
        }

        // Create super admin
        const admin = await ImmerseAdmin.create({
            name: bootstrapName,
            email: bootstrapEmail,
            password: bootstrapPassword,
            role: 'immerse_super_admin',
            isActive: true
        });

        console.log('✅ Immerse Super Admin created successfully!');
        console.log('   Email:', admin.email);
        console.log('   Password: configured via IMMERSE_BOOTSTRAP_ADMIN_PASSWORD');
        console.log('');
        console.log('🔐 Login at: /immerse/login');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createImmerseAdmin();
