/**
 * NotificationLog Model
 * Tracks all email notifications sent by the system
 */

import mongoose from "mongoose";

const notificationLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
    },
    type: {
      type: String,
      enum: ["SCHEDULE", "START", "RESULT", "CANCELLATION", "REMINDER"],
      required: true,
    },
    status: {
      type: String,
      enum: ["SENT", "FAILED", "PENDING"],
      default: "PENDING",
    },
    recipient: {
      type: String, // Email address
      required: true,
    },
    subject: {
      type: String,
    },
    errorMessage: {
      type: String, // Capture failure reason
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Extra data about the notification
    },
  },
  {
    timestamps: true,
  },
);

notificationLogSchema.index({ user: 1 });
notificationLogSchema.index({ interview: 1 });
notificationLogSchema.index({ status: 1 });
notificationLogSchema.index({ createdAt: -1 });

export const NotificationLog = mongoose.model(
  "NotificationLog",
  notificationLogSchema,
);

/**
 * ActivityLog Model
 * Audit trail for all significant actions in the system
 */

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGOUT",
        "REGISTER",
        "SCHEDULE_INTERVIEW",
        "START_INTERVIEW",
        "COMPLETE_INTERVIEW",
        "CANCEL_INTERVIEW",
        "SUBMIT_FEEDBACK",
        "JOIN_LOBBY",
        "ADMIT_CANDIDATE",
        "UPDATE_RESULT",
        "UPDATE_USER",
        "DELETE_USER",
      ],
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Additional context
    },
  },
  {
    timestamps: true,
  },
);

activityLogSchema.index({ user: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ interviewId: 1 });
activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
