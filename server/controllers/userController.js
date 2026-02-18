/**
 * User Controller
 * CRUD operations for user management
 */

const User = require('../models/User');
const Interview = require('../models/Interview');
const { ActivityLog } = require('../models/Logs');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity, getRequestMeta } = require('../services/activityService');
const logger = require('../utils/logger');

// ─────────────────────────────────────────
// Get All Users (Admin only)
// ─────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    return sendSuccess(res, 200, 'Users retrieved', { users }, {
      page: parseInt(page), limit: parseInt(limit), total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve users');
  }
};

// ─────────────────────────────────────────
// Get User By ID
// ─────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'User retrieved', { user });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve user');
  }
};

// ─────────────────────────────────────────
// Update User (Admin only)
// ─────────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    );

    if (!user) return sendError(res, 404, 'User not found');

    await logActivity({
      userId: req.user._id,
      action: 'UPDATE_USER',
      ...getRequestMeta(req),
      details: { targetUserId: req.params.id, changes: req.body },
    });

    return sendSuccess(res, 200, 'User updated', { user });
  } catch (error) {
    logger.error('updateUser error:', error);
    return sendError(res, 500, 'Failed to update user');
  }
};

// ─────────────────────────────────────────
// Get Interviewers list (for HR scheduling)
// ─────────────────────────────────────────
const getInterviewers = async (req, res) => {
  try {
    const interviewers = await User.find({ role: 'interviewer', isActive: true })
      .select('name email')
      .lean();
    return sendSuccess(res, 200, 'Interviewers retrieved', { interviewers });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve interviewers');
  }
};

// ─────────────────────────────────────────
// Get Candidates list (for HR scheduling)
// ─────────────────────────────────────────
const getCandidates = async (req, res) => {
  try {
    const candidates = await User.find({ role: 'candidate', isActive: true })
      .select('name email')
      .lean();
    return sendSuccess(res, 200, 'Candidates retrieved', { candidates });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve candidates');
  }
};

module.exports = { getUsers, getUserById, updateUser, getInterviewers, getCandidates };

// ─────────────────────────────────────────
// Admin Controller
// ─────────────────────────────────────────

/**
 * GET /api/admin/stats
 * System-wide analytics for admin dashboard
 */
const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalInterviews,
      activeInterviews,
      completedInterviews,
      hiredCount,
      rejectedCount,
      roleBreakdown,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments(),
      Interview.countDocuments(),
      Interview.countDocuments({ status: 'IN_PROGRESS' }),
      Interview.countDocuments({ status: 'COMPLETED' }),
      Interview.countDocuments({ result: 'HIRED' }),
      Interview.countDocuments({ result: 'REJECTED' }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('user', 'name role')
        .lean(),
    ]);

    const hiringRate = completedInterviews > 0
      ? ((hiredCount / completedInterviews) * 100).toFixed(1)
      : 0;

    return sendSuccess(res, 200, 'Stats retrieved', {
      totalUsers,
      totalInterviews,
      activeInterviews,
      completedInterviews,
      hiredCount,
      rejectedCount,
      hiringRate: parseFloat(hiringRate),
      roleBreakdown,
      recentActivity,
    });
  } catch (error) {
    logger.error('getSystemStats error:', error);
    return sendError(res, 500, 'Failed to retrieve stats');
  }
};

/**
 * GET /api/admin/activity-logs
 */
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.user = userId;

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name email role')
      .populate('interviewId', 'title')
      .lean();

    return sendSuccess(res, 200, 'Activity logs retrieved', { logs }, {
      page: parseInt(page), limit: parseInt(limit), total,
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve activity logs');
  }
};

// Add admin functions to the module exports separately
module.exports.getSystemStats = getSystemStats;
module.exports.getActivityLogs = getActivityLogs;
