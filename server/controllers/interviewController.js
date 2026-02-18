/**
 * Interview Controller
 * Manages the full interview lifecycle
 */

const Interview = require("../models/Interview");
const User = require("../models/User");
const { generateRoomToken } = require("../utils/jwt");
const { sendSuccess, sendError } = require("../utils/response");
const { logActivity, getRequestMeta } = require("../services/activityService");
const emailService = require("../services/emailService");
const logger = require("../utils/logger");

// ─────────────────────────────────────────
// Helper: Pagination
// ─────────────────────────────────────────
const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

// ─────────────────────────────────────────
// Schedule Interview (HR only)
// ─────────────────────────────────────────

/**
 * POST /api/interviews
 */
const scheduleInterview = async (req, res) => {
  try {
    const {
      title,
      description,
      interviewerId,
      candidateId,
      scheduledAt,
      duration,
    } = req.body;

    // Validate interviewer exists and has correct role
    const interviewer = await User.findOne({
      _id: interviewerId,
      role: "interviewer",
      isActive: true,
    });
    if (!interviewer) {
      return sendError(res, 404, "Interviewer not found or inactive");
    }

    // Validate candidate exists and has correct role
    const candidate = await User.findOne({
      _id: candidateId,
      role: "candidate",
      isActive: true,
    });
    if (!candidate) {
      return sendError(res, 404, "Candidate not found or inactive");
    }

    // Check for scheduling conflicts (same interviewer within 1 hour)
    const conflictStart = new Date(scheduledAt);
    const conflictEnd = new Date(
      conflictStart.getTime() + (duration || 60) * 60000,
    );

    const conflict = await Interview.findOne({
      interviewer: interviewerId,
      status: { $in: ["SCHEDULED", "IN_PROGRESS"] },
      scheduledAt: {
        $lt: conflictEnd,
        $gt: new Date(conflictStart.getTime() - 60 * 60000),
      },
    });

    if (conflict) {
      return sendError(
        res,
        409,
        "Interviewer has a conflicting interview at this time",
      );
    }

    const interview = await Interview.create({
      title,
      description,
      interviewer: interviewerId,
      candidate: candidateId,
      createdBy: req.user._id,
      scheduledAt,
      duration,
    });

    // Send email notifications
    emailService
      .sendScheduleNotification(interview, interviewer, candidate)
      .catch((err) => logger.error("Schedule notification error:", err));

    await logActivity({
      userId: req.user._id,
      action: "SCHEDULE_INTERVIEW",
      interviewId: interview._id,
      ...getRequestMeta(req),
      details: { title, interviewerId, candidateId },
    });

    const populated = await Interview.findById(interview._id)
      .populate("interviewer", "name email")
      .populate("candidate", "name email")
      .populate("createdBy", "name email");

    return sendSuccess(res, 201, "Interview scheduled successfully", {
      interview: populated,
    });
  } catch (error) {
    logger.error("scheduleInterview error:", error);
    return sendError(res, 500, "Failed to schedule interview");
  }
};

// ─────────────────────────────────────────
// Get Interviews (role-filtered)
// ─────────────────────────────────────────

/**
 * GET /api/interviews
 */
const getInterviews = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const { user } = req;

    // Build role-specific filter
    let filter = {};

    if (user.role === "interviewer") {
      filter.interviewer = user._id;
    } else if (user.role === "candidate") {
      filter.candidate = user._id;
    } else if (user.role === "hr") {
      filter.createdBy = user._id;
    }
    // Admin sees all

    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: "i" };

    const total = await Interview.countDocuments(filter);
    const query = Interview.find(filter)
      .populate("interviewer", "name email")
      .populate("candidate", "name email")
      .populate("createdBy", "name")
      .sort({ scheduledAt: -1 })
      .lean();

    const interviews = await paginate(query, parseInt(page), parseInt(limit));

    return sendSuccess(
      res,
      200,
      "Interviews retrieved",
      { interviews },
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    );
  } catch (error) {
    logger.error("getInterviews error:", error);
    return sendError(res, 500, "Failed to retrieve interviews");
  }
};

// ─────────────────────────────────────────
// Get Single Interview
// ─────────────────────────────────────────

/**
 * GET /api/interviews/:id
 */
const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate("interviewer", "name email")
      .populate("candidate", "name email")
      .populate("createdBy", "name email");

    if (!interview) {
      return sendError(res, 404, "Interview not found");
    }

    // Access control: only assigned parties or admin/hr can view
    const userId = req.user._id.toString();
    const isAssigned =
      interview.interviewer._id.toString() === userId ||
      interview.candidate._id.toString() === userId;

    if (!["admin", "hr"].includes(req.user.role) && !isAssigned) {
      return sendError(res, 403, "Access denied");
    }

    return sendSuccess(res, 200, "Interview retrieved", { interview });
  } catch (error) {
    logger.error("getInterview error:", error);
    return sendError(res, 500, "Failed to retrieve interview");
  }
};

// ─────────────────────────────────────────
// Start Session (Interviewer only)
// ─────────────────────────────────────────

/**
 * POST /api/interviews/:id/start
 * Generates room token and notifies candidate
 */
const startSession = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate("candidate", "name email")
      .populate("interviewer", "name email");

    if (!interview) {
      return sendError(res, 404, "Interview not found");
    }

    // Only the assigned interviewer can start
    if (interview.interviewer._id.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        403,
        "Only the assigned interviewer can start this session",
      );
    }

    if (interview.status !== "SCHEDULED") {
      return sendError(
        res,
        400,
        `Cannot start interview with status: ${interview.status}`,
      );
    }

    // Generate short-lived room token
    const roomToken = generateRoomToken(
      req.user._id,
      interview._id,
      "interviewer",
    );

    // Update interview status
    interview.status = "IN_PROGRESS";
    interview.startedAt = new Date();
    interview.roomToken = roomToken;
    await interview.save();

    // Email candidate the secure join link
    emailService
      .sendSessionStartedNotification(interview, interview.candidate, roomToken)
      .catch((err) => logger.error("Session start notification error:", err));

    await logActivity({
      userId: req.user._id,
      action: "START_INTERVIEW",
      interviewId: interview._id,
      ...getRequestMeta(req),
    });

    return sendSuccess(res, 200, "Interview session started", {
      interviewId: interview._id,
      status: interview.status,
      roomToken, // Interviewer gets token directly
    });
  } catch (error) {
    logger.error("startSession error:", error);
    return sendError(res, 500, "Failed to start session");
  }
};

// ─────────────────────────────────────────
// Candidate Joins Lobby
// ─────────────────────────────────────────

/**
 * POST /api/interviews/:id/lobby
 * Candidate signals they are in the waiting lobby
 */
const joinLobby = async (req, res) => {
  try {
    const { token } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return sendError(res, 404, "Interview not found");
    }

    if (interview.candidate.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Access denied");
    }

    if (interview.status !== "IN_PROGRESS") {
      return sendError(res, 400, "Interview session has not started yet");
    }

    // Verify the room token
    try {
      const { verifyRoomToken } = require("../utils/jwt");
      const decoded = verifyRoomToken(token);
      if (decoded.interviewId !== req.params.id) {
        return sendError(res, 401, "Invalid room token");
      }
    } catch {
      return sendError(res, 401, "Room token is invalid or expired");
    }

    interview.candidateInLobby = true;
    await interview.save();

    await logActivity({
      userId: req.user._id,
      action: "JOIN_LOBBY",
      interviewId: interview._id,
      ...getRequestMeta(req),
    });

    return sendSuccess(res, 200, "Joined lobby successfully");
  } catch (error) {
    logger.error("joinLobby error:", error);
    return sendError(res, 500, "Failed to join lobby");
  }
};

// ─────────────────────────────────────────
// Admit Candidate (Interviewer only)
// ─────────────────────────────────────────

/**
 * POST /api/interviews/:id/admit
 */
const admitCandidate = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return sendError(res, 404, "Interview not found");
    }

    if (interview.interviewer.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        403,
        "Only the assigned interviewer can admit the candidate",
      );
    }

    if (!interview.candidateInLobby) {
      return sendError(res, 400, "Candidate has not joined the lobby yet");
    }

    interview.candidateAdmitted = true;
    await interview.save();

    const io = req.app.get("io");

    if (interview.candidateSocketId) {
      io.to(interview.candidateSocketId).emit("lobby:admitted", {
        interviewId: interview._id,
      });
    }

    await logActivity({
      userId: req.user._id,
      action: "ADMIT_CANDIDATE",
      interviewId: interview._id,
      ...getRequestMeta(req),
    });

    return sendSuccess(res, 200, "Candidate admitted to interview room");
  } catch (error) {
    logger.error("admitCandidate error:", error);
    return sendError(res, 500, "Failed to admit candidate");
  }
};

// ─────────────────────────────────────────
// Submit Feedback (Interviewer only)
// ─────────────────────────────────────────

/**
 * POST /api/interviews/:id/feedback
 */
const submitFeedback = async (req, res) => {
  try {
    const { feedback, technicalNotes, rating, result } = req.body;

    const interview = await Interview.findById(req.params.id).populate(
      "candidate",
      "name email",
    );

    if (!interview) {
      return sendError(res, 404, "Interview not found");
    }

    if (interview.interviewer.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        403,
        "Only the assigned interviewer can submit feedback",
      );
    }

    if (interview.status !== "IN_PROGRESS") {
      return sendError(
        res,
        400,
        "Can only submit feedback for in-progress interviews",
      );
    }

    interview.feedback = feedback;
    interview.technicalNotes = technicalNotes;
    interview.rating = rating;
    interview.result = result;
    interview.status = "COMPLETED";
    interview.endedAt = new Date();
    await interview.save();

    // Notify candidate of result
    emailService
      .sendResultNotification(interview, interview.candidate)
      .catch((err) => logger.error("Result notification error:", err));

    await logActivity({
      userId: req.user._id,
      action: "SUBMIT_FEEDBACK",
      interviewId: interview._id,
      ...getRequestMeta(req),
      details: { result, rating },
    });

    return sendSuccess(res, 200, "Feedback submitted and interview completed", {
      interview: {
        id: interview._id,
        status: interview.status,
        result: interview.result,
      },
    });
  } catch (error) {
    logger.error("submitFeedback error:", error);
    return sendError(res, 500, "Failed to submit feedback");
  }
};

// ─────────────────────────────────────────
// Cancel Interview (HR only)
// ─────────────────────────────────────────

/**
 * PATCH /api/interviews/:id/cancel
 */
const cancelInterview = async (req, res) => {
  try {
    const { reason } = req.body;

    const interview = await Interview.findById(req.params.id)
      .populate("interviewer", "name email")
      .populate("candidate", "name email");

    if (!interview) {
      return sendError(res, 404, "Interview not found");
    }

    if (["COMPLETED", "CANCELLED"].includes(interview.status)) {
      return sendError(
        res,
        400,
        `Cannot cancel interview with status: ${interview.status}`,
      );
    }

    interview.status = "CANCELLED";
    await interview.save();

    // Notify both parties
    emailService
      .sendCancellationNotification(
        interview,
        [interview.interviewer, interview.candidate],
        reason,
      )
      .catch((err) => logger.error("Cancellation notification error:", err));

    await logActivity({
      userId: req.user._id,
      action: "CANCEL_INTERVIEW",
      interviewId: interview._id,
      ...getRequestMeta(req),
      details: { reason },
    });

    return sendSuccess(res, 200, "Interview cancelled");
  } catch (error) {
    logger.error("cancelInterview error:", error);
    return sendError(res, 500, "Failed to cancel interview");
  }
};

module.exports = {
  scheduleInterview,
  getInterviews,
  getInterview,
  startSession,
  joinLobby,
  admitCandidate,
  submitFeedback,
  cancelInterview,
};
