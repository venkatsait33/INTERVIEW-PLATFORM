import { ParticipantView, useCallStateHooks } from "@stream-io/video-react-sdk";

/**
 * InterviewVideoLayout
 *
 * Props:
 *   localRole — "interviewer" | "candidate"
 *               Used to label feeds correctly for both sides.
 */
export const InterviewVideoLayout = ({ localRole }) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  const local = participants.find((p) => p.isLocalParticipant);

  // Only show REAL active remote (not ghost)
  const remote = participants.find(
    (p) => !p.isLocalParticipant && p.connectionQuality !== "unknown",
  );

  const remoteLabel = localRole === "interviewer" ? "Candidate" : "Interviewer";

  return (
    <div className="relative w-full overflow-hidden bg-gray-800 rounded-xl aspect-video">
      {/* ── Remote participant (main, large) ── */}
      {remote ? (
        <div className="relative w-full h-full">
          <ParticipantView participant={remote} className="w-full h-full" />

          {/* Role label */}
          <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
            {remoteLabel}
          </span>
        </div>
      ) : (
        /* Waiting state while other side hasn't joined yet */
        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-500 rounded-full border-t-transparent animate-spin" />
          <p className="text-sm">
            Waiting for{" "}
            {localRole === "interviewer" ? "candidate" : "interviewer"} to
            join...
          </p>
        </div>
      )}

      {/* ── Local participant (Picture-in-Picture, small) ── */}
      {local && (
        <div className="absolute w-32 h-24 overflow-hidden border border-gray-600 rounded-lg shadow-lg bottom-2 right-2">
          <ParticipantView participant={local} />
          <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
            You
          </span>
        </div>
      )}

      {/* ── Participant count badge ── */}
      <div className="absolute top-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
        {participants.length} / 2
      </div>

      {/* ── No one in call yet ── */}
      {participants.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
          Connecting to video...
        </div>
      )}
    </div>
  );
};
