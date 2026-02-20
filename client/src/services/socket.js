/**
 * Socket.io Client Service
 * Singleton connection manager with auth
 */

import { io } from "socket.io-client";

let socket = null;

export const getSocket = (roomToken = null) => {
  if (!socket || !socket.connected) {
    const token = localStorage.getItem("token");
    socket = io(import.meta.env.VITE_BACKEND_URL, {
      auth: { token, roomToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("connect_error", (err) =>
      console.error("Socket error:", err.message),
    );
    socket.on("disconnect", (reason) =>
      console.log("Socket disconnected:", reason),
    );
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
