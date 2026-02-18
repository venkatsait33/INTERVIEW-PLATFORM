/**
 * Database Seed Script
 * Creates demo users for testing all roles
 * Run: node utils/seed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const seedUsers = [
  {
    name: "Admin User",
    email: "admin@demo.com",
    password: "password123",
    role: "admin",
  },
  {
    name: "HR Manager",
    email: "hr@demo.com",
    password: "password123",
    role: "hr",
  },
  {
    name: "Senior Interviewer",
    email: "interviewer@demo.com",
    password: "password123",
    role: "interviewer",
  },
  {
    name: "Jane Candidate",
    email: "candidate@demo.com",
    password: "password123",
    role: "candidate",
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`✅ Created: ${userData.email} [${userData.role}]`);
      } else {
        console.log(`⚠️  Skipped: ${userData.email} (already exists)`);
      }
    }

    console.log("\n🎉 Seed complete!");
    console.log("\nDemo credentials:");
    seedUsers.forEach((u) =>
      console.log(`  ${u.role.padEnd(12)} → ${u.email} / ${u.password}`),
    );
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
