/**
 * Socket.io Server — InterviewPro
 *
 * Events handled:
 *  subscribe:personal       — join personal notification room
 *  lobby:subscribe          — interviewer subscribes to lobby alerts
 *  lobby:enter              — candidate signals they are waiting
 *  lobby:admit              — interviewer admits candidate
 *  room:join                — join interview room
 *  code:update              — live code sync (debounced by client)
 *  language:change          — language selector sync
 *  code:run-start           — one user started execution → spinner on both
 *  code:run-result          — execution done → output shown on BOTH sides ← NEW
 *  chat:message             — in-room chat
 *  cursor:move              — optional cursor position broadcast ← NEW
 *  webrtc:offer/answer/ice  — WebRTC signaling
 */

import { Server } from "socket.io";
import { verifyToken, verifyRoomToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Interview from "../models/Interview.js";
import logger from "../utils/logger.js";

// Track active rooms: { interviewId: { interviewerSocketId, candidateSocketId, code } }
const activeRooms = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // For multi-instance scaling, add Redis adapter here:
    // adapter: createAdapter(pubClient, subClient)
    transports: ["polling", "websocket"],
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
    // ── Subscribe to personal room (candidate / interviewer notifications) ──
    socket.on("subscribe:personal", () => {
      const personalRoom = `user-${socket.userId}`;
      socket.join(personalRoom);
      logger.debug(
        `${socket.user.name} subscribed to personal room ${personalRoom}`,
      );
    });
    // ── Join Interview Room ──
    socket.on("room:join", async ({ interviewId }) => {
      try {
        const interview = await Interview.findById(interviewId);
        if (!interview) {
          return socket.emit("error", { message: "Interview not found" });
        }

        const userId = socket.userId;
        const role = socket.user.role;

        // Verify user is assigned to this interview
        const isInterviewer = interview.interviewer.toString() === userId;
        const isCandidate = interview.candidate.toString() === userId;

        if (!isInterviewer && !isCandidate) {
          return socket.emit("error", {
            message: "Not authorized for this interview room",
          });
        }

        // Candidate must be admitted before entering room
        if (isCandidate && !interview.candidateAdmitted) {
          return socket.emit("error", {
            message: "Not yet admitted to room. Please wait in lobby.",
          });
        }

        if (isCandidate && interview.candidateAdmitted) {
          interview.candidateInLobby = false;
          interview.candidateSocketId = null;
          await interview.save();
        }

        // Join socket room
        socket.join(interviewId);
        socket.currentRoom = interviewId;

        // Track room state
        if (!activeRooms.has(interviewId)) {
          activeRooms.set(interviewId, {
            code: "// Start coding here…\n",
            language: "javascript",
            output: null, // last run result
            participants: {},
            messages: [],
          });
        }

        const room = activeRooms.get(interviewId);
        room.participants[socket.id] = { userId, role, name: socket.user.name };

        // Send current code to the joining participant
        socket.emit("room:joined", {
          interviewId,
          code: room.code,
          language: room.language,
          output: room.output, // sync last run so late-joiner sees it
          participants: Object.values(room.participants),
          messages: room.messages.slice(-50),
        });

        // Notify others in room
        socket.to(interviewId).emit("room:participant-joined", {
          userId,
          name: socket.user.name,
          role,
        });

        logger.info(`[room] ${socket.user.name} joined room ${interviewId}`);
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

        interview.candidateInLobby = true;
        interview.candidateSocketId = socket.id;
        await interview.save();
        // Join personal room (important for admit emit)
        socket.join(`candidate-${socket.userId}`);

        // Notify interviewer dashboard
        io.to(`interviewer-${interview.interviewer.toString()}`).emit(
          "lobby:candidate-waiting",
          {
            interviewId,
            candidateName: socket.user.name,
            candidateId: socket.userId,
          },
        );

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
    socket.on("code:update", ({ interviewId, code }) => {
      if (!socket.currentRoom || socket.currentRoom !== interviewId) return;

      // Update stored code
      const room = activeRooms.get(interviewId);
      if (room) {
        room.code = code;
      }

      // Broadcast to others in room (not sender)
      socket.to(interviewId).emit("code:updated", {
        code,
        updatedBy: socket.user.name,
      });
    });
    // ── Language change sync ───────────────────────────────
    // Both sides share the same language selector.
    socket.on("language:change", ({ interviewId, language }) => {
      if (socket.currentRoom !== interviewId) return;
      const room = activeRooms.get(interviewId);
      if (room) room.language = language;
      // Tell the OTHER participant to switch their editor language
      socket.to(interviewId).emit("language:changed", {
        language,
        changedBy: socket.user.name,
      });
    });

    // ── Shared code execution ──────────────────────────────
    //
    // PROTOCOL:
    //   Client clicks Run
    //   → emits  code:run-start          (server fans out to room → spinner on both)
    //   → calls  Piston API
    //   → emits  code:run-result         (server fans out to room → output on BOTH)
    //
    // The server stores the last result in room state so late-joiners receive
    // it via room:joined above.

    socket.on("code:run-start", ({ interviewId }) => {
      if (socket.currentRoom !== interviewId) return;
      // io.to → broadcast to ALL including sender (both see spinner)
      io.to(interviewId).emit("code:running", {
        startedBy: socket.user.name,
        startedAt: new Date().toISOString(),
      });
    });

    socket.on(
      "code:run-result",
      ({ interviewId, output, stderr, exitCode, language, runtime }) => {
        if (socket.currentRoom !== interviewId) return;

        const result = {
          output: output ?? "",
          stderr: stderr ?? "",
          exitCode: exitCode ?? 0,
          language,
          runtime: runtime ?? null, // execution time in ms (optional)
          runBy: socket.user.name,
          timestamp: new Date().toISOString(),
        };

        // Persist so new joiners see the last output
        const room = activeRooms.get(interviewId);
        if (room) room.output = result;

        // ← KEY: io.to broadcasts to ALL in room (including sender)
        io.to(interviewId).emit("code:run-result", result);

        logger.info(
          `[code] run by ${socket.user.name} in ${interviewId} | exit=${exitCode}`,
        );
      },
    );

    // ── Optional: cursor position sync ────────────────────
    // Gives a ghost cursor so each person can see where the other is typing.
    socket.on("cursor:move", ({ interviewId, line, column }) => {
      if (socket.currentRoom !== interviewId) return;
      socket.to(interviewId).emit("cursor:moved", {
        userId: socket.userId,
        name: socket.user.name,
        role: socket.user.role,
        line,
        column,
      });
    });

    // ── Chat within room ──
    socket.on("chat:message", ({ interviewId, message }) => {
      if (!socket.currentRoom || socket.currentRoom !== interviewId) return;
      if (!message || typeof message !== "string") return;

      const trimmed = message.trim();
      if (!trimmed || trimmed.length > 1000) return; // basic abuse prevention

      const chatMsg = {
        id: `${Date.now()}-${socket.id}`,
        from: socket.user.name,
        fromId: socket.userId,
        role: socket.user.role,
        message: trimmed,
        timestamp: new Date().toISOString(),
      };

      // Persist in-memory (last 200 messages per room)
      const room = activeRooms.get(interviewId);
      if (room) {
        room.messages.push(chatMsg);
        if (room.messages.length > 200) room.messages.shift();
      }

      // Broadcast to everyone in the room including sender
      io.to(interviewId).emit("chat:message", chatMsg);
    });

    // ── Disconnect ──
    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id} [${socket.user?.name}]`);

      if (socket.currentRoom) {
        const room = activeRooms.get(socket.currentRoom);
        if (room) {
          delete room.participants[socket.id];
          if (Object.keys(room.participants).length === 0) {
            // Keep the room alive briefly in case of reconnect
            setTimeout(() => {
              const r = activeRooms.get(socket.currentRoom);
              if (r && Object.keys(r.participants).length === 0) {
                activeRooms.delete(socket.currentRoom);
                logger.info(`[room] pruned ${socket.currentRoom}`);
              }
            }, 30000);
          }
        }

        socket.to(socket.currentRoom).emit("room:participant-left", {
          userId: socket.userId,
          name: socket.user.name,
          role: socket.user.role,
        });
      }
    });
  });

  logger.info("Socket.io server initialized");
  return io;
};
