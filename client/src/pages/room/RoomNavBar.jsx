import { LANGUAGES } from "../../utils/editor";

const RoomNavBar = ({
  participants,
  language,
  handleLanguageChange,
  handleLeaveCall,
  handleAdmit,
  runCode,
  running,
  isInterviewer,
  candidateWaiting,
  setFeedbackModal,
}) => {
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
    </div>
  );
};
export default RoomNavBar;
