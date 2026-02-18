/**
 * Lobby Page - Candidate waits here for admission
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getSocket, disconnectSocket } from "../../services/socket";
import { interviewService } from "../../services/interviews";
import toast from "react-hot-toast";

export default function LobbyPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("connecting"); // connecting | waiting | admitted | error
  const [message, setMessage] = useState("Connecting to lobby...");

  useEffect(() => {
    const socket = getSocket(token);

    socket.emit("subscribe:personal");

    // Join lobby
    const joinLobby = async () => {
      try {
        if (token) {
          await interviewService.joinLobby(id, token);
        }

        socket.emit("lobby:enter", { interviewId: id });
        setStatus("waiting");
        setMessage(
          "You are in the waiting room. The interviewer will admit you shortly.",
        );
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Failed to join lobby");
        toast.error("Failed to join lobby");
      }
    };

    joinLobby();

    // Listen for admission
    socket.on("lobby:admitted", ({ interviewId }) => {
      if (interviewId === id) {
        setStatus("admitted");
        setMessage("You have been admitted! Joining the interview room now...");
        toast.success("Admitted to interview!");
        setTimeout(() => {
          navigate(`/room/${id}${token ? `?token=${token}` : ""}`);
        }, 1500);
      }
    });

    return () => {
      socket.off("lobby:admitted");
    };
  }, [id, token, navigate]);

  const statusConfig = {
    connecting: { icon: "🔄", color: "blue", animate: true },
    waiting: { icon: "⏳", color: "indigo", animate: true },
    admitted: { icon: "✅", color: "green", animate: false },
    error: { icon: "❌", color: "red", animate: false },
  };

  const config = statusConfig[status] || statusConfig.connecting;

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="w-full max-w-md p-12 text-center bg-white shadow-xl rounded-2xl">
        <div
          className={`text-6xl mb-6 ${config.animate ? "animate-pulse" : ""}`}
        >
          {config.icon}
        </div>

        <h1 className="mb-3 text-2xl font-bold text-gray-900">
          {status === "waiting"
            ? "You're in the Waiting Room"
            : status === "admitted"
              ? "Admitted!"
              : status === "error"
                ? "Connection Error"
                : "Connecting..."}
        </h1>

        <p className="text-sm leading-relaxed text-gray-500">{message}</p>

        {status === "waiting" && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              The interviewer will see you are waiting
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 text-xs text-indigo-700 text-left space-y-1.5">
              <p>✓ Ensure your camera and mic are ready</p>
              <p>✓ Find a quiet, well-lit location</p>
              <p>✓ Have your notes handy</p>
              <p>✓ Stay on this page — you'll be admitted automatically</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <button onClick={() => navigate(-1)} className="mt-6 btn-secondary">
            ← Go Back
          </button>
        )}

        {status === "admitted" && (
          <div className="mt-6">
            <div className="w-8 h-8 mx-auto border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin" />
            <p className="mt-2 text-xs text-gray-400">Redirecting to room...</p>
          </div>
        )}
      </div>
    </div>
  );
}
