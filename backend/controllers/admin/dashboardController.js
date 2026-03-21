import User from '../../models/User.js';
import Event from '../../models/Event.js';
import Registration from '../../models/Registration.js';
import Certificate from '../../models/Certificate.js';
import { getRecentActivity } from '../../middleware/activityLog.middleware.js';

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/dashboard/stats
 * @access  Private/Admin
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      pendingRegistrations,
      totalCertificates,
      activeEvents,
      newUsersThisWeek
    ] = await Promise.all([
      // Total users
      User.countDocuments(),
      
      // Total events
      Event.countDocuments(),
      
      // Pending registrations
      Registration.countDocuments({ status: 'pending' }),
      
      // Total Certificates issued
      Certificate.countDocuments(),
      
      // Active events (upcoming + ongoing)
      Event.countDocuments({
        published: true,
        date: { $gte: new Date() }
      }),
      
      // New users this week
      User.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    // Calculate growth percentages
    const lastMonthUsers = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
      }
    });

    const userGrowth = totalUsers > 0 
      ? ((lastMonthUsers / totalUsers) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      stats: {
        totalUsers: {
          count: totalUsers,
          growth: `+${userGrowth}%`,
          change: lastMonthUsers
        },
        activeEvents: {
          count: activeEvents,
          total: totalEvents
        },
        pendingRegistrations: {
          count: pendingRegistrations
        },
        certificatesIssued: {
          count: totalCertificates,
          label: 'Total'
        },
        newUsersThisWeek: {
          count: newUsersThisWeek
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get recent activity feed
 * @route   GET /api/admin/dashboard/activity
 * @access  Private/Admin
 */
export const getRecentActivityFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const activity = await getRecentActivity(limit);

    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message
    });
  }
};

/**
 * @desc    Get chart data for dashboard
 * @route   GET /api/admin/dashboard/charts
 * @access  Private/Admin
 */
export const getChartData = async (req, res) => {
  try {
    // User growth over last 12 months
    const userGrowthData = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Events by type
    const eventsByType = await Event.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Registrations by month
    const registrationsByMonth = await Registration.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    // Top events by attendance
    const topEvents = await Registration.aggregate([
      { $match: { attended: true } },
      {
        $group: {
          _id: '$event',
          attendanceCount: { $sum: 1 }
        }
      },
      { $sort: { attendanceCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'eventDetails'
        }
      },
      { $unwind: '$eventDetails' },
      {
        $project: {
          name: '$eventDetails.name',
          attendanceCount: 1
        }
      }
    ]);

    res.json({
      success: true,
      charts: {
        userGrowth: userGrowthData.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          users: item.count
        })),
        eventsByType: eventsByType.map(item => ({
          type: item._id,
          count: item.count
        })),
        registrationsByMonth: registrationsByMonth.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          registrations: item.count
        })),
        topEvents: topEvents.map(item => ({
          name: item.name,
          attendance: item.attendanceCount
        }))
      }
    });
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chart data',
      error: error.message
    });
  }
};

export default {
  getDashboardStats,
  getRecentActivityFeed,
  getChartData
};
