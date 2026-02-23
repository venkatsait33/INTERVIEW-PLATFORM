import { Editor } from "@monaco-editor/react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Languages } from "../../utils/editor";
import { useAuth } from "../../context/AuthContext";

const CodeEditor = ({
  language,
  runCode,
  code,
  running,
  handleCodeChange,
  handleLanguageChange,
  output,
  runningBy,
  isSuccess,
  outputText,
}) => {
  const { user } = useAuth();
  console.log(output);
  console.log(outputText);
  return (
    <>
      <div className="flex flex-col justify-between h-full">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none"
          >
            {Object.entries(Languages).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          {/* Run code */}
          <button
            onClick={runCode}
            disabled={running}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold
                transition-all select-none ${
                  running
                    ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/50 active:scale-95"
                }`}
          >
            {running ? (
              <>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block w-1 h-3 bg-slate-400 rounded-sm animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </span>
                {runningBy === user?.name
                  ? "Running…"
                  : `${runningBy} running…`}
              </>
            ) : (
              "▶  Run Code"
            )}
          </button>
        </div>
        <Group className="min-h-30" orientation="vertical">
          <Panel minSize={200} maxSize={1000}>
            <div className="flex flex-col justify-between h-full mt-2 ">
              <Editor
                height="100%"
                language={Languages[language]?.monacoLang || language}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  wordWrap: "on",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  renderLineHighlight: "all",
                  renderLineHighlight: "gutter",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>
          </Panel>
          <Separator className="border-2 " />
          {/* Terminal output */}
          <Panel minSize={100}>
            <div className="p-3 overflow-auto font-mono text-xs text-green-400 bg-black border-t border-gray-800 shrink-0">
              <p className="mb-1 text-gray-600">─── Terminal ───</p>
              {running && (
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"
                        style={{ animationDelay: `${i * 0.12}s` }}
                      />
                    ))}
                  </div>
                  {runningBy === user?.name
                    ? "Executing your code…"
                    : `${runningBy} is running code — output appears here too`}
                </div>
              )}
              {!running && output && (
                <pre
                  className={`text-xs font-mono whitespace-pre-wrap leading-relaxed ${
                    isSuccess(output) ? "text-emerald-300" : "text-red-400"
                  }`}
                >
                  {outputText}
                </pre>
              )}
              {!running && !output && (
                <p className="text-xs text-slate-700 italic mt-1">
                  Click <strong className="text-teal-600">▶ Run Code</strong> —
                  output appears here for{" "}
                  <strong className="text-teal-600">
                    both participants simultaneously
                  </strong>
                  .
                </p>
              )}
            </div>
          </Panel>
        </Group>
      </div>
    </>
  );
};
export default CodeEditor;
