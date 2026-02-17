import express from 'express';
import ImmerseAdmin from '../models/ImmerseAdmin.js';
import ImmerseContact from '../models/ImmerseContact.js';
import ImmerseEmailTemplate from '../models/ImmerseEmailTemplate.js';
import ImmerseEmailLog from '../models/ImmerseEmailLog.js';
import immerseEmailService from '../services/immerseEmailService.js';
import { protectImmerse, immerseSuperAdmin, generateImmerseToken } from '../middleware/immerseAuth.middleware.js';

const router = express.Router();

// ==================== AUTH ROUTES ====================

/**
 * @route   POST /api/immerse/auth/login
 * @desc    Login Immerse admin
 * @access  Public
 */
router.post('/auth/login', async (req, res) => {
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

        // Update last login
        admin.lastLogin = new Date();
        await admin.save({ validateBeforeSave: false });

        const token = generateImmerseToken(admin);

        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
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
            data: admins
        });
    } catch (error) {
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

export default router;
