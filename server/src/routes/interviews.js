/**
 * Interview Routes
 */

import express from "express";
import {
  scheduleInterview,
  getInterviews,
  getInterview,
  startSession,
  joinLobby,
  admitCandidate,
  submitFeedback,
  cancelInterview,
} from "../controllers/interviewController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();
router.use(requireAuth);

// Get all interviews (role-filtered automatically)
router.get("/", getInterviews);

// Get single interview
router.get("/:id", getInterview);

// HR creates an interview
router.post(
  "/",
  requireRole("hr", "admin"),
  validate("scheduleInterview"),
  scheduleInterview,
);

// Interviewer starts the session
router.post("/:id/start", requireRole("interviewer"), startSession);

// Candidate joins the lobby
router.post("/:id/lobby", requireRole("candidate"), joinLobby);

// Interviewer admits candidate
router.post("/:id/admit", requireRole("interviewer"), admitCandidate);

// Interviewer submits feedback and completes interview
router.post(
  "/:id/feedback",
  requireRole("interviewer"),
  validate("submitFeedback"),
  submitFeedback,
);

// HR cancels interview
router.patch("/:id/cancel", requireRole("hr", "admin"), cancelInterview);

export default router;
