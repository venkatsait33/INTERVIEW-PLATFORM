/**
 * User Model
 * Handles authentication and role-based access
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries
    },
    role: {
      type: String,
      enum: ["admin", "hr", "interviewer", "candidate"],
      default: "candidate",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ─────────────────────────────────────────
// ✅ FIXED Pre-save middleware (Modern Mongoose way)
// ─────────────────────────────────────────
userSchema.pre("save", async function () {
  // Only hash password if it was modified
  if (!this.isModified("password")) return;

  // Hash password with cost factor 12
  this.password = await bcrypt.hash(this.password, 12);

  // Optional: update passwordChangedAt if not new document
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
});

// ─────────────────────────────────────────
// Instance Methods
// ─────────────────────────────────────────

/**
 * Compare provided password with hashed password
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if password was changed after JWT was issued
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model("User", userSchema);

export default User;
