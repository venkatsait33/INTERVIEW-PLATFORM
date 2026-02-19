/**
 * JWT Utility Functions
 * Handles token generation and verification
 */

import jwt from "jsonwebtoken";

/**
 * Generate a standard access token for authentication
 * @param {string} userId - User's MongoDB _id
 * @param {string} role - User's role
 * @returns {string} Signed JWT token
 */
export const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Generate a short-lived room access token (15 minutes)
 * Used to create secure interview room join links
 * @param {string} userId - User's MongoDB _id
 * @param {string} interviewId - Interview's MongoDB _id
 * @param {string} role - User's role
 * @returns {string} Signed short-lived JWT
 */
export const generateRoomToken = (userId, interviewId, role) => {
  return jwt.sign(
    { id: userId, interviewId, role, type: "room_access" },
    process.env.JWT_ROOM_SECRET,
    { expiresIn: process.env.JWT_ROOM_EXPIRES_IN || "15m" },
  );
};

/**
 * Verify a standard JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify a room access JWT token
 * @param {string} token - Room JWT token to verify
 * @returns {object} Decoded token payload
 */
export const verifyRoomToken = (token) => {
  return jwt.verify(token, process.env.JWT_ROOM_SECRET);
};
