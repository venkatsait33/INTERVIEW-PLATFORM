function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
export function TabSwitchAlert({ alerts, onDismiss }) {
  if (alerts.length === 0) return null;
  const latest = alerts[alerts.length - 1];
  const isHidden = latest.hidden;

  return (
    <div
      className={`shrink-0 flex items-center justify-between px-4 py-2.5 text-sm font-semibold
      border-b animate-fade-in transition-all ${
        isHidden
          ? "bg-amber-950/80 border-amber-800 text-amber-300"
          : "bg-teal-950/80 border-teal-800 text-teal-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{isHidden ? "⚠️" : "👁"}</span>
        <span>
          <strong>{latest.name}</strong> ({latest.role}){" "}
          {isHidden
            ? "switched away from the interview tab"
            : "returned to the interview tab"}
        </span>
        <span className="text-xs opacity-60 font-normal font-mono">
          {formatTime(latest.timestamp)}
        </span>
        {isHidden && latest.role === "candidate" && (
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-amber-800/60 text-amber-200 border border-amber-700">
            ⚠ Integrity alert
          </span>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-xs opacity-60 hover:opacity-100 ml-4 px-2 py-1 rounded hover:bg-white/10"
      >
        Dismiss
      </button>
    </div>
  );
}
