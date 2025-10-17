import Registration from '../../models/Registration.js';
import Event from '../../models/Event.js';
import User from '../../models/User.js';
import sendMail from '../../utils/sendEmail.utils.js'

/**
 * @desc    Get all registrations with filtering
 * @route   GET /api/admin/registrations
 * @access  Private/Admin
 */
export const getAllRegistrations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      eventId,
      search = '',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (eventId) filter.event = eventId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    let registrations = await Registration.find(filter)
      .populate('user', 'name email phone college year')
      .populate('event', 'name date type mode')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    // Apply search filter after population
    if (search) {
      registrations = registrations.filter(reg => 
        reg.user?.name.toLowerCase().includes(search.toLowerCase()) ||
        reg.user?.email.toLowerCase().includes(search.toLowerCase()) ||
        reg.event?.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Registration.countDocuments(filter);

    res.json({
      success: true,
      registrations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations',
      error: error.message
    });
  }
};

/**
 * @desc    Approve registration
 * @route   PATCH /api/admin/registrations/:id/approve
 * @access  Private/EventManager
 */
export const approveRegistration = async (req, res) => {
  try {
    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('user event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const mailSent = sendMail(registration, "approved");
    if(!mailSent){
      return res.status(503).json({
        success: false,
        message: 'Failed to send mail.'
      });
    }

    res.json({
      success: true,
      message: 'Registration approved successfully',
      registration
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve registration',
      error: error.message
    });
  }
};

/**
 * @desc    Reject registration
 * @route   PATCH /api/admin/registrations/:id/reject
 * @access  Private/EventManager
 */
export const rejectRegistration = async (req, res) => {
  try {
    const { reason } = req.body;

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectionReason: reason,
        rejectedBy: req.user._id,
        rejectedAt: new Date()
      },
      { new: true }
    ).populate('user event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const mailSent = sendMail("a@gmail.com", "rejected");
    if(!mailSent){
      return res.status(503).json({
        success: false,
        message: 'Failed to send mail.'
      });
    }

    res.json({
      success: true,
      message: 'Registration rejected successfully',
      registration
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject registration',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk approve registrations
 * @route   POST /api/admin/registrations/bulk-approve
 * @access  Private/EventManager
 */
export const bulkApproveRegistrations = async (req, res) => {
  try {
    const { registrationIds } = req.body;

    const result = await Registration.updateMany(
      { _id: { $in: registrationIds }, status: 'pending' },
      { 
        status: 'approved',
        approvedBy: req.user._id,
        approvedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} registrations approved successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk approve registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk approve registrations',
      error: error.message
    });
  }
};

/**
 * @desc    Mark attendance
 * @route   PATCH /api/admin/registrations/:id/attendance
 * @access  Private/EventManager
 */
export const markAttendance = async (req, res) => {
  try {
    const { attended } = req.body;

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { 
        attended,
        attendedAt: attended ? new Date() : null
      },
      { new: true }
    ).populate('user event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      message: attended ? 'Attendance marked successfully' : 'Attendance removed',
      registration
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

/**
 * @desc    Scan QR code for attendance
 * @route   POST /api/admin/registrations/scan-qr
 * @access  Private/EventManager
 */
export const scanQRCode = async (req, res) => {
  try {
    const { registrationId, eventId } = req.body;

    const registration = await Registration.findOne({
      _id: registrationId,
      event: eventId,
      status: 'approved'
    }).populate('user event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Valid registration not found'
      });
    }

    if (registration.attended) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this user'
      });
    }

    registration.attended = true;
    registration.attendedAt = new Date();
    await registration.save();

    res.json({
      success: true,
      message: 'Attendance marked successfully via QR scan',
      registration
    });
  } catch (error) {
    console.error('Scan QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan QR code',
      error: error.message
    });
  }
};

/**
 * @desc    Export registrations to CSV
 * @route   GET /api/admin/registrations/export
 * @access  Private/Admin
 */
export const exportRegistrations = async (req, res) => {
  try {
    const { eventId } = req.query;
    const filter = eventId ? { event: eventId } : {};

    const registrations = await Registration.find(filter)
      .populate('user', 'name email phone college year branch')
      .populate('event', 'name date');

    const csvData = [
      ['Event', 'Name', 'Email', 'Phone', 'College', 'Year', 'Branch', 'Status', 'Attended', 'Registered At'],
      ...registrations.map(reg => [
        reg.event?.name || '',
        reg.user?.name || '',
        reg.user?.email || '',
        reg.user?.phone || '',
        reg.user?.college || '',
        reg.user?.year || '',
        reg.user?.branch || '',
        reg.status,
        reg.attended ? 'Yes' : 'No',
        reg.createdAt.toISOString().split('T')[0]
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export registrations',
      error: error.message
    });
  }
};

export default {
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
  bulkApproveRegistrations,
  markAttendance,
  scanQRCode,
  exportRegistrations
};
