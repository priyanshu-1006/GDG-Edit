import User from '../../models/User.js';
import Registration from '../../models/Registration.js';
import Certificate from '../../models/Certificate.js';
import { sendGlobalEmail } from '../../utils/unifiedEmail.js';

/**
 * @desc    Get all users with filtering, searching, and pagination
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      role,
      college,
      year,
      verified,
      suspended,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};
    
    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role) filter.role = role;
    
    // Filter by college
    if (college) filter.college = { $regex: college, $options: 'i' };
    
    // Filter by year
    if (year) filter.year = parseInt(year);
    
    // Filter by verified status
    if (verified !== undefined) filter.emailVerified = verified === 'true';
    
    // Filter by suspended status
    if (suspended !== undefined) filter.suspended = suspended === 'true';

    // Calculate skip
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort order
    const sortOrder = order === 'asc' ? 1 : -1;

    // Execute query
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [eventsRegistered, eventsAttended, certificatesEarned] = await Promise.all([
          Registration.countDocuments({ user: user._id }),
          Registration.countDocuments({ user: user._id, attended: true }),
          Certificate.countDocuments({ user: user._id })
        ]);

        return {
          ...user.toObject(),
          stats: {
            eventsRegistered,
            eventsAttended,
            certificatesEarned
          }
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * @desc    Get single user details
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's activity
    const [registrations, certificates] = await Promise.all([
      Registration.find({ user: user._id })
        .populate('event', 'name date type')
        .sort({ createdAt: -1 })
        .limit(10),
      Certificate.find({ user: user._id })
        .populate('event', 'name')
        .sort({ issuedAt: -1 })
        .limit(10)
    ]);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        recentRegistrations: registrations,
        recentCertificates: certificates
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
};

/**
 * @desc    Create new user
 * @route   POST /api/admin/users
 * @access  Private/SuperAdmin
 */
export const createUser = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
export const updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/SuperAdmin
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Optionally: Delete user's registrations, certificates, etc.
    // await Registration.deleteMany({ user: user._id });
    // await Certificate.deleteMany({ user: user._id });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * @desc    Change user role
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private/SuperAdmin
 */
export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['student', 'admin', 'event_manager', 'super_admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change user role',
      error: error.message
    });
  }
};

/**
 * @desc    Suspend/Unsuspend user
 * @route   PATCH /api/admin/users/:id/suspend
 * @access  Private/Admin
 */
export const toggleSuspendUser = async (req, res) => {
  try {
    const { suspend, reason } = req.body;

    const updateData = suspend ? {
      suspended: true,
      suspendedAt: new Date(),
      suspendedBy: req.user._id,
      suspensionReason: reason || 'No reason provided'
    } : {
      suspended: false,
      suspendedAt: null,
      suspendedBy: null,
      suspensionReason: null
    };

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: suspend ? 'User suspended successfully' : 'User unsuspended successfully',
      user
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend/unsuspend user',
      error: error.message
    });
  }
};

/**
 * @desc    Toggle Super Admin approval for Event Managers
 * @route   PATCH /api/admin/users/:id/approve
 * @access  Private/SuperAdmin
 */
export const toggleApproval = async (req, res) => {
  try {
    const { isApproved } = req.body;

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow toggling for event managers (or other roles if needed later)
    if (user.role !== 'event_manager') {
      return res.status(400).json({
        success: false,
        message: 'Approval toggling is currently only applicable for Event Managers.'
      });
    }

    user.isApproved = isApproved;
    await user.save();

    // Send email notification if they just got approved
    if (isApproved) {
      sendGlobalEmail({
        to: user.email,
        subject: 'GDG MMMUT: Event Manager Account Approved!',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.1);">
            <div style="background:#0f9d58;padding:30px 40px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">Account Approved</h1>
            </div>
            <div style="padding:40px;">
              <p style="color:#202124;font-size:16px;">Hello ${user.name},</p>
              <p style="color:#202124;font-size:16px;">Good news! Your GDG MMMUT Event Manager account has been approved by a Super Admin.</p>
              <p style="color:#202124;font-size:16px;">You can now log in to the admin dashboard and start managing events.</p>
              <div style="text-align:center;margin-top:30px;">
                <a href="${process.env.FRONTEND_URL}/admin/login" style="background:#4285f4;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Visit Admin Dashboard</a>
              </div>
            </div>
          </div>
        `
      }).catch(err => console.error("Failed to send approval email:", err));
    }

    res.json({
      success: true,
      message: isApproved ? 'Event Manager approved successfully!' : 'Event Manager approval revoked.',
      user
    });
  } catch (error) {
    console.error('Toggle approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle approval status',
      error: error.message
    });
  }
};

/**
 * @desc    Export users to CSV
 * @route   GET /api/admin/users/export
 * @access  Private/Admin
 */
export const exportUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    // Convert to CSV format
    const csvData = [
      ['Name', 'Email', 'Phone', 'College', 'Year', 'Branch', 'Role', 'Created At'],
      ...users.map(user => [
        user.name,
        user.email,
        user.phone || '',
        user.college || '',
        user.year || '',
        user.branch || '',
        user.role,
        user.createdAt.toISOString().split('T')[0]
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export users',
      error: error.message
    });
  }
};

export default {
  getAllUsers,
  getUserDetails,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  toggleSuspendUser,
  toggleApproval,
  exportUsers
};
