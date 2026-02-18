/**
 * Interview Room Page
 * Full-featured room: Video (WebRTC) + Code Editor (Monaco) + Chat
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { getSocket, disconnectSocket } from "../../services/socket";
import { interviewService } from "../../services/interviews";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../../components/common";
import toast from "react-hot-toast";

const LANGUAGES = ["javascript", "python", "java", "cpp", "typescript", "go"];
const DEFAULT_CODE = {
  javascript:
    "// JavaScript\nfunction solution(input) {\n  // Your code here\n  \n}\n\nconsole.log(solution());",
  python:
    "# Python\ndef solution(input):\n    # Your code here\n    pass\n\nprint(solution(None))",
  java: "// Java\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}",
  cpp: "// C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}",
  typescript:
    "// TypeScript\nfunction solution(input: any): any {\n  // Your code here\n  \n}\n\nconsole.log(solution(undefined));",
  go: '// Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    // Your code here\n    fmt.Println("Hello")\n}',
};

export default function InterviewRoomPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const roomToken = searchParams.get("token");

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const debounceTimer = useRef(null);
  const socketRef = useRef(null);
  const makingOffer = useRef(false);

  // State
  const [connected, setConnected] = useState(false);
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [language, setLanguage] = useState("javascript");
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [participants, setParticipants] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
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
  const [activeTab, setActiveTab] = useState("code"); // code | chat

  const isInterviewer = user?.role === "interviewer";

  // ── WebRTC Setup ──
  const initWebRTC = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // ICE servers for NAT traversal
      const config = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };
      peerConnectionRef.current = new RTCPeerConnection(config);

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      return peerConnectionRef.current;
    } catch (err) {
      console.warn("Media device error:", err.message);
      return null;
    }
  }, []);

  // ── Socket Setup ──
  useEffect(() => {
    const socket = getSocket(roomToken);
    socketRef.current = socket;

    initWebRTC().then((pc) => {
      // Join room
      socket.emit("room:join", { interviewId: id });

      // Lobby subscription (interviewer)
      if (isInterviewer) {
        socket.emit("lobby:subscribe", { interviewId: id });
      }

      // Room events
      socket.on("room:joined", ({ code: initialCode }) => {
        setCode(initialCode || DEFAULT_CODE.javascript);
        setConnected(true);
      });

      socket.on("room:update-participants", ({ participants }) => {
        setParticipants(participants);

        const pc = peerConnectionRef.current;

        if (
          isInterviewer &&
          participants.length === 2 &&
          pc &&
          !makingOffer.current
        ) {
          makingOffer.current = true;

          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              socket.emit("webrtc:offer", {
                interviewId: id,
                offer: pc.localDescription,
              });
            })
            .catch((err) => console.error("Offer error:", err))
            .finally(() => {
              makingOffer.current = false;
            });
        }
      });

      socket.on("room:participant-left", (participant) => {
        setParticipants((prev) =>
          prev.filter((p) => p.userId !== participant.userId),
        );
        toast(`${participant.name} left the room`, { icon: "👋" });
      });

      // Code sync
      socket.on("code:updated", ({ code: newCode }) => {
        setCode(newCode);
      });

      // Lobby notification (interviewer)
      socket.on("lobby:candidate-waiting", ({ candidateName, candidateId }) => {
        setCandidateWaiting(true);
        setWaitingCandidateId(candidateId);
        toast(`${candidateName} is waiting in the lobby`, {
          icon: "🚪",
          duration: 0, // Don't auto-dismiss
          id: "lobby-waiting",
        });
      });

      // WebRTC signaling
      if (pc) {
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("webrtc:ice-candidate", {
              interviewId: id,
              candidate: event.candidate,
            });
          }
        };

        socket.on("webrtc:offer", async ({ offer, fromId }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc:answer", {
            interviewId: id,
            answer,
            targetId: fromId,
          });
        });

        socket.on("webrtc:answer", async ({ answer }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("webrtc:ice-candidate", async ({ candidate }) => {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn("ICE candidate error:", e);
          }
        });
      }

      // Chat
      socket.on("chat:message", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on("error", ({ message }) => {
        toast.error(message);
      });
    });

    return () => {
      socket.off("room:joined");
      socket.off("room:participant-joined");
      socket.off("room:participant-left");
      socket.off("code:updated");
      socket.off("lobby:candidate-waiting");
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice-candidate");
      socket.off("chat:message");
      socket.off("error");
      disconnectSocket();

      // Cleanup media
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [id, roomToken, isInterviewer]);

  // ── Code Change with Debounce (200ms) ──
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

  // ── Language Change ──
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    const defaultCode = DEFAULT_CODE[lang];
    setCode(defaultCode);
    socketRef.current?.emit("code:update", {
      interviewId: id,
      code: defaultCode,
    });
  };

  // ── Toggle Media ──
  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setMicOn((prev) => !prev);
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setCamOn((prev) => !prev);
    }
  };

  // ── Admit Candidate ──
  const handleAdmit = async () => {
    try {
      await interviewService.admit(id);
      setCandidateWaiting(false);
      toast.dismiss("lobby-waiting");
      toast.success("Candidate admitted!");
    } catch {
      toast.error("Failed to admit candidate");
    }
  };

  // ── Send Chat ──
  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit("chat:message", {
      interviewId: id,
      message: chatInput,
    });
    setChatInput("");
  };

  // ── Submit Feedback ──
  const handleSubmitFeedback = async () => {
    setSubmitting(true);
    try {
      await interviewService.submitFeedback(id, feedback);
      toast.success("Feedback submitted! Interview completed.");
      setFeedbackModal(false);
      navigate("/interviewer");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen text-white bg-gray-950">
      {/* Top Bar */}
      <div className="flex items-center gap-4 px-4 bg-gray-900 border-b border-gray-800 h-14">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center text-sm rounded-lg w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600">
            🎯
          </div>
          <span className="text-sm font-semibold">Interview Room</span>
        </div>

        <div className="flex items-center gap-1 ml-4">
          {participants.map((p) => (
            <div
              key={p.socketId}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-800 rounded-full"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              {p.name}
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

        {/* Candidate waiting alert */}
        {isInterviewer && candidateWaiting && (
          <button
            onClick={handleAdmit}
            className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg animate-pulse"
          >
            🚪 Admit Candidate
          </button>
        )}

        {/* Feedback button (interviewer) */}
        {isInterviewer && (
          <button
            onClick={() => setFeedbackModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg"
          >
            📝 Submit Feedback
          </button>
        )}

        {/* Leave */}
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg"
        >
          Leave
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Code Editor */}
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
              scrollBeyondLastLine: false,
              wordWrap: "on",
              formatOnPaste: true,
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>

        {/* Right Panel: Video + Chat */}
        <div className="flex flex-col bg-gray-900 border-l border-gray-800 w-80">
          {/* Video Section */}
          <div className="p-3 space-y-2">
            {/* Remote Video */}
            <div className="relative overflow-hidden bg-gray-800 rounded-xl aspect-video">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="object-cover w-full h-full"
              />
              <div
                className="absolute inset-0 flex items-center justify-center text-3xl text-gray-600"
                id="remote-placeholder"
              >
                👤
              </div>
              <div className="absolute bottom-2 left-2 text-xs bg-black/60 rounded px-1.5 py-0.5">
                {isInterviewer ? "Candidate" : "Interviewer"}
              </div>
            </div>

            {/* Local Video */}
            <div
              className="relative overflow-hidden bg-gray-800 rounded-xl"
              style={{ aspectRatio: "4/3" }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="object-cover w-full h-full"
              />
              <div className="absolute bottom-2 left-2 text-xs bg-black/60 rounded px-1.5 py-0.5">
                You ({user?.name})
              </div>
            </div>

            {/* Media Controls */}
            <div className="flex justify-center gap-2">
              <button
                onClick={toggleMic}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  micOn
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {micOn ? "🎤 Mic On" : "🎤 Muted"}
              </button>
              <button
                onClick={toggleCam}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  camOn
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {camOn ? "📷 Cam On" : "📷 Off"}
              </button>
            </div>
          </div>

          {/* Chat */}
          <div className="flex flex-col flex-1 overflow-hidden border-t border-gray-800">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400">
              💬 Chat
            </div>
            <div className="flex-1 px-3 space-y-2 overflow-y-auto">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-xs ${msg.from === user?.name ? "text-right" : ""}`}
                >
                  <span className="text-gray-500">{msg.from}: </span>
                  <span className="text-gray-200">{msg.message}</span>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="pt-4 text-xs text-center text-gray-600">
                  No messages yet
                </p>
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

      {/* Feedback Modal */}
      <Modal
        isOpen={feedbackModal}
        onClose={() => setFeedbackModal(false)}
        title="Submit Interview Feedback"
      >
        <div className="space-y-5">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Overall Rating: {feedback.rating}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={feedback.rating}
              onChange={(e) =>
                setFeedback((f) => ({ ...f, rating: parseInt(e.target.value) }))
              }
              className="w-full accent-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Feedback (shared with candidate) *
            </label>
            <textarea
              value={feedback.feedback}
              onChange={(e) =>
                setFeedback((f) => ({ ...f, feedback: e.target.value }))
              }
              className="h-24 resize-none input-field"
              placeholder="General feedback about the candidate's performance..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Technical Notes (internal only)
            </label>
            <textarea
              value={feedback.technicalNotes}
              onChange={(e) =>
                setFeedback((f) => ({ ...f, technicalNotes: e.target.value }))
              }
              className="h-20 resize-none input-field"
              placeholder="Internal notes about technical assessment..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmitFeedback}
              disabled={submitting || !feedback.feedback}
              className="justify-center flex-1 btn-primary"
            >
              {submitting ? "Submitting..." : "✓ Submit & Complete Interview"}
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
