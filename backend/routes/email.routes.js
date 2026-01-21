
import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
    sendBulkEmail,
    sendQualificationEmail,
    getEmailLogs,
    getEmailStats,
    deleteEmailLog
} from '../controllers/emailController.js';

const router = express.Router();

// All routes require login and admin (or event_manager) privileges
router.use(protect);
router.use(authorize('admin', 'super_admin', 'event_manager'));

// @route   GET /api/email/logs
// @desc    Get email logs
router.get('/logs', getEmailLogs);

// @route   DELETE /api/email/logs/:id
// @desc    Delete email log
router.delete('/logs/:id', deleteEmailLog);

// @route   GET /api/email/stats
// @desc    Get email statistics
router.get('/stats', getEmailStats);

// @route   POST /api/email/bulk
// @desc    Send bulk emails (notifications, newsletters)
// @access  Admin
router.post('/bulk', sendBulkEmail);

// @route   POST /api/email/qualify
// @desc    Send qualification emails to selected users
// @access  Admin
router.post('/qualify', sendQualificationEmail);

export default router;
