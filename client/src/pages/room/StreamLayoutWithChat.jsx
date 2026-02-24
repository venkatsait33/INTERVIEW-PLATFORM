import {
  CallControls,
  StreamCall,
  StreamTheme,
  StreamVideo,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

import { InterviewVideoLayout } from "./VideoStream";

const StreamLayoutWithChat = ({
  videoClient,
  call,
  messages,
  sendChat,
  chatInput,
  setChatInput,
  user,
  chatBottomRef,
}) => {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-gray-900">
      <div className="flex-1 min-h-0 overflow-hidden bg-gray-800 shrink-0 aspect-video">
        {videoClient && call ? (
          <StreamVideo client={videoClient}>
            <StreamCall call={call}>
              <StreamTheme>
                <div className="flex flex-col w-full h-full">
                  <div className="flex-1 min-h-0 overflow-hidden ">
                    <InterviewVideoLayout localRole={user?.role} />
                  </div>
                  <div className="flex items-center justify-center py-2 bg-gray-900 border-t border-gray-800 shrink-0">
                    <CallControls />
                  </div>
                </div>
              </StreamTheme>
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full gap-2 text-gray-500">
            <div className="w-6 h-6 border-2 border-gray-600 rounded-full border-t-indigo-400 animate-spin" />
            <span className="text-xs">Connecting video...</span>
          </div>
        )}
      </div>

      {/* ── Chat zone ── */}
      <div
        className="flex flex-col border-t border-gray-800 shrink-0"
        style={{ height: "260px" }}
      >
        {/* Chat header */}
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-800 shrink-0">
          💬 Chat
        </div>

        {/* Message list — scrolls inside the fixed zone */}
        <div className="flex-1 min-h-0 px-3 py-2 space-y-2 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="mt-4 text-xs text-center text-gray-500">
              No messages yet. Say hi! 👋
            </p>
          ) : (
            messages.map((msg) => {
              const isMine =
                msg.fromId === user?._id || msg.fromId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                      isMine
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-200"
                    }`}
                  >
                    {!isMine && (
                      <p className="text-gray-400 text-[10px] font-medium mb-0.5">
                        {msg.from}
                      </p>
                    )}
                    <p className="break-words">{msg.message}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${isMine ? "text-indigo-300" : "text-gray-500"}`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input bar */}
        <form
          onSubmit={sendChat}
          className="flex gap-2 p-2 border-t border-gray-800 shrink-0"
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
            disabled={!chatInput.trim()}
            className="px-3 py-2 text-xs text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            →
          </button>
        </form>
      </div>
    </div>
  );
};

export default StreamLayoutWithChat;
