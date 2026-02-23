import { Editor } from "@monaco-editor/react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { LANGUAGES } from "../../utils/editor";

const CodeEditor = ({
  language,
  runCode,
  code,
  running,
  handleCodeChange,
  handleLanguageChange,
  output,
}) => {
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
        </div>
        <Group className="min-h-30" orientation="vertical">
          <Panel minSize={200} maxSize={1000}>
            <div className="flex flex-col justify-between h-full mt-2 ">
              <Editor
                height="100%"
                language={language}
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
                }}
              />
            </div>
          </Panel>
          <Separator className="border-2 " />
          {/* Terminal output */}
          <Panel minSize={100}>
            <div className="p-3 overflow-auto font-mono text-xs text-green-400 bg-black border-t border-gray-800 shrink-0">
              <p className="mb-1 text-gray-600">─── Terminal ───</p>
              {running ? (
                <span className="animate-pulse">Running...</span>
              ) : output === null ? (
                <p className="text-sm text-base-content/50">
                  Click "Run Code" to see the output here...
                </p>
              ) : output.success ? (
                <pre className="font-mono text-sm whitespace-pre-wrap text-success">
                  {output.output}
                </pre>
              ) : (
                <div>
                  {output.output && (
                    <pre className="mb-2 font-mono text-sm whitespace-pre-wrap text-base-content">
                      {output.output}
                    </pre>
                  )}
                  <pre className="font-mono text-sm whitespace-pre-wrap text-error">
                    {output.error}
                  </pre>
                </div>
              )}
            </div>
          </Panel>
        </Group>
      </div>
    </>
  );
};
export default CodeEditor;
