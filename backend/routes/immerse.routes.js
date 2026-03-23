import express from 'express';
import ImmerseAdmin from '../models/ImmerseAdmin.js';
import ImmerseContact from '../models/ImmerseContact.js';
import ImmerseEmailTemplate from '../models/ImmerseEmailTemplate.js';
import ImmerseEmailLog from '../models/ImmerseEmailLog.js';
import ImmerseEvent from '../models/ImmerseEvent.js';
import ImmerseRegistration from '../models/ImmerseRegistration.js';
import OTP from '../models/OTP.js';
import immerseEmailService from '../services/immerseEmailService.js';
import { protectImmerse, immerseSuperAdmin, generateImmerseToken } from '../middleware/immerseAuth.middleware.js';

const router = express.Router();

// ==================== AUTH ROUTES ====================

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * OTP Email Template
 */
const getOTPEmailHTML = (otp, adminName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .otp-box { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 42px; font-weight: bold; letter-spacing: 10px; font-family: 'Courier New', monospace; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
            .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>IMMERSE 2026</h1>
                <p>Login Verification</p>
            </div>
            <div class="content">
                <p>Hi ${adminName},</p>
                <p>You have requested to login to IMMERSE Admin Portal. Please use the following One-Time Password (OTP) to complete your login:</p>
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                </div>
                <p><strong>This OTP will expire in 2 minutes.</strong></p>
                <p class="warning">⚠️ If you did not request this OTP, please ignore this email. Your account remains secure.</p>
            </div>
            <div class="footer">
                <p>IMMERSE 2026 - MMMUT Gorakhpur<br>© 2026 All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * @route   POST /api/immerse/auth/initiate-login
 * @desc    Initiate login - verify email/password and send OTP
 * @access  Public
 */
router.post('/auth/initiate-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const admin = await ImmerseAdmin.findOne({ email }).select('+password');

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!admin.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        const isMatch = await admin.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Save OTP to database
        await OTP.findOneAndDelete({ email }); // Remove old OTP if exists
        await OTP.create({
            email,
            otp
        });

        // Send OTP email
        try {
            await immerseEmailService.sendEmail({
                to: email,
                subject: 'Your IMMERSE Login OTP - Valid for 2 Minutes',
                html: getOTPEmailHTML(otp, admin.name),
                category: 'security',
                recipientName: admin.name,
                recipientType: 'admin',
                metadata: { purpose: 'login_otp', adminId: admin._id }
            });
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            // Continue anyway - OTP is still in database
            console.log(`📧 [FALLBACK] OTP for ${email}: ${otp}`);
        }

        res.json({
            success: true,
            message: 'OTP sent to your email',
            sessionId: Buffer.from(`${email}:${Date.now()}`).toString('base64')
        });
    } catch (error) {
        console.error('Login initiation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   POST /api/immerse/auth/verify-otp
 * @desc    Verify OTP and login
 * @access  Public
 */
router.post('/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and OTP'
            });
        }

        // Check OTP
        const otpRecord = await OTP.findOne({ email, otp });

        if (!otpRecord) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        // Get admin
        const admin = await ImmerseAdmin.findOne({ email });

        if (!admin || !admin.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Admin not found or deactivated'
            });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save({ validateBeforeSave: false });

        // Generate token
        const token = generateImmerseToken(admin);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   POST /api/immerse/auth/login
 * @desc    Legacy login endpoint (redirects to new OTP-based flow)
 * @access  Public
 * @deprecated Use /auth/initiate-login + /auth/verify-otp instead
 */
router.post('/auth/login', async (req, res) => {
    res.status(403).json({
        success: false,
        message: 'OTP is now required for login. Please use the OTP-based login flow.',
        hint: 'Use POST /api/immerse/auth/initiate-login to start login, then verify with /api/immerse/auth/verify-otp'
    });
});

/**
 * @route   GET /api/immerse/auth/me
 * @desc    Get current admin
 * @access  Private
 */
router.get('/auth/me', protectImmerse, async (req, res) => {
    res.json({
        success: true,
        admin: {
            id: req.immerseAdmin._id,
            name: req.immerseAdmin.name,
            email: req.immerseAdmin.email,
            role: req.immerseAdmin.role
        }
    });
});

/**
 * @route   POST /api/immerse/auth/create-admin
 * @desc    Create new Immerse admin (super admin only)
 * @access  Private - Super Admin
 */
router.post('/auth/create-admin', protectImmerse, immerseSuperAdmin, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingAdmin = await ImmerseAdmin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email already exists'
            });
        }

        const admin = await ImmerseAdmin.create({
            name,
            email,
            password,
            role: role || 'immerse_admin'
        });

        res.status(201).json({
            success: true,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   GET /api/immerse/auth/admins
 * @desc    Get all Immerse admins (super admin only)
 * @access  Private - Super Admin
 */
router.get('/auth/admins', protectImmerse, immerseSuperAdmin, async (req, res) => {
    try {
        const admins = await ImmerseAdmin.find().select('-password');
        res.json({
            success: true,
            admins: admins
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   PUT /api/immerse/auth/profile
 * @desc    Update admin profile
 * @access  Private
 */
router.put('/auth/profile', protectImmerse, async (req, res) => {
    try {
        const { name, email } = req.body;
        
        // Check if email is being changed and if it's already taken
        if (email && email !== req.immerseAdmin.email) {
            const existingAdmin = await ImmerseAdmin.findOne({ email, _id: { $ne: req.immerseAdmin._id } });
            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
        }
        
        const admin = await ImmerseAdmin.findByIdAndUpdate(
            req.immerseAdmin._id,
            { name, email },
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({
            success: true,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   PUT /api/immerse/auth/change-password
 * @desc    Change admin password
 * @access  Private
 */
router.put('/auth/change-password', protectImmerse, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }
        
        const admin = await ImmerseAdmin.findById(req.immerseAdmin._id).select('+password');
        
        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        admin.password = newPassword;
        await admin.save();
        
        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   DELETE /api/immerse/auth/admin/:id
 * @desc    Delete an admin (super admin only)
 * @access  Private - Super Admin
 */
router.delete('/auth/admin/:id', protectImmerse, immerseSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent deleting yourself
        if (id === req.immerseAdmin._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }
        
        const admin = await ImmerseAdmin.findById(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        await ImmerseAdmin.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Admin deleted successfully'
        });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ==================== CONTACTS ROUTES ====================

/**
 * @route   GET /api/immerse/contacts
 * @desc    Get all contacts with filters
 * @access  Private
 */
router.get('/contacts', protectImmerse, async (req, res) => {
    try {
        const { type, status, tag, search, page = 1, limit = 50 } = req.query;
        
        const query = {};
        if (type) query.type = type;
        if (status) query.status = status;
        if (tag) query.tags = tag;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await ImmerseContact.countDocuments(query);
        const contacts = await ImmerseContact.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('createdBy', 'name');

        res.json({
            success: true,
            data: contacts,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   POST /api/immerse/contacts
 * @desc    Create new contact
 * @access  Private
 */
router.post('/contacts', protectImmerse, async (req, res) => {
    try {
        const contactData = {
            ...req.body,
            createdBy: req.immerseAdmin._id
        };

        const contact = await ImmerseContact.create(contactData);

        res.status(201).json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('Create contact error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});

/**
 * @route   POST /api/immerse/contacts/bulk
 * @desc    Bulk import contacts
 * @access  Private
 */
router.post('/contacts/bulk', protectImmerse, async (req, res) => {
    try {
        const { contacts } = req.body;
        
        const results = {
            success: [],
            failed: []
        };

        for (const contactData of contacts) {
            try {
                const existingContact = await ImmerseContact.findOne({ email: contactData.email });
                if (existingContact) {
                    results.failed.push({
                        email: contactData.email,
                        reason: 'Email already exists'
                    });
                    continue;
                }

                const contact = await ImmerseContact.create({
                    ...contactData,
                    createdBy: req.immerseAdmin._id
                });
                results.success.push(contact);
            } catch (err) {
                results.failed.push({
                    email: contactData.email,
                    reason: err.message
                });
            }
        }

        res.json({
            success: true,
            imported: results.success.length,
            failed: results.failed.length,
            results
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   PUT /api/immerse/contacts/:id
 * @desc    Update contact
 * @access  Private
 */
router.put('/contacts/:id', protectImmerse, async (req, res) => {
    try {
        const contact = await ImmerseContact.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   DELETE /api/immerse/contacts/:id
 * @desc    Delete contact
 * @access  Private
 */
router.delete('/contacts/:id', protectImmerse, async (req, res) => {
    try {
        const contact = await ImmerseContact.findByIdAndDelete(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        res.json({
            success: true,
            message: 'Contact deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ==================== TEMPLATE ROUTES ====================

/**
 * @route   GET /api/immerse/templates
 * @desc    Get all email templates
 * @access  Private
 */
router.get('/templates', protectImmerse, async (req, res) => {
    try {
        const { category, isActive } = req.query;
        const query = {};
        if (category) query.category = category;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const templates = await ImmerseEmailTemplate.find(query)
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name');

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   POST /api/immerse/templates
 * @desc    Create email template
 * @access  Private
 */
router.post('/templates', protectImmerse, async (req, res) => {
    try {
        const templateData = {
            ...req.body,
            createdBy: req.immerseAdmin._id
        };

        const template = await ImmerseEmailTemplate.create(templateData);

        res.status(201).json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});

/**
 * @route   PUT /api/immerse/templates/:id
 * @desc    Update email template
 * @access  Private
 */
router.put('/templates/:id', protectImmerse, async (req, res) => {
    try {
        const template = await ImmerseEmailTemplate.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   DELETE /api/immerse/templates/:id
 * @desc    Delete email template
 * @access  Private
 */
router.delete('/templates/:id', protectImmerse, async (req, res) => {
    try {
        const template = await ImmerseEmailTemplate.findByIdAndDelete(req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        res.json({
            success: true,
            message: 'Template deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ==================== EMAIL SENDING ROUTES ====================

/**
 * @route   POST /api/immerse/email/send
 * @desc    Send single email
 * @access  Private
 */
router.post('/email/send', protectImmerse, async (req, res) => {
    try {
        const { to, subject, html, category, recipientName, recipientType } = req.body;

        if (!to || !subject || !html) {
            return res.status(400).json({
                success: false,
                message: 'Please provide to, subject, and html content'
            });
        }

        const result = await immerseEmailService.sendEmail({
            to,
            subject,
            html,
            category,
            recipientName,
            recipientType,
            sentBy: req.immerseAdmin._id
        });

        res.json({
            success: true,
            messageId: result.id
        });
    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send email'
        });
    }
});

/**
 * @route   POST /api/immerse/email/send-template
 * @desc    Send email using template
 * @access  Private
 */
router.post('/email/send-template', protectImmerse, async (req, res) => {
    try {
        const { templateId, to, variables, recipientName, recipientType, contactId } = req.body;

        if (!templateId || !to) {
            return res.status(400).json({
                success: false,
                message: 'Please provide templateId and recipient email'
            });
        }

        const result = await immerseEmailService.sendWithTemplate({
            templateId,
            to,
            variables: variables || {},
            recipientName,
            recipientType,
            contactId,
            sentBy: req.immerseAdmin._id
        });

        res.json({
            success: true,
            messageId: result.id
        });
    } catch (error) {
        console.error('Send template email error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send email'
        });
    }
});

/**
 * @route   POST /api/immerse/email/send-bulk
 * @desc    Send bulk emails to multiple contacts
 * @access  Private
 */
router.post('/email/send-bulk', protectImmerse, async (req, res) => {
    try {
        const { contactIds, contactType, subject, html, campaignName, templateId, variables } = req.body;

        let contacts;
        if (contactIds && contactIds.length > 0) {
            contacts = await ImmerseContact.find({ 
                _id: { $in: contactIds },
                emailStatus: 'active'
            });
        } else if (contactType) {
            contacts = await ImmerseContact.find({ 
                type: contactType,
                emailStatus: 'active'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Please provide contactIds or contactType'
            });
        }

        if (contacts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No active contacts found'
            });
        }

        const results = await immerseEmailService.sendBulkEmails({
            contacts,
            subject,
            html,
            campaignName,
            templateId,
            variables: variables || {},
            sentBy: req.immerseAdmin._id
        });

        res.json({
            success: true,
            campaignId: results.campaignId,
            sent: results.success.length,
            failed: results.failed.length,
            details: results
        });
    } catch (error) {
        console.error('Bulk email error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send bulk emails'
        });
    }
});

/**
 * @route   POST /api/immerse/email/send-sponsor
 * @desc    Send sponsor outreach email
 * @access  Private
 */
router.post('/email/send-sponsor', protectImmerse, async (req, res) => {
    try {
        const { contactId, subject, html } = req.body;

        const contact = await ImmerseContact.findById(contactId);
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        const result = await immerseEmailService.sendSponsorOutreach({
            contact,
            subject,
            html,
            sentBy: req.immerseAdmin._id
        });

        // Update contact status
        await ImmerseContact.findByIdAndUpdate(contactId, {
            status: 'contacted'
        });

        res.json({
            success: true,
            messageId: result.id
        });
    } catch (error) {
        console.error('Sponsor outreach error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send email'
        });
    }
});

// ==================== EMAIL LOGS & STATS ROUTES ====================

/**
 * @route   GET /api/immerse/email/logs
 * @desc    Get email logs
 * @access  Private
 */
router.get('/email/logs', protectImmerse, async (req, res) => {
    try {
        const { status, category, campaignId, startDate, endDate, page = 1, limit = 50 } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (category) query.category = category;
        if (campaignId) query.campaignId = campaignId;
        if (startDate && endDate) {
            query.sentAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const total = await ImmerseEmailLog.countDocuments(query);
        const logs = await ImmerseEmailLog.find(query)
            .sort({ sentAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('sentBy', 'name')
            .populate('templateUsed', 'name');

        res.json({
            success: true,
            data: logs,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   GET /api/immerse/email/stats
 * @desc    Get email statistics
 * @access  Private
 */
router.get('/email/stats', protectImmerse, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const stats = await immerseEmailService.getEmailStats(startDate, endDate);

        // Get recent campaigns
        const recentCampaigns = await ImmerseEmailLog.aggregate([
            { $match: { campaignId: { $ne: null } } },
            {
                $group: {
                    _id: '$campaignId',
                    name: { $first: '$campaignName' },
                    total: { $sum: 1 },
                    sent: {
                        $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
                    },
                    failed: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    },
                    createdAt: { $first: '$sentAt' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            stats,
            recentCampaigns
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   GET /api/immerse/dashboard/stats
 * @desc    Get dashboard overview stats
 * @access  Private
 */
router.get('/dashboard/stats', protectImmerse, async (req, res) => {
    try {
        const [
            totalContacts,
            companyContacts,
            studentContacts,
            totalEmailsSent,
            totalTemplates
        ] = await Promise.all([
            ImmerseContact.countDocuments(),
            ImmerseContact.countDocuments({ type: 'company' }),
            ImmerseContact.countDocuments({ type: 'student' }),
            ImmerseEmailLog.countDocuments(),
            ImmerseEmailTemplate.countDocuments()
        ]);

        // Recent activity
        const recentEmails = await ImmerseEmailLog.find()
            .sort({ sentAt: -1 })
            .limit(5)
            .populate('sentBy', 'name');

        // Contact status breakdown
        const contactStatusStats = await ImmerseContact.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                totalContacts,
                companyContacts,
                studentContacts,
                totalEmailsSent,
                totalTemplates
            },
            recentEmails,
            contactStatusStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ==========================================
// PUBLIC EVENT ROUTES (No auth required)
// ==========================================

// Get all active events (public)
router.get('/events', async (req, res) => {
    try {
        const events = await ImmerseEvent.find({ isActive: true })
            .sort({ order: 1 })
            .select('-__v');

        res.json({
            success: true,
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get single event by slug (public)
router.get('/events/:slug', async (req, res) => {
    try {
        const event = await ImmerseEvent.findOne({ 
            slug: req.params.slug,
            isActive: true 
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Register for an event (public)
router.post('/events/:slug/register', async (req, res) => {
    try {
        const event = await ImmerseEvent.findOne({ 
            slug: req.params.slug,
            isActive: true 
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (!event.registrationOpen) {
            return res.status(400).json({
                success: false,
                message: 'Registration is closed for this event'
            });
        }

        if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
            return res.status(400).json({
                success: false,
                message: 'Registration deadline has passed'
            });
        }

        if (event.maxParticipants && event.registrationCount >= event.maxParticipants) {
            return res.status(400).json({
                success: false,
                message: 'Event is full'
            });
        }

        const {
            registrationType,
            teamName,
            teamMembers,
            name,
            email,
            phone,
            college,
            year,
            branch,
            experience,
            dietaryPreference,
            tshirtSize,
            projectIdea,
            techStack,
            additionalInfo
        } = req.body;

        // Check for existing registration
        const existingRegistration = await ImmerseRegistration.findOne({
            event: event._id,
            $or: [
                { email: email?.toLowerCase() },
                { 'teamMembers.email': email?.toLowerCase() }
            ]
        });

        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message: 'You have already registered for this event'
            });
        }

        // Validate team registration
        if (registrationType === 'team') {
            if (!teamMembers || teamMembers.length < event.teamSize.min) {
                return res.status(400).json({
                    success: false,
                    message: `Team must have at least ${event.teamSize.min} members`
                });
            }
            if (teamMembers.length > event.teamSize.max) {
                return res.status(400).json({
                    success: false,
                    message: `Team cannot have more than ${event.teamSize.max} members`
                });
            }

            // Check if any team member already registered
            const teamEmails = teamMembers.map(m => m.email?.toLowerCase());
            const existingTeamMember = await ImmerseRegistration.findOne({
                event: event._id,
                $or: [
                    { email: { $in: teamEmails } },
                    { 'teamMembers.email': { $in: teamEmails } }
                ]
            });

            if (existingTeamMember) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more team members are already registered for this event'
                });
            }
        }

        const registration = new ImmerseRegistration({
            event: event._id,
            eventSlug: event.slug,
            registrationType,
            teamName,
            teamMembers: teamMembers?.map(m => ({
                ...m,
                email: m.email?.toLowerCase()
            })),
            name,
            email: email?.toLowerCase(),
            phone,
            college,
            year,
            branch,
            experience,
            dietaryPreference,
            tshirtSize,
            projectIdea,
            techStack,
            additionalInfo,
            status: 'pending'
        });

        await registration.save();

        // Update event registration count
        event.registrationCount += 1;
        await event.save();

        // Send confirmation email
        try {
            const leaderEmail = registrationType === 'team' 
                ? teamMembers.find(m => m.isLeader)?.email 
                : email;
            
            if (leaderEmail) {
                await immerseEmailService.sendEmail({
                    to: leaderEmail.toLowerCase(),
                    subject: `Registration Confirmed: ${event.name} | IMMERSE 2026`,
                    html: `
                        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%); color: #fff; padding: 40px; border-radius: 16px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="font-size: 28px; margin: 0; background: linear-gradient(135deg, ${event.gradientColors?.from || '#6366f1'}, ${event.gradientColors?.to || '#8b5cf6'}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                                    🚀 Registration Confirmed!
                                </h1>
                            </div>
                            
                            <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6;">
                                Congratulations! Your registration for <strong style="color: #fff;">${event.name}</strong> has been confirmed.
                            </p>
                            
                            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <h3 style="margin: 0 0 15px 0; color: #fff;">Registration Details</h3>
                                <p style="margin: 8px 0; color: #a0a0a0;">
                                    <strong style="color: #fff;">Registration ID:</strong> ${registration.registrationId}
                                </p>
                                <p style="margin: 8px 0; color: #a0a0a0;">
                                    <strong style="color: #fff;">Event:</strong> ${event.name}
                                </p>
                                ${teamName ? `<p style="margin: 8px 0; color: #a0a0a0;"><strong style="color: #fff;">Team:</strong> ${teamName}</p>` : ''}
                            </div>
                            
                            <p style="color: #a0a0a0; font-size: 14px; text-align: center; margin-top: 30px;">
                                Keep this registration ID safe. You'll need it on the event day.
                            </p>
                            
                            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                                <p style="color: #666; font-size: 12px;">
                                    IMMERSE 2026 • Innovation Beyond Space & Time
                                </p>
                            </div>
                        </div>
                    `
                });
                registration.emailSent.confirmation = true;
                registration.emailSent.confirmationAt = new Date();
                await registration.save();
            }
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            registrationId: registration.registrationId,
            registration: {
                id: registration._id,
                registrationId: registration.registrationId,
                event: event.name,
                status: registration.status
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already registered for this event'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});

// Check registration status (public)
router.get('/registration-status/:registrationId', async (req, res) => {
    try {
        const registration = await ImmerseRegistration.findOne({ 
            registrationId: req.params.registrationId 
        }).populate('event', 'name slug icon gradientColors');

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        res.json({
            success: true,
            registration: {
                registrationId: registration.registrationId,
                event: registration.event,
                teamName: registration.teamName,
                status: registration.status,
                registeredAt: registration.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ==========================================
// ADMIN EVENT ROUTES
// ==========================================

// Get all events (admin)
router.get('/admin/events', protectImmerse, async (req, res) => {
    try {
        const events = await ImmerseEvent.find()
            .sort({ order: 1 });

        res.json({
            success: true,
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Create event (admin)
router.post('/admin/events', protectImmerse, immerseSuperAdmin, async (req, res) => {
    try {
        const event = new ImmerseEvent(req.body);
        await event.save();

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            event
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Event with this slug already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update event (admin)
router.put('/admin/events/:id', protectImmerse, immerseSuperAdmin, async (req, res) => {
    try {
        const event = await ImmerseEvent.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            message: 'Event updated successfully',
            event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Delete event (admin)
router.delete('/admin/events/:id', protectImmerse, immerseSuperAdmin, async (req, res) => {
    try {
        const event = await ImmerseEvent.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Delete associated registrations
        await ImmerseRegistration.deleteMany({ event: req.params.id });

        res.json({
            success: true,
            message: 'Event and associated registrations deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Toggle event registration (admin)
router.patch('/admin/events/:id/toggle-registration', protectImmerse, async (req, res) => {
    try {
        const event = await ImmerseEvent.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        event.registrationOpen = !event.registrationOpen;
        await event.save();

        res.json({
            success: true,
            message: `Registration ${event.registrationOpen ? 'opened' : 'closed'} for ${event.name}`,
            registrationOpen: event.registrationOpen
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ==========================================
// ADMIN REGISTRATION ROUTES
// ==========================================

// Get all registrations with filters (admin)
router.get('/admin/registrations', protectImmerse, async (req, res) => {
    try {
        const { 
            eventSlug, 
            status, 
            search, 
            page = 1, 
            limit = 20 
        } = req.query;

        const query = {};

        if (eventSlug) query.eventSlug = eventSlug;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { teamName: { $regex: search, $options: 'i' } },
                { registrationId: { $regex: search, $options: 'i' } },
                { 'teamMembers.name': { $regex: search, $options: 'i' } },
                { 'teamMembers.email': { $regex: search, $options: 'i' } }
            ];
        }

        const total = await ImmerseRegistration.countDocuments(query);
        const registrations = await ImmerseRegistration.find(query)
            .populate('event', 'name slug icon gradientColors')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            success: true,
            registrations,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get registration stats by event (admin)
router.get('/admin/registration-stats', protectImmerse, async (req, res) => {
    try {
        const stats = await ImmerseRegistration.aggregate([
            {
                $group: {
                    _id: '$eventSlug',
                    total: { $sum: 1 },
                    confirmed: {
                        $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    attended: {
                        $sum: { $cond: [{ $eq: ['$status', 'attended'] }, 1, 0] }
                    },
                    teams: {
                        $sum: { $cond: [{ $eq: ['$registrationType', 'team'] }, 1, 0] }
                    },
                    individuals: {
                        $sum: { $cond: [{ $eq: ['$registrationType', 'individual'] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'immerseevents',
                    localField: '_id',
                    foreignField: 'slug',
                    as: 'event'
                }
            },
            { $unwind: '$event' },
            {
                $project: {
                    eventSlug: '$_id',
                    eventName: '$event.name',
                    eventIcon: '$event.icon',
                    gradientColors: '$event.gradientColors',
                    total: 1,
                    confirmed: 1,
                    pending: 1,
                    attended: 1,
                    teams: 1,
                    individuals: 1
                }
            },
            { $sort: { 'event.order': 1 } }
        ]);

        const totalRegistrations = await ImmerseRegistration.countDocuments();
        const totalConfirmed = await ImmerseRegistration.countDocuments({ status: 'confirmed' });
        const totalPending = await ImmerseRegistration.countDocuments({ status: 'pending' });
        const totalAttended = await ImmerseRegistration.countDocuments({ status: 'attended' });

        res.json({
            success: true,
            stats,
            summary: {
                totalRegistrations,
                totalConfirmed,
                totalPending,
                totalAttended
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get single registration (admin)
router.get('/admin/registrations/:id', protectImmerse, async (req, res) => {
    try {
        const registration = await ImmerseRegistration.findById(req.params.id)
            .populate('event', 'name slug icon gradientColors teamSize');

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        res.json({
            success: true,
            registration
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update registration status (admin)
router.put('/admin/registrations/:id', protectImmerse, async (req, res) => {
    try {
        const { status, checkedIn, notes } = req.body;
        const updateData = {};

        if (status) updateData.status = status;
        if (typeof checkedIn === 'boolean') {
            updateData.checkedIn = checkedIn;
            if (checkedIn) updateData.checkedInAt = new Date();
        }
        if (notes) updateData.notes = notes;

        const registration = await ImmerseRegistration.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('event', 'name slug');

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        res.json({
            success: true,
            message: 'Registration updated successfully',
            registration
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Bulk update registration status (admin)
router.post('/admin/registrations/bulk-update', protectImmerse, async (req, res) => {
    try {
        const { ids, status } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide registration IDs'
            });
        }

        const result = await ImmerseRegistration.updateMany(
            { _id: { $in: ids } },
            { status }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} registrations updated to ${status}`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Check-in registration (admin)
router.post('/admin/registrations/:id/checkin', protectImmerse, async (req, res) => {
    try {
        const registration = await ImmerseRegistration.findById(req.params.id)
            .populate('event', 'name');

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        if (registration.checkedIn) {
            return res.status(400).json({
                success: false,
                message: 'Already checked in'
            });
        }

        registration.checkedIn = true;
        registration.checkedInAt = new Date();
        registration.status = 'attended';
        await registration.save();

        res.json({
            success: true,
            message: `${registration.teamName || registration.name} checked in successfully`,
            registration
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Delete registration (admin)
router.delete('/admin/registrations/:id', protectImmerse, async (req, res) => {
    try {
        const registration = await ImmerseRegistration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        // Decrement event registration count
        await ImmerseEvent.findByIdAndUpdate(registration.event, {
            $inc: { registrationCount: -1 }
        });

        await registration.deleteOne();

        res.json({
            success: true,
            message: 'Registration deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Send email to registrants (admin)
router.post('/admin/registrations/send-email', protectImmerse, async (req, res) => {
    try {
        const { registrationIds, subject, content, eventSlug } = req.body;

        let registrations;
        if (registrationIds && registrationIds.length > 0) {
            registrations = await ImmerseRegistration.find({ _id: { $in: registrationIds } });
        } else if (eventSlug) {
            registrations = await ImmerseRegistration.find({ eventSlug });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Please provide registration IDs or event slug'
            });
        }

        let successCount = 0;
        let failCount = 0;

        for (const reg of registrations) {
            const email = reg.registrationType === 'team'
                ? reg.teamMembers.find(m => m.isLeader)?.email
                : reg.email;

            if (email) {
                try {
                    await immerseEmailService.sendEmail({
                        to: email,
                        subject,
                        html: content.replace(/\{\{name\}\}/g, reg.teamName || reg.name)
                            .replace(/\{\{registrationId\}\}/g, reg.registrationId)
                    });
                    successCount++;
                } catch {
                    failCount++;
                }
            }
        }

        res.json({
            success: true,
            message: `Emails sent: ${successCount} success, ${failCount} failed`,
            successCount,
            failCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Export registrations (admin)
router.get('/admin/registrations/export/:eventSlug', protectImmerse, async (req, res) => {
    try {
        const registrations = await ImmerseRegistration.find({ 
            eventSlug: req.params.eventSlug 
        }).populate('event', 'name');

        const csvRows = [
            'Registration ID,Type,Team/Name,Email,Phone,College,Year,Branch,Status,Registered At'
        ];

        for (const reg of registrations) {
            const name = reg.teamName || reg.name;
            const email = reg.registrationType === 'team'
                ? reg.teamMembers.find(m => m.isLeader)?.email
                : reg.email;
            const phone = reg.registrationType === 'team'
                ? reg.teamMembers.find(m => m.isLeader)?.phone
                : reg.phone;
            const college = reg.registrationType === 'team'
                ? reg.teamMembers.find(m => m.isLeader)?.college
                : reg.college;
            const year = reg.registrationType === 'team'
                ? reg.teamMembers.find(m => m.isLeader)?.year
                : reg.year;
            const branch = reg.registrationType === 'team'
                ? reg.teamMembers.find(m => m.isLeader)?.branch
                : reg.branch;

            csvRows.push(
                `${reg.registrationId},${reg.registrationType},"${name}",${email},${phone},"${college}",${year},"${branch}",${reg.status},${reg.createdAt.toISOString()}`
            );
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=registrations-${req.params.eventSlug}.csv`);
        res.send(csvRows.join('\n'));
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;
