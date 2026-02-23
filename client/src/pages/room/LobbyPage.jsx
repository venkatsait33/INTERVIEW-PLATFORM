/**
 * Lobby Page - Candidate waits here for admission
 */

import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getSocket, disconnectSocket } from "../../services/socket";
import { interviewService } from "../../services/interviews";
import toast from "react-hot-toast";
const NO_SHOW_THRESHOLD_MINUTES = 60;

export default function LobbyPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [interview, setInterview] = useState(null);

  const [status, setStatus] = useState("connecting"); // connecting | waiting | admitted | error
  const [message, setMessage] = useState("Connecting to lobby...");
  const [waitedMinutes, setWaitedMinutes] = useState(0);
  const [noShowConfirmOpen, setNoShowConfirmOpen] = useState(false);

  const socketRef = useRef(null);
  const waitTimerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await interviewService.getOne(id);
        setInterview(res.data.data.interview);
      } catch {
        toast.error("Failed to load interview");
        navigate("/candidate");
      }
    };
    load();
  }, [id, navigate]);

  useEffect(() => {
    const socket = getSocket(token);
    socketRef.current = socket;

    socket.emit("subscribe:personal");

    // Join lobby
    const joinLobby = async () => {
      try {
        if (token) {
          await interviewService.joinLobby(id, token);
        }

        setStatus("waiting");
        socket.emit("lobby:enter", { interviewId: id });
        setMessage(
          "You are in the waiting room. The interviewer will admit you shortly.",
        );
        waitTimerRef.current = setInterval(() => {
          setWaitedMinutes((prev) => prev + 1);
        }, 60_000);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Failed to join lobby");
        toast.error("Failed to join lobby");
      }
    };

    joinLobby();

    // Listen for admission
    socket.on("lobby:admitted", ({ interviewId }) => {
      clearInterval(waitTimerRef.current);
      if (interviewId === id) {
        setStatus("admitted");
        setMessage("You have been admitted! Joining the interview room now...");
        toast.success("Admitted to interview!");
        setTimeout(() => {
          navigate(`/room/${id}${token ? `?token=${token}` : ""}`);
        }, 1500);
      }
    });

    socket.on("interview:auto-cancelled", ({ message }) => {
      clearInterval(waitTimerRef.current);
      setStatus("error");
      toast.error(message);
      setTimeout(() => navigate("/candidate"), 3000);
    });

    socket.on("error", ({ message }) => {
      setStatus("error");
      toast.error(message);
    });

    socket.on("disconnect", () => {
      if (status === "waiting") {
        setStatus("error");
      }
    });

    return () => {
      clearInterval(waitTimerRef.current);
      socket.off("lobby:admitted");
    };
  }, [id, token, navigate]);

  const reportNoShow = async () => {
    try {
      await interviewService.reportNoShow(interviewId, waitedMinutes);
      toast.success("No-show reported. Interview cancelled.");
      navigate("/candidate");
    } catch {
      toast.error("Failed to report no-show");
    }
  };

  const showNoShowButton = waitedMinutes >= NO_SHOW_THRESHOLD_MINUTES;

  // ── Render ─────────────────────────────────────────
  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const statusConfig = {
    connecting: { icon: "🔄", color: "blue", animate: true },
    waiting: { icon: "⏳", color: "indigo", animate: true },
    admitted: { icon: "✅", color: "green", animate: false },
    error: { icon: "❌", color: "red", animate: false },
  };

  const config = statusConfig[status] || statusConfig.connecting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        {/* Header */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {status === "admitted" ? (
              <span className="text-4xl">🎉</span>
            ) : status === "error" ? (
              <span className="text-4xl">❌</span>
            ) : (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{interview.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Interviewer: {interview.interviewer?.name}
          </p>
        </div>

        {/* Status message */}
        <div className="mb-6">
          {status === "connecting" && (
            <p className="text-gray-600">Connecting to lobby…</p>
          )}
          {status === "waiting" && (
            <>
              <p className="text-gray-700 font-medium">
                ⏳ Waiting for interviewer to admit you
              </p>
              <p className="text-sm text-gray-500 mt-2">
                You will be admitted automatically once the interviewer is
                ready.
              </p>
              {waitedMinutes > 0 && (
                <p className="text-sm text-amber-600 mt-3 font-medium">
                  Wait time: {waitedMinutes}{" "}
                  {waitedMinutes === 1 ? "minute" : "minutes"}
                </p>
              )}
            </>
          )}
          {status === "admitted" && (
            <p className="text-green-600 font-semibold">
              Admitted! Entering interview room…
            </p>
          )}
          {status === "error" && (
            <p className="text-red-600">Something went wrong. Redirecting…</p>
          )}
        </div>

        {/* No-show banner after 60 minutes */}
        {showNoShowButton && status === "waiting" && (
          <div className="mt-4 border border-amber-300 bg-amber-50 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-amber-800 mb-1">
              🚨 Interviewer has not shown up
            </p>
            <p className="text-xs text-amber-700 mb-3">
              You have waited {waitedMinutes} minutes. You may report this as a
              no-show.
            </p>
            <button
              onClick={() => setNoShowConfirmOpen(true)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
            >
              Report No-Show & Cancel Interview
            </button>
          </div>
        )}

        {/* Back button */}
        {status !== "admitted" && (
          <button
            onClick={() => navigate("/candidate")}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline"
          >
            ← Back to dashboard
          </button>
        )}
      </div>

      {/* No-show confirmation modal */}
      {noShowConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm text-gray-900">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              🚨 Report No-Show?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You have waited <strong>{waitedMinutes} minutes</strong> and the
              interviewer has not admitted you. This will{" "}
              <strong>cancel the interview</strong> and notify all parties
              including HR.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setNoShowConfirmOpen(false);
                  reportNoShow();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
              >
                Confirm No-Show
              </button>
              <button
                onClick={() => setNoShowConfirmOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Keep Waiting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
