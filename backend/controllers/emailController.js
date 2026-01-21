import EmailLog from '../models/EmailLog.js';
import emailService from '../services/emailService.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';

/**
 * Get email logs with filtering
 * @route GET /api/email/logs
 */
export const getEmailLogs = async (req, res, next) => {
    try {
        const { limit = 20, page = 1, type, status } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (type) query.type = type;
        if (status) query.status = status;

        const logs = await EmailLog.find(query)
            .sort({ sentAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await EmailLog.countDocuments(query);

        res.json({
            success: true,
            logs,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get email stats
 * @route GET /api/email/stats
 */
export const getEmailStats = async (req, res, next) => {
    try {
        const stats = await EmailLog.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Also group by Type
        const byType = await EmailLog.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            stats,
            byType
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Send bulk email to a list of users or all users
 * @route POST /api/email/bulk
 */
export const sendBulkEmail = async (req, res, next) => {
    try {
        const {
            recipients, // Array of { email, name } (optional)
            filters,   // Object { role, eventId, listType: 'all' | 'attendees' }
            subject,
            title,
            message,
            actionUrl,
            actionText
        } = req.body;

        let targetRecipients = [];

        // 1. If explicit recipients provided
        if (recipients && Array.isArray(recipients) && recipients.length > 0) {
            targetRecipients = recipients;
        }
        // 2. Filter logic
        else if (filters) {
            if (filters.listType === 'all') {
                const users = await User.find({}).select('email name');
                targetRecipients = users;
            } else if (filters.eventId) {
                // Get all approved registrations for an event
                const registrations = await Registration.find({
                    event: filters.eventId,
                    status: 'approved'
                }).populate('user', 'email name');

                targetRecipients = registrations.map(r => r.user).filter(u => u); // Filter out null users
            }
        }

        if (targetRecipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No recipients found matching criteria'
            });
        }

        // Send the emails
        // We run this in background if list is huge, but for now we await it or return processing message
        // If list > 50, maybe return early

        const isLargeBatch = targetRecipients.length > 50;

        if (isLargeBatch) {
            // Fire and forget (or use a queue in production)
            emailService.sendBulkEmails(targetRecipients, {
                title,
                message,
                actionUrl,
                actionText,
                type: 'general'
            }).then(results => {
                console.log(`Background bulk email finished: ${results.success} sent.`);
            });

            return res.json({
                success: true,
                message: `Bulk email process started for ${targetRecipients.length} recipients. Check logs for completion.`
            });
        }

        // Small batch, wait for result
        const results = await emailService.sendBulkEmails(targetRecipients, {
            title,
            message,
            actionUrl,
            actionText,
            type: 'general'
        });

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Send qualification emails to specific users
 * @route POST /api/email/qualify
 */
export const sendQualificationEmail = async (req, res, next) => {
    try {
        const { userIds, roundName, nextRoundDetails } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No user IDs provided'
            });
        }

        const users = await User.find({ _id: { $in: userIds } }).select('email name');

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No users found from the provided IDs'
            });
        }

        const results = await emailService.sendBulkEmails(users, {
            type: 'qualification',
            roundName,
            details: nextRoundDetails
        });

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Delete email log
 * @route DELETE /api/email/logs/:id
 */
export const deleteEmailLog = async (req, res, next) => {
    try {
        const log = await EmailLog.findByIdAndDelete(req.params.id);

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log not found'
            });
        }

        res.json({
            success: true,
            message: 'Log deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
