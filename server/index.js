/**
 * Enterprise Interview Management Platform
 * Main Server Entry Point
 */

require("dotenv").config();
const http = require("http");
const app = require("./app");
const { initializeSocket } = require("./socket");
const connectDB = require("./utils/db");
const logger = require("./utils/logger");

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
