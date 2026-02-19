/**
 * Activity Log Service
 * Records audit trail for all significant actions
 */

import { ActivityLog } from "../models/Logs.js";
import logger from "../utils/logger.js";

/**
 * Log an activity action
 * @param {object} params
 * @param {string} params.userId - User performing the action
 * @param {string} params.action - Action type (from ActivityLog enum)
 * @param {string} [params.interviewId] - Related interview (optional)
 * @param {string} [params.ipAddress] - Request IP address
 * @param {string} [params.userAgent] - Browser user agent
 * @param {object} [params.details] - Additional context
 */
export const logActivity = async ({
  userId,
  action,
  interviewId,
  ipAddress,
  userAgent,
  details,
}) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      interviewId: interviewId || undefined,
      ipAddress,
      userAgent,
      details,
    });
  } catch (error) {
    // Logging failure should not break main flow
    logger.error("Failed to create activity log:", error.message);
  }
};

/**
 * Helper to extract request metadata
 * @param {object} req - Express request object
 * @returns {{ ipAddress, userAgent }}
 */
export const getRequestMeta = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress,
  userAgent: req.headers["user-agent"],
});
