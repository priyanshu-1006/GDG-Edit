/**
 * Create initial Immerse Super Admin
 * Run: node scripts/createImmerseAdmin.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import ImmerseAdmin from '../models/ImmerseAdmin.js';
import connectDB from '../config/database.js';

const createImmerseAdmin = async () => {
    try {
        await connectDB();

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
            name: 'Immerse Admin',
            email: 'admin@immerse.mmmut.app',
            password: 'Immerse@2026', // Change this after first login!
            role: 'immerse_super_admin',
            isActive: true
        });

        console.log('✅ Immerse Super Admin created successfully!');
        console.log('   Email:', admin.email);
        console.log('   Password: Immerse@2026 (Please change after first login!)');
        console.log('');
        console.log('🔐 Login at: /immerse/login');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createImmerseAdmin();
