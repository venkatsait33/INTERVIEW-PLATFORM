import axios from "axios";
import { StreamVideoClient } from "@stream-io/video-react-sdk";

let videoClient = null;
let activeCall = null;
let activeInterviewId = null;
let isLeaving = false;

// ─────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────

const fetchToken = async () => {
  const res = await axios.get("/api/video/token", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data; // { token, userId, name }
};

const buildClient = async () => {
  if (videoClient) return videoClient;

  const { token, userId, name } = await fetchToken();

  videoClient = new StreamVideoClient({
    apiKey: import.meta.env.VITE_STREAM_API_KEY,
    user: { id: userId, name },
    token,
  });

  return videoClient;
};

// ─────────────────────────────────────────
// Interviewer — creates the call
// ─────────────────────────────────────────

export const initStreamClientAsHost = async (interviewId) => {
  const client = await buildClient();

  // Return existing if already on same interview
  if (videoClient && activeCall && activeInterviewId === interviewId) {
    return { client: videoClient, call: activeCall };
  }

  // If switching rooms, leave previous call first
  if (activeCall && activeInterviewId !== interviewId) {
    await activeCall.leave().catch(() => {});
    activeCall = null;
  }

  const call = client.call("default", interviewId);

  // Interviewer always creates the call
  await call.join({ create: true });

  activeCall = call;
  activeInterviewId = interviewId;
  isLeaving = false;

  return { client, call };
};

// ─────────────────────────────────────────
// Candidate — joins existing call only
// ─────────────────────────────────────────

export const initStreamClientAsGuest = async (interviewId) => {
  const client = await buildClient();

  // Return existing if already on same interview
  if (videoClient && activeCall && activeInterviewId === interviewId) {
    return { client: videoClient, call: activeCall };
  }

  // If switching rooms, leave previous call first
  if (activeCall && activeInterviewId !== interviewId) {
    await activeCall.leave().catch(() => {});
    activeCall = null;
  }

  const call = client.call("default", interviewId);

  // Candidate never creates — joins only after interviewer has created
  await call.join({ create: false });

  activeCall = call;
  activeInterviewId = interviewId;
  isLeaving = false;

  return { client, call };
};

// ─────────────────────────────────────────
// Disconnect — single exit point
// ─────────────────────────────────────────

export const disconnectStreamClient = async (fullDisconnect = false) => {
  if (isLeaving) return;
  isLeaving = true;

  try {
    if (activeCall) {
      await activeCall.leave().catch(() => {});
      activeCall = null;
    }

    // 🔥 ONLY disconnect user when closing app / logout
    if (fullDisconnect && videoClient) {
      await videoClient.disconnectUser().catch(() => {});
      videoClient = null;
    }

    activeInterviewId = null;
  } finally {
    isLeaving = false;
  }
};

export const getActiveCall = () => activeCall;
