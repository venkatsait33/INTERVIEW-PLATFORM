/**
 * Interview Room Page
 * Stream Video + Monaco Code Editor + Socket.io Chat
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  CallControls,
  StreamCall,
  StreamTheme,
  StreamVideo,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

import { getSocket, disconnectSocket } from "../../services/socket";
import { interviewService } from "../../services/interviews";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../../components/common";
import {
  initStreamClientAsHost,
  initStreamClientAsGuest,
  disconnectStreamClient,
} from "../../services/streamVideo";
import { InterviewVideoLayout } from "./VideoStream";
import toast from "react-hot-toast";
import { DEFAULT_CODE, LANGUAGES } from "../../utils/editor";

export default function InterviewRoomPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const roomToken = searchParams.get("token");

  const isInterviewer = user?.role === "interviewer";

  // ── Refs ──
  const socketRef = useRef(null);
  const debounceTimer = useRef(null);
  const streamInitializedRef = useRef(false);
  const hasLeft = useRef(false); // Prevents double leave

  // ── Stream state ──
  const [videoClient, setVideoClient] = useState(null);
  const [call, setCall] = useState(null);

  // ── Room state ──
  const [connected, setConnected] = useState(false);
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [language, setLanguage] = useState("javascript");
  const [participants, setParticipants] = useState([]);

  // ── Chat state ──
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // ── Interviewer-only state ──
  const [candidateWaiting, setCandidateWaiting] = useState(false);
  const [waitingCandidateId, setWaitingCandidateId] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({
    feedback: "",
    technicalNotes: "",
    rating: 8,
    result: "HIRED",
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Code runner state ──
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  // ─────────────────────────────────────────
  // 1. Socket setup
  // ─────────────────────────────────────────

  useEffect(() => {
    const socket = getSocket(roomToken);
    socketRef.current = socket;

    socket.emit("room:join", { interviewId: id });

    if (isInterviewer) {
      socket.emit("lobby:subscribe", { interviewId: id });
    }

    socket.on("room:joined", ({ code: initialCode }) => {
      setCode(initialCode || DEFAULT_CODE.javascript);
      setConnected(true);
    });

    socket.on("room:update-participants", ({ participants }) => {
      setParticipants(participants);
    });

    socket.on("room:participant-left", (participant) => {
      setParticipants((prev) =>
        prev.filter((p) => p.userId !== participant.userId),
      );
      toast(`${participant.name} left the room`, { icon: "👋" });
    });

    socket.on("code:updated", ({ code: newCode }) => {
      setCode(newCode);
    });

    socket.on("lobby:candidate-waiting", ({ candidateName, candidateId }) => {
      setCandidateWaiting(true);
      setWaitingCandidateId(candidateId);
      toast(`${candidateName} is waiting in the lobby`, {
        icon: "🚪",
        duration: 0,
        id: "lobby-waiting",
      });
    });

    socket.on("chat:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("error", ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket.off("room:joined");
      socket.off("room:update-participants");
      socket.off("room:participant-left");
      socket.off("code:updated");
      socket.off("lobby:candidate-waiting");
      socket.off("chat:message");
      socket.off("error");
      disconnectSocket();
    };
  }, [id, roomToken, isInterviewer]);

  // ─────────────────────────────────────────
  // 2. Stream Video setup
  //    Interviewer → initStreamClientAsHost  (create: true)
  //    Candidate   → initStreamClientAsGuest (create: false)
  //
  //    This is the fix for:
  //      - False "user left" event on admission
  //      - Wrong video feed showing
  // ─────────────────────────────────────────

  useEffect(() => {
    if (streamInitializedRef.current) return;
    streamInitializedRef.current = true;

    let isMounted = true;

    const setup = async () => {
      try {
        const initFn = isInterviewer
          ? initStreamClientAsHost
          : initStreamClientAsGuest;

        const { client, call } = await initFn(id);

        // Component unmounted while we were awaiting — clean up and bail
        if (!isMounted) {
          await call.leave().catch(() => {});
          await disconnectStreamClient();
          return;
        }

        setVideoClient(client);
        setCall(call);
      } catch (error) {
        console.error("Stream init error:", error);
        if (isMounted) {
          toast.error("Failed to initialize video call");
        }
      }
    };

    setup();

    return () => {
      isMounted = false;
      streamInitializedRef.current = false;
      // Actual leave is handled by handleLeaveCall or the guard above.
      // We intentionally do NOT call disconnectStreamClient here to avoid
      // double-leave when the user clicks "Leave" before unmount fires.
    };
  }, [id, isInterviewer]);

  // ─────────────────────────────────────────
  // 3. Stream call event listeners
  // ─────────────────────────────────────────

  useEffect(() => {
    if (!call) return;

    const onParticipantLeft = async () => {
      toast("Other participant left the interview", { icon: "👋" });
      const remaining = call.state.session?.participants || [];
      if (remaining.length <= 1) {
        await call.leave();
      }
      call.on("call.session_participant_left", onParticipantLeft);

      return () => {
        call.off("call.session_participant_left", onParticipantLeft);
      };
    };

    const onCallEnded = () => {
      toast("Call ended");
      navigate("/dashboard");
    };

    call.on("call.ended", onCallEnded);

    return () => {
      call.off("call.ended", onCallEnded);
    };
  }, [call, navigate]);

  // ─────────────────────────────────────────
  // 4. Handlers
  // ─────────────────────────────────────────

  // Code change — debounced 200ms before emitting to socket
  const handleCodeChange = useCallback(
    (newCode) => {
      setCode(newCode);
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        socketRef.current?.emit("code:update", {
          interviewId: id,
          code: newCode,
        });
      }, 200);
    },
    [id],
  );

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    const defaultCode = DEFAULT_CODE[lang];
    setCode(defaultCode);
    socketRef.current?.emit("code:update", {
      interviewId: id,
      code: defaultCode,
    });
  };

  // Admit candidate — REST + dismiss lobby toast
  const handleAdmit = async () => {
    try {
      await interviewService.admit(id);
      setCandidateWaiting(false);
      setWaitingCandidateId(null);
      toast.dismiss("lobby-waiting");
      toast.success("Candidate admitted!");
    } catch {
      toast.error("Failed to admit candidate");
    }
  };

  // Chat send
  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit("chat:message", {
      interviewId: id,
      message: chatInput,
    });
    setChatInput("");
  };

  // Submit feedback + end interview
  const handleSubmitFeedback = async () => {
    setSubmitting(true);
    try {
      await interviewService.submitFeedback(id, feedback);
      toast.success("Feedback submitted! Interview completed.");
      setFeedbackModal(false);
      await handleLeaveCall(); // Clean leave after submitting
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  // Run code
  const runCode = async () => {
    try {
      setRunning(true);
      setOutput("");
      const res = await fetch("/api/code/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = await res.json();
      setOutput(data.output || data.error || "No output");
    } catch {
      setOutput("Execution failed. Please try again.");
    } finally {
      setRunning(false);
    }
  };

  // Leave call — single exit point, guarded against double execution
  const handleLeaveCall = async () => {
    if (hasLeft.current) return;
    hasLeft.current = true;

    try {
      await call?.leave(); // 🔥 Direct leave is cleaner
      disconnectSocket();
    } catch (error) {
      console.error("Error leaving call:", error);
    } finally {
      navigate(isInterviewer ? "/interviewer" : "/candidate");
    }
  };

  // ─────────────────────────────────────────
  // 5. Render
  // ─────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden text-white bg-gray-950">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-4 px-4 bg-gray-900 border-b border-gray-800 h-14 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center text-sm rounded-lg w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600">
            🎯
          </div>
          <span className="hidden text-sm font-semibold sm:inline">
            Interview Room
          </span>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-1 ml-2">
          {participants.map((p) => (
            <div
              key={p.socketId}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-800 rounded-full"
            >
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="hidden sm:inline">{p.name}</span>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        {/* Language selector */}
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        {/* Run code */}
        <button
          onClick={runCode}
          disabled={running}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg"
        >
          {running ? "Running..." : "▶ Run"}
        </button>

        {/* Admit candidate (interviewer only, shown when candidate is waiting) */}
        {isInterviewer && candidateWaiting && (
          <button
            onClick={handleAdmit}
            className="bg-yellow-500 hover:bg-yellow-400 text-white text-xs px-3 py-1.5 rounded-lg animate-pulse font-medium"
          >
            🚪 Admit Candidate
          </button>
        )}

        {/* Submit feedback (interviewer only) */}
        {isInterviewer && (
          <button
            onClick={() => setFeedbackModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg"
          >
            📝 Feedback
          </button>
        )}

        {/* Leave */}
        <button
          onClick={handleLeaveCall}
          className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg"
        >
          Leave
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Code Editor + Terminal */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 2,
                renderLineHighlight: "all",
              }}
            />
          </div>

          {/* Terminal output */}
          <div className="p-3 overflow-auto font-mono text-xs text-green-400 bg-black border-t border-gray-800 h-36 shrink-0">
            <p className="mb-1 text-gray-600">─── Terminal ───</p>
            {running ? (
              <span className="animate-pulse">Running...</span>
            ) : output ? (
              <pre className="whitespace-pre-wrap">{output}</pre>
            ) : (
              <span className="text-gray-700">
                Output will appear here after running code
              </span>
            )}
          </div>
        </div>

        {/* RIGHT: Video + Chat */}
        <div className="flex flex-col bg-gray-900 border-l border-gray-800 w-80 shrink-0">
          {/* Video */}
          <div className="p-3 border-b border-gray-800">
            {videoClient && call ? (
              <StreamVideo client={videoClient}>
                <StreamCall call={call}>
                  <StreamTheme>
                    {/* Pass localRole so labels are correct for both sides */}
                    <InterviewVideoLayout localRole={user?.role} />
                    <div className="mt-2">
                      <CallControls />
                    </div>
                  </StreamTheme>
                </StreamCall>
              </StreamVideo>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-gray-800 aspect-video rounded-xl">
                <div className="w-6 h-6 border-2 border-gray-600 rounded-full border-t-indigo-400 animate-spin" />
                <span className="text-xs">Connecting video...</span>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold border-b border-gray-800 text-gray-40o">
              💬 Chat
            </div>

            <div className="flex-1 px-3 py-2 space-y-2 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="pt-6 text-xs text-center text-gray-600">
                  No messages yet
                </p>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-xs ${
                      msg.from === user?.name ? "text-right" : ""
                    }`}
                  >
                    <span className="text-gray-500">{msg.from}: </span>
                    <span className="text-gray-200">{msg.message}</span>
                    <p className="text-gray-700 text-xs mt-0.5">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={sendChat}
              className="flex gap-2 p-3 border-t border-gray-800"
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                maxLength={500}
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
              >
                →
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Feedback Modal (interviewer only) ── */}
      <Modal
        isOpen={feedbackModal}
        onClose={() => setFeedbackModal(false)}
        title="Submit Interview Feedback"
      >
        <div className="space-y-5">
          {/* Decision */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Decision *
            </label>
            <div className="flex gap-3">
              {["HIRED", "REJECTED"].map((r) => (
                <button
                  key={r}
                  onClick={() => setFeedback((f) => ({ ...f, result: r }))}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border-2 ${
                    feedback.result === r
                      ? r === "HIRED"
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "bg-red-50 border-red-500 text-red-700"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  {r === "HIRED" ? "🎉 HIRED" : "❌ REJECTED"}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Overall Rating:{" "}
              <span className="font-bold text-indigo-600">
                {feedback.rating}/10
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={feedback.rating}
              onChange={(e) =>
                setFeedback((f) => ({
                  ...f,
                  rating: parseInt(e.target.value),
                }))
              }
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          {/* Feedback text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Feedback (shared with candidate) *
            </label>
            <textarea
              value={feedback.feedback}
              onChange={(e) =>
                setFeedback((f) => ({ ...f, feedback: e.target.value }))
              }
              className="w-full h-24 text-black resize-none input-field"
              placeholder="Constructive feedback about the candidate's performance..."
              required
            />
          </div>

          {/* Internal notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Technical Notes (internal only)
            </label>
            <textarea
              value={feedback.technicalNotes}
              onChange={(e) =>
                setFeedback((f) => ({
                  ...f,
                  technicalNotes: e.target.value,
                }))
              }
              className="w-full h-20 text-black resize-none input-field"
              placeholder="Internal notes not visible to the candidate..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmitFeedback}
              disabled={submitting || !feedback.feedback}
              className="justify-center flex-1 btn-primary disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "✓ Submit & Complete"}
            </button>
            <button
              onClick={() => setFeedbackModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
