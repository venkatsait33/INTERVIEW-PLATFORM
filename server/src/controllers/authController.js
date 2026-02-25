/**
 * Auth Controller
 * Handles registration, login, and profile
 */

import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { logActivity, getRequestMeta } from "../services/activityService.js";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs";
import { sendUserRegisteredNotification } from "../services/emailService.js";

/**
 * POST /api/auth/register
 * Register a new user (admin only creates admin/hr; anyone can register as candidate/interviewer)
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role = "candidate" } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, "User with this email already exists");
    }

    // Prevent non-admin creating admin accounts
    if (role === "admin") {
      return sendError(res, 403, "Cannot register as admin");
    }

    const user = await User.create({ name, email, password, role });

    await logActivity({
      userId: user._id,
      action: "REGISTER",
      ...getRequestMeta(req),
    });

    const token = generateToken(user._id, user.role);

    logger.info(`New user registered: ${email} [${role}]`);

    sendUserRegisteredNotification(user, password);

    return sendSuccess(res, 201, "Registration successful", {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Register error:", error);
    return sendError(res, 500, "Registration failed");
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Find user and include password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    // 2️⃣ Compare password (IMPORTANT: await)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendError(res, 401, "Invalid email or password");
    }

    // 3️⃣ Check if account is active
    if (!user.isActive) {
      return sendError(res, 403, "Your account has been deactivated");
    }

    // 4️⃣ Update last login (better way — avoids save middleware)
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } },
    );

    // 5️⃣ Log activity
    await logActivity({
      userId: user._id,
      action: "LOGIN",
      ...getRequestMeta(req),
    });

    // 6️⃣ Generate JWT
    const token = generateToken(user._id, user.role);

    return sendSuccess(res, 200, "Login successful", {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    return sendError(res, 500, "Login failed");
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, 200, "User profile retrieved", { user });
  } catch (error) {
    return sendError(res, 500, "Failed to retrieve profile");
  }
};
