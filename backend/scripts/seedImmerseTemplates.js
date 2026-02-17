/**
 * Seed default email templates for Immerse
 * Run: node scripts/seedImmerseTemplates.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import ImmerseEmailTemplate from '../models/ImmerseEmailTemplate.js';
import ImmerseAdmin from '../models/ImmerseAdmin.js';
import connectDB from '../config/database.js';

const templates = [
    {
        name: 'Sponsor Outreach - Initial',
        subject: 'Partnership Opportunity - IMMERSE 2026 | MMMUT',
        category: 'sponsor',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4285F4, #34A853); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #e8f4fd; padding: 15px; border-left: 4px solid #4285F4; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .btn { display: inline-block; background: #4285F4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IMMERSE 2026</h1>
            <p style="color: white; margin: 10px 0 0;">Madan Mohan Malaviya University of Technology</p>
        </div>
        <div class="content">
            <p>Dear {{name}},</p>
            
            <p>Greetings from <strong>IMMERSE 2026</strong> – the flagship tech fest of MMMUT, Gorakhpur!</p>
            
            <p>We are reaching out to explore a potential partnership between <strong>{{companyName}}</strong> and IMMERSE 2026, our annual technology festival that brings together over 5,000+ participants from across India.</p>
            
            <div class="highlight">
                <strong>🎯 Why Partner with IMMERSE?</strong>
                <ul>
                    <li>5000+ engaged tech enthusiasts</li>
                    <li>50+ colleges participation</li>
                    <li>Direct access to top engineering talent</li>
                    <li>Brand visibility across Eastern UP</li>
                </ul>
            </div>
            
            <p>We would love to discuss how {{companyName}} can benefit from this partnership while helping us create an unforgettable experience for students.</p>
            
            <p>Would you be available for a brief call this week to explore this opportunity?</p>
            
            <p>Best Regards,<br>
            <strong>Team IMMERSE 2026</strong><br>
            MMMUT, Gorakhpur</p>
        </div>
        <div class="footer">
            <p>IMMERSE 2026 | MMMUT, Gorakhpur | immerse.mmmut.app</p>
        </div>
    </div>
</body>
</html>
        `,
        variables: ['name', 'companyName'],
        previewText: 'Partnership opportunity with IMMERSE 2026 - MMMUT'
    },
    {
        name: 'Sponsor Follow Up',
        subject: 'Following Up - IMMERSE 2026 Partnership',
        category: 'follow_up',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4285F4; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="color: white; margin: 0;">IMMERSE 2026</h2>
        </div>
        <div class="content">
            <p>Dear {{name}},</p>
            
            <p>I hope this email finds you well. I wanted to follow up on my previous email regarding the partnership opportunity with IMMERSE 2026.</p>
            
            <p>We believe {{companyName}} would be an excellent partner for our tech fest, and we'd love to discuss this further at your convenience.</p>
            
            <p>Please let me know if you'd like to schedule a call or if you need any additional information about the event.</p>
            
            <p>Looking forward to hearing from you.</p>
            
            <p>Best Regards,<br>
            <strong>Team IMMERSE 2026</strong></p>
        </div>
        <div class="footer">
            <p>IMMERSE 2026 | MMMUT, Gorakhpur</p>
        </div>
    </div>
</body>
</html>
        `,
        variables: ['name', 'companyName'],
        previewText: 'Following up on our partnership discussion'
    },
    {
        name: 'Student Registration Confirmation',
        subject: '🎉 Registration Confirmed - IMMERSE 2026',
        category: 'confirmation',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #34A853, #4285F4); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .ticket { background: white; border: 2px dashed #4285F4; padding: 20px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 You're In!</h1>
            <p style="color: white;">IMMERSE 2026</p>
        </div>
        <div class="content">
            <p>Hi {{name}},</p>
            
            <p>Congratulations! Your registration for <strong>IMMERSE 2026</strong> has been confirmed.</p>
            
            <div class="ticket">
                <h3 style="color: #4285F4; margin: 0;">Registration Details</h3>
                <p><strong>Name:</strong> {{name}}</p>
                <p><strong>College:</strong> {{college}}</p>
                <p><strong>Registration ID:</strong> {{registrationId}}</p>
            </div>
            
            <p>Get ready for an amazing experience filled with workshops, competitions, and networking opportunities!</p>
            
            <p>Stay tuned for updates and event schedules.</p>
            
            <p>See you at IMMERSE 2026! 🚀</p>
            
            <p>Best,<br>
            <strong>Team IMMERSE</strong></p>
        </div>
        <div class="footer">
            <p>IMMERSE 2026 | MMMUT, Gorakhpur | immerse.mmmut.app</p>
        </div>
    </div>
</body>
</html>
        `,
        variables: ['name', 'college', 'registrationId'],
        previewText: 'Your IMMERSE 2026 registration is confirmed!'
    },
    {
        name: 'Event Reminder',
        subject: '⏰ Reminder: IMMERSE 2026 is Coming!',
        category: 'reminder',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FBBC04; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .countdown { background: white; padding: 20px; margin: 20px 0; text-align: center; border-radius: 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #333; margin: 0;">⏰ Event Reminder</h1>
        </div>
        <div class="content">
            <p>Hi {{name}},</p>
            
            <p>This is a friendly reminder that <strong>IMMERSE 2026</strong> is just around the corner!</p>
            
            <div class="countdown">
                <h2 style="color: #4285F4;">{{eventDate}}</h2>
                <p>at MMMUT, Gorakhpur</p>
            </div>
            
            <p><strong>What to bring:</strong></p>
            <ul>
                <li>Your college ID</li>
                <li>Registration confirmation</li>
                <li>Laptop (for workshops)</li>
                <li>Enthusiasm! 🎉</li>
            </ul>
            
            <p>See you soon!</p>
            
            <p>Best,<br>
            <strong>Team IMMERSE</strong></p>
        </div>
        <div class="footer">
            <p>IMMERSE 2026 | MMMUT, Gorakhpur</p>
        </div>
    </div>
</body>
</html>
        `,
        variables: ['name', 'eventDate'],
        previewText: 'IMMERSE 2026 is coming soon!'
    },
    {
        name: 'General Announcement',
        subject: '📢 Important Update - IMMERSE 2026',
        category: 'general',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4285F4; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0;">📢 Announcement</h1>
            <p style="color: white;">IMMERSE 2026</p>
        </div>
        <div class="content">
            <p>Dear {{name}},</p>
            
            {{content}}
            
            <p>For more updates, visit <a href="https://immerse.mmmut.app">immerse.mmmut.app</a></p>
            
            <p>Best Regards,<br>
            <strong>Team IMMERSE 2026</strong></p>
        </div>
        <div class="footer">
            <p>IMMERSE 2026 | MMMUT, Gorakhpur | immerse.mmmut.app</p>
        </div>
    </div>
</body>
</html>
        `,
        variables: ['name', 'content'],
        previewText: 'Important update from IMMERSE 2026'
    }
];

const seedTemplates = async () => {
    try {
        await connectDB();

        // Get admin for createdBy
        const admin = await ImmerseAdmin.findOne({ role: 'immerse_super_admin' });

        for (const template of templates) {
            const existing = await ImmerseEmailTemplate.findOne({ name: template.name });
            if (existing) {
                console.log(`⏭️ Template "${template.name}" already exists, skipping...`);
                continue;
            }

            await ImmerseEmailTemplate.create({
                ...template,
                createdBy: admin?._id
            });
            console.log(`✅ Created template: ${template.name}`);
        }

        console.log('');
        console.log('🎉 Template seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding templates:', error);
        process.exit(1);
    }
};

seedTemplates();
