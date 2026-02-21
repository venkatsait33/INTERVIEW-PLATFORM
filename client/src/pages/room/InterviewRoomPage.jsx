/**
 * Interview Room Page
 * Stream Video + Monaco Code Editor + Socket.io Chat
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getSocket, disconnectSocket } from "../../services/socket";
import { interviewService } from "../../services/interviews";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../../components/common";
import {
  initStreamClientAsHost,
  initStreamClientAsGuest,
  disconnectStreamClient,
} from "../../services/streamVideo";
import toast from "react-hot-toast";
import { DEFAULT_CODE } from "../../utils/editor";
import { Panel, Group, Separator } from "react-resizable-panels";
import RoomNavBar from "./RoomNavBar";
import CodeEditor from "./CodeEditor";
import { executeCode } from "../../services/piston";
import StreamLayoutWithChat from "./StreamLayoutWithChat";

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

    const onParticipantLeft = () => {
      toast("Other participant left the interview", { icon: "👋" });
    };

    const onCallEnded = () => {
      toast("Call ended");
      navigate("/dashboard");
    };

    call.on("call.session_participant_left", onParticipantLeft);
    call.on("call.ended", onCallEnded);

    return () => {
      call.off("call.session_participant_left", onParticipantLeft);
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
      const result = await executeCode(language, code);
      setOutput(result);
      setRunning(false);
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
      // 🔥 Proper cleanup (fixes ghost video + stuck feed)
      await disconnectStreamClient();
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
      <RoomNavBar
        participants={participants}
        language={language}
        handleLanguageChange={handleLanguageChange}
        handleLeaveCall={handleLeaveCall}
        handleAdmit={handleAdmit}
        runCode={runCode}
        running={running}
        isInterviewer={isInterviewer}
        candidateWaiting={candidateWaiting}
        setFeedbackModal={setFeedbackModal}
      />

      {/* ── Main Content ── */}
      <div>
        <div className="w-full h-full">
          {/* LEFT: Code Editor + Terminal */}
          <Group>
            <Panel minSize={500} maxSize={1000}>
              <CodeEditor
                language={language}
                code={code}
                running={running}
                handleCodeChange={handleCodeChange}
                output={output}
              />
            </Panel>
            <Separator className="border-2 " />
            {/* RIGHT: Video + Chat */}
            <Panel>
              <StreamLayoutWithChat
                user={user}
                videoClient={videoClient}
                call={call}
                messages={messages}
                sendChat={sendChat}
                chatInput={chatInput}
                setChatInput={setChatInput}
              />
            </Panel>
          </Group>
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
