/**
 * Admin Routes
 */

import express from "express";
import {
  getSystemStats,
  getActivityLogs,
} from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

router.get("/stats", getSystemStats);
router.get("/activity-logs", getActivityLogs);

export default router;
