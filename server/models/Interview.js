/**
 * Interview Model
 * Core data model for the interview lifecycle
 */

const mongoose = require('mongoose');

const INTERVIEW_STATUS = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const INTERVIEW_RESULT = ['PENDING', 'HIRED', 'REJECTED'];

const interviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Interview title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Interviewer is required"],
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Candidate is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: [true, "Scheduled time is required"],
    },
    duration: {
      type: Number, // Duration in minutes
      default: 60,
      min: [15, "Duration must be at least 15 minutes"],
      max: [480, "Duration cannot exceed 8 hours"],
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: INTERVIEW_STATUS,
      default: "SCHEDULED",
    },
    result: {
      type: String,
      enum: INTERVIEW_RESULT,
      default: "PENDING",
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [5000, "Feedback cannot exceed 5000 characters"],
    },
    // Short-lived JWT for secure room access
    roomToken: {
      type: String,
      select: false,
    },
    // Technical assessment notes
    technicalNotes: {
      type: String,
      maxlength: [2000],
    },
    // Rating out of 10
    rating: {
      type: Number,
      min: 1,
      max: 10,
    },
    // Tracks if candidate joined the lobby
    candidateInLobby: {
      type: Boolean,
      default: false,
    },
    // Tracks if candidate was admitted to room
    candidateAdmitted: {
      type: Boolean,
      default: false,
    },
    candidateJoinedLobby: {
      type: Boolean,
      default: false,
    },
    candidateSocketId: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─────────────────────────────────────────
// Indexes for performance
// ─────────────────────────────────────────
interviewSchema.index({ status: 1 });
interviewSchema.index({ interviewer: 1 });
interviewSchema.index({ candidate: 1 });
interviewSchema.index({ scheduledAt: 1 });
interviewSchema.index({ createdBy: 1 });
interviewSchema.index({ status: 1, scheduledAt: 1 });

// ─────────────────────────────────────────
// Virtual: computed duration of actual interview
// ─────────────────────────────────────────
interviewSchema.virtual('actualDurationMinutes').get(function () {
  if (this.startedAt && this.endedAt) {
    return Math.round((this.endedAt - this.startedAt) / 60000);
  }
  return null;
});

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
module.exports.INTERVIEW_STATUS = INTERVIEW_STATUS;
module.exports.INTERVIEW_RESULT = INTERVIEW_RESULT;
