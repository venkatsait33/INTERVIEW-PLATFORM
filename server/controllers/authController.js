/**
 * Auth Controller
 * Handles registration, login, and profile
 */

const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity, getRequestMeta } = require('../services/activityService');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register
 * Register a new user (admin only creates admin/hr; anyone can register as candidate/interviewer)
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'candidate' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'User with this email already exists');
    }

    // Prevent non-admin creating admin accounts
    if (role === 'admin') {
      return sendError(res, 403, 'Cannot register as admin');
    }

    const user = await User.create({ name, email, password, role });

    await logActivity({
      userId: user._id,
      action: 'REGISTER',
      ...getRequestMeta(req),
    });

    const token = generateToken(user._id, user.role);

    logger.info(`New user registered: ${email} [${role}]`);

    return sendSuccess(res, 201, 'Registration successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Register error:', error);
    return sendError(res, 500, 'Registration failed');
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password (select: false on schema)
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, 401, 'Invalid email or password');
    }

    if (!user.isActive) {
      return sendError(res, 401, 'Your account has been deactivated');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await logActivity({
      userId: user._id,
      action: 'LOGIN',
      ...getRequestMeta(req),
    });

    const token = generateToken(user._id, user.role);

    return sendSuccess(res, 200, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    return sendError(res, 500, 'Login failed');
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, 200, 'User profile retrieved', { user });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve profile');
  }
};

module.exports = { register, login, getMe };
