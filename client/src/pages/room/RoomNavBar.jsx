import { useEffect, useState } from "react";
import { LANGUAGES } from "../../utils/editor";
import { interviewService } from "../../services/interviews";

const RoomNavBar = ({
  participants,
  handleLeaveCall,
  handleAdmit,
  isInterviewer,
  candidateWaiting,
  setFeedbackModal,
  showNoShowButton,
  waitedMinutes,
  id,
}) => {
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewService
      .getOne(id)
      .then((res) => setInterview(res.data.data.interview))
      .catch(() => {
        toast.error("Interview not found");
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [id]);
  return (
    <div>
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

        <div className="flex items-center gap-3">
          <span className="max-w-xs text-sm font-medium text-gray-200 truncate">
            {interview?.title}
          </span>
          <span className="text-xs text-green-400 bg-green-900/40 px-2 py-0.5 rounded-full">
            ● Live
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

        {/* No-show button */}
        {showNoShowButton && (
          <button
            onClick={() => setNoShowConfirmOpen(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white rounded-lg bg-amber-500 hover:bg-amber-600 animate-pulse"
          >
            🚨 Report No-Show ({waitedMinutes}m)
          </button>
        )}
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
    </div>
  );
};
export default RoomNavBar;
