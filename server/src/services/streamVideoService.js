import { StreamClient } from "@stream-io/node-sdk";
import dotenv from "dotenv";
dotenv.config();

const streamClient = new StreamClient(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET,
);

/**
 * Generate a secure Stream Video token for a user.
 * Token expires in 2 hours — never expose STREAM_API_SECRET to the frontend.
 *
 * @param {string} userId - MongoDB user _id as string
 * @returns {string} Signed Stream user token
 */
export const generateVideoToken = (userId) => {
  const expiresAt = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 hours

  return streamClient.generateUserToken({
    user_id: userId,
    exp: expiresAt,
  });
};
