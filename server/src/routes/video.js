import express from "express";
import { generateVideoToken } from "../services/streamVideoService.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/video/token
 * Returns a Stream Video token for the authenticated user.
 * Called by the frontend when initializing the video client.
 */
router.get("/token", requireAuth, async (req, res) => {
  try {
    const { _id, name, role } = req.user;
    const userId = _id.toString();

    const token = generateVideoToken(userId);

    return res.json({
      success: true,
      token,
      userId,
      name,
      role,
    });
  } catch (error) {
    console.error("Stream token error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate video token",
    });
  }
});

export default router;
