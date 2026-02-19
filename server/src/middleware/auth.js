/**
 * Authentication & Authorization Middleware
 * Protects routes and enforces role-based access control (RBAC)
 */

import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { sendError } from "../utils/response.js";
import logger from "../utils/logger.js";

/**
 * requireAuth - Verifies JWT and attaches user to request
 * Must be used before requireRole
 */
export const requireAuth = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return sendError(
        res,
        401,
        "You are not logged in. Please log in to get access.",
      );
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return sendError(
          res,
          401,
          "Your session has expired. Please log in again.",
        );
      }
      return sendError(res, 401, "Invalid token. Please log in again.");
    }

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return sendError(
        res,
        401,
        "The user belonging to this token no longer exists.",
      );
    }

    // 4. Check if user is active
    if (!currentUser.isActive) {
      return sendError(
        res,
        401,
        "Your account has been deactivated. Please contact support.",
      );
    }

    // 5. Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return sendError(
        res,
        401,
        "User recently changed password. Please log in again.",
      );
    }

    // Attach user to request object
    req.user = currentUser;
    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    return sendError(res, 500, "Authentication error");
  }
};

/**
 * requireRole - Restricts access to specific roles
 * Must be used after requireAuth
 * @param {...string} roles - Allowed role(s)
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${req.user.role}`,
      );
    }
    next();
  };
};
