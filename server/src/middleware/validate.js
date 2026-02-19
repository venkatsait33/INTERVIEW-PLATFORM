/**
 * Input Validation Middleware
 * Uses Joi for schema-based request validation
 */

import Joi from "joi";
import { sendError } from "../utils/response.js";

// ─────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────

export const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid("hr", "interviewer", "candidate"),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  scheduleInterview: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000),
    interviewerId: Joi.string().hex().length(24).required(),
    candidateId: Joi.string().hex().length(24).required(),
    scheduledAt: Joi.date().greater("now").required(),
    duration: Joi.number().min(15).max(480).default(60),
  }),

  updateInterview: Joi.object({
    title: Joi.string().min(3).max(200),
    description: Joi.string().max(1000),
    scheduledAt: Joi.date().greater("now"),
    duration: Joi.number().min(15).max(480),
  }),

  submitFeedback: Joi.object({
    feedback: Joi.string().max(5000).required(),
    technicalNotes: Joi.string().max(2000),
    rating: Joi.number().min(1).max(10),
    result: Joi.string().valid("HIRED", "REJECTED").required(),
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    role: Joi.string().valid("admin", "hr", "interviewer", "candidate"),
    isActive: Joi.boolean(),
  }),
};

/**
 * Validation middleware factory
 * @param {string} schemaName - Key in schemas object
 * @returns {Function} Express middleware
 */
export const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(); // No schema, skip validation
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));
      return sendError(res, 400, "Validation failed", errors);
    }

    req.body = value; // Use sanitized values
    next();
  };
};
