/**
 * Socket.io Server
 * Handles real-time: signaling, lobby, code sync, WebRTC
 */

const { Server } = require("socket.io");
const { verifyToken, verifyRoomToken } = require("../utils/jwt");
const User = require("../models/User");
const Interview = require("../models/Interview");
const logger = require("../utils/logger");

// Track active rooms: { interviewId: { interviewerSocketId, candidateSocketId, code } }
const activeRooms = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // For multi-instance scaling, add Redis adapter here:
    // adapter: createAdapter(pubClient, subClient)
  });

  // ─────────────────────────────────────────
  // Socket Authentication Middleware
  // ─────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const roomToken = socket.handshake.auth.roomToken;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify main JWT
      let decoded;
      try {
        decoded = verifyToken(token);
      } catch {
        return next(new Error("Invalid or expired token"));
      }

      const user = await User.findById(decoded.id).lean();
      if (!user || !user.isActive) {
        return next(new Error("User not found or inactive"));
      }

      // Attach user to socket
      socket.user = user;
      socket.userId = user._id.toString();

      // If connecting to a room, verify room token
      if (roomToken) {
        try {
          const roomDecoded = verifyRoomToken(roomToken);
          socket.roomToken = roomDecoded;
          socket.interviewId = roomDecoded.interviewId;
        } catch {
          return next(new Error("Invalid or expired room token"));
        }
      }

      next();
    } catch (error) {
      logger.error("Socket auth error:", error);
      next(new Error("Authentication failed"));
    }
  });

  // ─────────────────────────────────────────
  // Connection Handler
  // ─────────────────────────────────────────
  io.on("connection", (socket) => {
    logger.info(
      `Socket connected: ${socket.id} [${socket.user.role}] ${socket.user.name}`,
    );

    // ── Join Interview Room ──
    socket.on("room:join", async ({ interviewId }) => {
      try {
        const interview = await Interview.findById(interviewId);
        if (!interview) {
          return socket.emit("error", { message: "Interview not found" });
        }

        const userId = socket.userId;
        const role = socket.user.role;

        const isInterviewer = interview.interviewer.toString() === userId;
        const isCandidate = interview.candidate.toString() === userId;

        if (!isInterviewer && !isCandidate) {
          return socket.emit("error", {
            message: "Not authorized for this interview room",
          });
        }

        if (isCandidate && !interview.candidateAdmitted) {
          return socket.emit("error", {
            message: "Not yet admitted to room. Please wait in lobby.",
          });
        }

        socket.join(interviewId);
        socket.currentRoom = interviewId;

        if (!activeRooms.has(interviewId)) {
          activeRooms.set(interviewId, {
            code: "// Start coding here...\n",
            participants: {},
          });
        }

        const room = activeRooms.get(interviewId);

        // Add participant (keyed by socketId)
        room.participants[socket.id] = {
          socketId: socket.id,
          userId,
          role,
          name: socket.user.name,
        };

        // 🔥 Always emit FULL authoritative list
        io.to(interviewId).emit("room:update-participants", {
          participants: Object.values(room.participants),
        });

        // Send room joined confirmation
        socket.emit("room:joined", {
          interviewId,
          code: room.code,
        });
      } catch (error) {
        logger.error("room:join error:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ── Lobby: Candidate Waiting ──
    socket.on("lobby:enter", async ({ interviewId }) => {
      try {
        const interview = await Interview.findById(interviewId);
        if (!interview) return;

        if (interview.candidate.toString() !== socket.userId) return;

        // 🔥 UPDATE DB STATE
        interview.candidateInLobby = true;
        interview.candidateJoinedLobby = true;
        interview.candidateSocketId = socket.id; // optional
        await interview.save();

        // const io = req.app.get("io");

        // if (!interview.candidateSocketId) {
        //   io.to(interview.candidateSocketId).emit("lobby:admitted", {
        //     interviewId: interview._id,
        //   });
        // }

        // Notify the interviewer's socket
        socket
          .to(`interviewer-${interview.interviewer.toString()}`)
          .emit("lobby:candidate-waiting", {
            interviewId,
            candidateName: socket.user.name,
            candidateId: socket.userId,
          });

        socket.emit("lobby:entered", {
          message: "Waiting for interviewer to admit you...",
        });
      } catch (error) {
        logger.error("lobby:enter error:", error);
      }
    });

    // ── Interviewer Subscribes to Lobby Notifications ──
    socket.on("lobby:subscribe", ({ interviewId }) => {
      if (socket.user.role === "interviewer") {
        socket.join(`interviewer-${socket.userId}`);
      }
    });

    // ── Admit Candidate (Interviewer triggers) ──
    socket.on("lobby:admit", async ({ interviewId, candidateId }) => {
      try {
        const interview = await Interview.findById(interviewId);
        if (!interview) return;
        if (interview.interviewer.toString() !== socket.userId) return;

        // Notify the candidate they're admitted
        io.to(`candidate-${candidateId}`).emit("lobby:admitted", {
          interviewId,
          message: "You have been admitted! Joining room now...",
        });

        logger.info(
          `Candidate ${candidateId} admitted to interview ${interviewId}`,
        );
      } catch (error) {
        logger.error("lobby:admit error:", error);
      }
    });

    // ── Candidate Personal Room for Direct Messages ──
    socket.on("subscribe:personal", () => {
      if (socket.user.role === "candidate") {
        socket.join(`candidate-${socket.userId}`);
      }
    });

    // ── Code Sync (with debounce on client side) ──
    socket.on("code:update", ({ interviewId, code, cursorPosition }) => {
      if (!socket.currentRoom || socket.currentRoom !== interviewId) return;

      // Update stored code
      const room = activeRooms.get(interviewId);
      if (room) {
        room.code = code;
      }

      // Broadcast to others in room (not sender)
      socket.to(interviewId).emit("code:updated", {
        code,
        cursorPosition,
        updatedBy: socket.user.name,
      });
    });

    // ── WebRTC Signaling ──
    socket.on("webrtc:offer", ({ interviewId, offer, targetId }) => {
      io.to(interviewId).except(socket.id).emit("webrtc:offer", {
        offer,
        fromId: socket.id,
        fromName: socket.user.name,
      });
    });

    socket.on("webrtc:answer", ({ interviewId, answer, targetId }) => {
      io.to(targetId).emit("webrtc:answer", { answer, fromId: socket.id });
    });

    socket.on(
      "webrtc:ice-candidate",
      ({ interviewId, candidate, targetId }) => {
        io.to(targetId || interviewId)
          .except(socket.id)
          .emit("webrtc:ice-candidate", {
            candidate,
            fromId: socket.id,
          });
      },
    );

    // ── Chat within room ──
    socket.on("chat:message", ({ interviewId, message }) => {
      if (!socket.currentRoom || socket.currentRoom !== interviewId) return;
      if (message.length > 500) return; // Prevent abuse

      io.to(interviewId).emit("chat:message", {
        from: socket.user.name,
        role: socket.user.role,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    // ── Disconnect ──
    socket.on("disconnect", async () => {
      logger.info(`Socket disconnected: ${socket.id} [${socket.user?.name}]`);

      if (socket.currentRoom) {
        const room = activeRooms.get(socket.currentRoom);

        if (room) {
          delete room.participants[socket.id];

          if (Object.keys(room.participants).length === 0) {
            activeRooms.delete(socket.currentRoom);
          } else {
            // 🔥 Re-emit full participant list
            io.to(socket.currentRoom).emit("room:update-participants", {
              participants: Object.values(room.participants),
            });
          }
        }
      }
    });
  });

  logger.info("Socket.io server initialized");
  return io;
};

module.exports = { initializeSocket };
