/**
 * Enterprise Interview Management Platform
 * Main Server Entry Point
 */

import dotenv from "dotenv";
dotenv.config();
import http from "http";
import app from "./src/app.js";
import { initializeSocket } from "./src/socket/index.js";
import connectDB from "./src/utils/db.js";
import logger from "./src/utils/logger.js";

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);
app.set("io", io);

// Start server
server.listen(PORT, () => {
  logger.info(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
  logger.info(`📡 Socket.io initialized`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});
