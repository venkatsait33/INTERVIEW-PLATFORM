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
import { DEFAULT_CODE, Languages } from "../../utils/editor";
import { Panel, Group, Separator } from "react-resizable-panels";
import RoomNavBar from "./RoomNavBar";
import CodeEditor from "./CodeEditor";
import { executeCode } from "../../services/piston";
import StreamLayoutWithChat from "./StreamLayoutWithChat";
import axios from "axios";
import { TabSwitchAlert } from "./TabSwitchAlert";

const NO_SHOW_THRESHOLD_MINUTES = 60;
const isSuccess = (result) => result && result.exitCode === 0 && !result.stderr;

export default function InterviewRoomPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const roomToken = searchParams.get("token");

  // ── Refs ──
  const socketRef = useRef(null);
  const debounceTimer = useRef(null);
  const streamInitializedRef = useRef(false);
  const hasLeft = useRef(false); // Prevents double leave
  const waitTimerRef = useRef(null);
  const chatBottomRef = useRef(null);

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
  const [runningBy, setRunningBy] = useState("");

  // No-show tracking
  const [waitedMinutes, setWaitedMinutes] = useState(0);
  const [otherPartyJoined, setOtherPartyJoined] = useState(false);
  // const [reportingNoShow, setReportingNoShow] = useState(false);

  const [tabAlerts, setTabAlerts] = useState([]); // ← recent tab switch events
  const [isTabHidden, setIsTabHidden] = useState(false); // this user's own tab state

  const [leftRoom, setLeftRoom] = useState(false);
  const [noShowConfirmOpen, setNoShowConfirmOpen] = useState(false);

  const [interview, setInterview] = useState(null);

  const isInterviewer = user?.role === "interviewer";

  useEffect(() => {
    const base = interview
      ? `${interview.title} · ${isInterviewer ? "Interviewer" : "Candidate"}`
      : "Interview Room";
    document.title = `🔴 ${base} | InterviewPro`;

    return () => {
      document.title = "InterviewPro";
    };
  }, [interview, isInterviewer]);

  // Update title when there's an alert (tab switch detected)
  useEffect(() => {
    if (!interview) return;
    if (tabAlerts.length > 0 && tabAlerts[tabAlerts.length - 1].hidden) {
      const alertName = tabAlerts[tabAlerts.length - 1].name;
      document.title = `⚠️ ALERT: ${alertName} left tab | InterviewPro`;
    } else {
      const base = `${interview.title} · ${isInterviewer ? "Interviewer" : "Candidate"}`;
      document.title = `🔴 ${base} | InterviewPro`;
    }
  }, [tabAlerts, interview, isInterviewer]);

  // ── 2. Load interview ─────────────────────────────────
  useEffect(() => {
    interviewService
      .getOne(id)
      .then((r) => setInterview(r.data.data.interview))
      .catch(() => {
        toast.error("Interview not found");
        navigate("/");
      });
  }, [id]);

  // ─────────────────────────────────────────
  // 1. Socket setup
  // ─────────────────────────────────────────

  useEffect(() => {
    if (!interview) return;

    const socket = getSocket(roomToken);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe:personal");
      socket.emit("room:join", { interviewId: id });
      startWaitTimer();
    });

    if (isInterviewer) {
      socket.emit("lobby:subscribe", { interviewId: id });
    }
    socket.emit("room:join", { interviewId: id });

    socket.on(
      "room:joined",
      ({
        code: initialCode,
        language: l,
        output: o,
        participants: ps,
        messages,
      }) => {
        if (initialCode) setCode(initialCode || DEFAULT_CODE.javascript);
        if (l) setLanguage(l);
        if (o) setOutput(o);
        setParticipants(ps || []);
        setConnected(true);
        setMessages(messages || []);

        const othersPresent = (ps || []).some(
          (p) => p.userId !== (user?._id || user?.id),
        );
        if (othersPresent) {
          setOtherPartyJoined(true);
          stopWaitTimer();
        }
      },
    );

    socket.on("room:update-participants", ({ participants }) => {
      setParticipants(participants);
    });

    socket.on("room:participant-joined", (participant) => {
      // The other person just joined for the first time.
      setOtherPartyJoined(true);
      stopWaitTimer();
      toast.success(`${participant.name} joined the room`);
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

    socket.on("language:changed", ({ language: l, changedBy }) => {
      setLanguage(l);
      toast(`${changedBy} switched to ${Languages[l]?.label || l}`, {
        icon: "🔄",
        duration: 2500,
      });
    });

    socket.on("code:running", ({ startedBy }) => {
      setRunning(true);
      setRunningBy(startedBy);
    });

    socket.on("code:run-result", (result) => {
      setRunning(false);
      setRunningBy("");
      setOutput(result);
    });

    socket.on("chat:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // ── TAB SWITCH ALERTS ────────────────────────────────
    // Fired when ANY participant switches tab or app
    socket.on("participant:tab-switch", (payload) => {
      setTabAlerts((prev) => [...prev, payload]);

      // Show toast with severity based on role
      if (payload.hidden) {
        const isCandidate = payload.role === "candidate";
        toast(
          `⚠️ ${payload.name} (${payload.role}) switched away from the interview tab`,
          {
            duration: isCandidate ? 8000 : 4000,
            style: {
              background: isCandidate ? "#451a03" : "#1c1917",
              color: isCandidate ? "#fcd34d" : "#d4d4d8",
              border: `1px solid ${isCandidate ? "#92400e" : "#3f3f46"}`,
            },
          },
        );
      } else {
        toast(`👁 ${payload.name} returned to the interview tab`, {
          duration: 2500,
          style: {
            background: "#042f2e",
            color: "#5eead4",
            border: "1px solid #134e4a",
          },
        });
      }
    });

    // ── Auto-cancel from server ───────────────────────────
    socket.on("interview:auto-cancelled", ({ message }) => {
      toast.error(message);
      setTimeout(() => navigate("/"), 3000);
    });

    socket.on("error", ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket.off("connect");
      socket.off("room:joined");
      socket.off("room:update-participants");
      socket.off("room:participant-joined");
      socket.off("room:participant-left");
      socket.off("code:updated");
      socket.off("lobby:candidate-waiting");
      socket.off("language:changed");
      socket.off("code:running");
      socket.off("code:run-result");
      socket.off("chat:message");
      socket.off("participant:tab-switch");
      socket.off("interview:auto-cancelled");
      socket.off("error");
      disconnectSocket();
    };
  }, [id, roomToken, isInterviewer, interview]);

  const startWaitTimer = () => {
    if (waitTimerRef.current) return; // already running
    waitTimerRef.current = setInterval(() => {
      setWaitedMinutes((prev) => prev + 1);
    }, 60_000);
  };

  const stopWaitTimer = () => {
    if (waitTimerRef.current) {
      clearInterval(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopWaitTimer();
  }, []);

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

  // ── 4. Page Visibility API + window focus/blur ────────
  // Detects:
  //   - Switching browser tabs (visibilitychange: hidden/visible)
  //   - Switching to another application (window blur/focus)
  // Only active once the interview has started (interview loaded)

  useEffect(() => {
    if (!interview) return;

    let hidden = false;

    const emitHidden = () => {
      if (hidden) return; // already sent
      hidden = true;
      setIsTabHidden(true);
      socketRef.current?.emit("tab:hidden", { interviewId: id });
    };

    const emitVisible = () => {
      if (!hidden) return; // already visible
      hidden = false;
      setIsTabHidden(false);
      socketRef.current?.emit("tab:visible", { interviewId: id });
    };

    // Page Visibility API — fires when switching tabs
    const handleVisibilityChange = () => {
      if (document.hidden) {
        emitHidden();
      } else {
        emitVisible();
      }
    };

    // window blur/focus — fires when switching to another app
    // Note: browsers fire blur when opening dev tools too, so we debounce
    let blurTimer = null;
    const handleBlur = () => {
      blurTimer = setTimeout(() => {
        // Only emit if the document is still visible (i.e., app-switch not tab-switch)
        if (!document.hidden) {
          emitHidden();
        }
      }, 300);
    };
    const handleFocus = () => {
      clearTimeout(blurTimer);
      if (!document.hidden) {
        emitVisible();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [interview, id]);

  // ─────────────────────────────────────────
  // 5. Handlers
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
    socketRef.current?.emit("language:change", {
      interviewId: id,
      language: lang,
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

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    if (running) return;
    socketRef.current?.emit("code:run-start", { interviewId: id });
    setOutput("");
    try {
      setRunning(true);
      const start = Date.now();
      const result = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/code/run`,
        { language, code },
        {
          withCredentials: true,
        },
      );
      const runtime = Date.now() - start;
      console.log(result.data);

      setOutput(result);
      setRunning(false);

      socketRef.current?.emit("code:run-result", {
        interviewId: id,
        output: result.data.output || "",
        stderr: result.run?.stderr || result.compile?.stderr || "",
        exitCode: result.run?.code ?? 0,
        language,
        runtime,
      });
    } catch (err) {
      socketRef.current?.emit("code:run-result", {
        interviewId: id,
        output: "",
        stderr: `Network error: ${err.message}`,
        exitCode: 1,
        language,
        runtime: null,
      });
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
      setLeftRoom(true);
      stopWaitTimer();
    } catch (error) {
      console.error("Error leaving call:", error);
    } finally {
      navigate(isInterviewer ? "/interviewer" : "/candidate");
    }
  };

  // ── No-show report ────────────────────────────────────
  const reportNoShow = async () => {
    try {
      await interviewService.reportNotShow(id, waitedMinutes);
      toast.success("No-show reported. Interview cancelled.");
      leaveRoom();
    } catch {
      toast.error("Failed to report no-show");
    }
  };

  if (!interview)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-12 h-12 border-b-2 border-indigo-400 rounded-full animate-spin" />
      </div>
    );

  const outputText = output ? output.output || "" : null;

  const dismissAlert = () => setTabAlerts([]);

  const showNoShowButton =
    waitedMinutes >= NO_SHOW_THRESHOLD_MINUTES && !otherPartyJoined;
  // ─────────────────────────────────────────
  // 5. Render
  // ─────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-screen overflow-hidden text-white bg-gray-950"
      style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
    >
      {/* ── Top Bar ── */}
      <RoomNavBar
        participants={participants}
        handleLeaveCall={handleLeaveCall}
        handleAdmit={handleAdmit}
        isInterviewer={isInterviewer}
        candidateWaiting={candidateWaiting}
        setFeedbackModal={setFeedbackModal}
        showNoShowButton={showNoShowButton}
        waitedMinutes={waitedMinutes}
        id={id}
      />

      {/* ── Wait warning banner ───────────────────────────── */}
      {waitedMinutes > 0 &&
        !otherPartyJoined &&
        waitedMinutes < NO_SHOW_THRESHOLD_MINUTES && (
          <div className="py-1 text-xs text-center border-b bg-amber-900/50 text-amber-300 border-amber-800">
            Waiting for other participant… {waitedMinutes} min elapsed
            {waitedMinutes >= 50 &&
              ` — no-show reporting available in ${NO_SHOW_THRESHOLD_MINUTES - waitedMinutes} min`}
          </div>
        )}

      <TabSwitchAlert alerts={tabAlerts} onDismiss={dismissAlert} />

      {/* ── Main Content ── */}
      <>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT: Code Editor + Terminal */}
          <Group direction="horizontal" className="flex w-full h-full">
            <Panel minSize={500} maxSize={1000}>
              <CodeEditor
                language={language}
                code={code}
                running={running}
                handleCodeChange={handleCodeChange}
                output={output}
                runCode={runCode}
                handleLanguageChange={handleLanguageChange}
                runningBy={runningBy}
                isSuccess={isSuccess}
                outputText={outputText}
              />
            </Panel>
            <Separator className="w-1 transition-colors bg-gray-800 hover:bg-indigo-600 cursor-col-resize" />
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
                chatBottomRef={chatBottomRef}
              />
            </Panel>
          </Group>
        </div>
      </>

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

      {/* ── No-show Confirm Modal ──────────────────────────── */}
      {noShowConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md p-6 text-gray-900 bg-white rounded-xl">
            <h3 className="mb-2 text-lg font-semibold text-red-600">
              🚨 Report No-Show?
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              You have waited <strong>{waitedMinutes} minutes</strong> and the
              other party has not joined. Reporting a no-show will{" "}
              <strong>cancel this interview</strong> and notify all parties.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setNoShowConfirmOpen(false);
                  reportNoShow();
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Yes, Report No-Show
              </button>
              <button
                onClick={() => setNoShowConfirmOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
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
