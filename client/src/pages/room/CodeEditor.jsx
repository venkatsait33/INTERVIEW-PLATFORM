import { Editor } from "@monaco-editor/react";
import { Group, Panel, Separator } from "react-resizable-panels";

const CodeEditor = ({ language, code, running, handleCodeChange, output }) => {
  return (
    <>
      <div className="flex flex-col justify-between h-full">
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
            <div className="p-3 overflow-auto font-mono text-xs text-green-400 bg-black border-t border-gray-800  shrink-0">
              <p className="mb-1 text-gray-600">─── Terminal ───</p>
              {running ? (
                <span className="animate-pulse">Running...</span>
              ) : output === null ? (
                <p className="text-base-content/50 text-sm">
                  Click "Run Code" to see the output here...
                </p>
              ) : output.success ? (
                <pre className="text-sm font-mono text-success whitespace-pre-wrap">
                  {output.output}
                </pre>
              ) : (
                <div>
                  {output.output && (
                    <pre className="text-sm font-mono text-base-content whitespace-pre-wrap mb-2">
                      {output.output}
                    </pre>
                  )}
                  <pre className="text-sm font-mono text-error whitespace-pre-wrap">
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
