/**
 * User Routes
 */

import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  getInterviewers,
  getCandidates,
} from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();
// All user routes require auth
router.use(requireAuth);

// Admin only: list/manage all users
router.get("/", requireRole("admin"), getUsers);
router.get("/:id", requireRole("admin"), getUserById);
router.patch("/:id", requireRole("admin"), validate("updateUser"), updateUser);

// HR can list interviewers and candidates for scheduling
router.get("/list/interviewers", requireRole("admin", "hr"), getInterviewers);
router.get("/list/candidates", requireRole("admin", "hr"), getCandidates);

export default router;
