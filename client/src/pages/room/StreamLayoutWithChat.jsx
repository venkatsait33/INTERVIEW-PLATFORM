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
}) => {
  return (
    <div>
      <div className="flex flex-col justify-between w-full h-full ">
        {/* Video */}
        <div className="flex-col items-center justify-center gap-2 text-gray-500 bg-gray-800 lex aspect-video rounded-xl">
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
        <div className="flex flex-col mt-2 overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold border-b border-gray-800 text-gray-40o">
            💬 Chat
          </div>

          <div className="w-full overflow-y-auto h-30 ">
            {messages.length === 0 ? (
              <p className="h-10 pt-6 text-xs text-center text-gray-600">
                No messages yet
              </p>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-xs ${
                    msg.from === user?.name ? "text-right" : ""
                  } h-full`}
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
  );
};
export default StreamLayoutWithChat;
