import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { requireAdmin, requireSuperAdmin, requireEventManager } from '../middleware/roleCheck.middleware.js';
import { logActivity } from '../middleware/activityLog.middleware.js';

// Import controllers
import dashboardController from '../controllers/admin/dashboardController.js';
import usersController from '../controllers/admin/usersController.js';
import eventsController from '../controllers/admin/eventsController.js';
import registrationsController from '../controllers/admin/registrationsController.js';
import notificationsController from '../controllers/admin/notificationsController.js';

const router = express.Router();
const notificationsModuleEnabled = process.env.ENABLE_NOTIFICATIONS_MODULE === 'true';

// All admin portal routes require authentication and at least event_manager role
router.use(protect);
router.use(requireEventManager);

// Strictly lock User Management and Notifications behind full Admin role
router.use('/users', requireAdmin);

if (notificationsModuleEnabled) {
	router.use('/notifications', requireAdmin);
} else {
	router.all('/notifications*', requireAdmin, (req, res) => {
		return res.status(503).json({
			success: false,
			message: 'Notifications module is currently disabled',
			feature: 'notifications',
		});
	});
}

// ============================================
// DASHBOARD ROUTES
// ============================================
router.get('/dashboard/stats', dashboardController.getDashboardStats);
router.get('/dashboard/activity', dashboardController.getRecentActivityFeed);
router.get('/dashboard/charts', dashboardController.getChartData);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================
router.get('/users', logActivity('view', 'user'), usersController.getAllUsers);
router.get('/users/export', logActivity('export', 'user'), usersController.exportUsers);
router.get('/users/:id', usersController.getUserDetails);
router.post('/users', requireSuperAdmin, logActivity('create', 'user'), usersController.createUser);
router.put('/users/:id', logActivity('update', 'user'), usersController.updateUser);
router.delete('/users/:id', requireSuperAdmin, logActivity('delete', 'user'), usersController.deleteUser);
router.patch('/users/:id/role', requireSuperAdmin, logActivity('change_role', 'user'), usersController.changeUserRole);
router.patch('/users/:id/suspend', logActivity('suspend', 'user'), usersController.toggleSuspendUser);
router.patch('/users/:id/approve', requireSuperAdmin, logActivity('approve', 'user'), usersController.toggleApproval);

// ============================================
// EVENT MANAGEMENT ROUTES
// ============================================
router.get('/events', eventsController.getAllEvents);
router.get('/events/:id', eventsController.getEventDetails);
router.post('/events', requireEventManager, logActivity('create', 'event'), eventsController.createEvent);
router.put('/events/:id', requireEventManager, logActivity('update', 'event'), eventsController.updateEvent);
router.delete('/events/:id', logActivity('delete', 'event'), eventsController.deleteEvent);
router.patch('/events/:id/publish', requireEventManager, logActivity('publish', 'event'), eventsController.togglePublishEvent);
router.post('/events/:id/duplicate', requireEventManager, logActivity('duplicate', 'event'), eventsController.duplicateEvent);
router.get('/events/:id/analytics', eventsController.getEventAnalytics);

// ============================================
// REGISTRATION MANAGEMENT ROUTES
// ============================================
router.get('/registrations', registrationsController.getAllRegistrations);
router.get('/registrations/export', logActivity('export', 'registration'), registrationsController.exportRegistrations);
router.patch('/registrations/:id/approve', requireEventManager, logActivity('approve', 'registration'), registrationsController.approveRegistration);
router.patch('/registrations/:id/reject', requireEventManager, logActivity('reject', 'registration'), registrationsController.rejectRegistration);
router.post('/registrations/bulk-approve', requireEventManager, logActivity('bulk_approve', 'registration'), registrationsController.bulkApproveRegistrations);
router.patch('/registrations/:id/attendance', requireEventManager, logActivity('mark_attendance', 'registration'), registrationsController.markAttendance);
router.post('/registrations/scan-qr', requireEventManager, logActivity('scan_qr', 'registration'), registrationsController.scanQRCode);

// ============================================
// NOTIFICATION ROUTES
// ============================================
if (notificationsModuleEnabled) {
	router.get('/notifications', notificationsController.getAllNotifications);
	router.get('/notifications/stats', notificationsController.getNotificationStats);
	router.get('/notifications/:id', notificationsController.getNotificationDetails);
	router.post('/notifications', logActivity('create', 'notification'), notificationsController.createNotification);
	router.post('/notifications/:id/send', logActivity('send', 'notification'), notificationsController.sendNotification);
	router.patch('/notifications/:id/schedule', logActivity('schedule', 'notification'), notificationsController.scheduleNotification);
	router.delete('/notifications/:id', logActivity('delete', 'notification'), notificationsController.deleteNotification);
}

export default router;
