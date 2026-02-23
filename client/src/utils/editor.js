export const LANGUAGES = ["javascript", "python", "java"];

export const DEFAULT_CODE = {
  javascript:
    "// JavaScript\nfunction solution(input) {\n  // Your code here\n  \n}\n\nconsole.log(solution());",
  python:
    "# Python\ndef solution(input):\n    # Your code here\n    pass\n\nprint(solution(None))",
  java: "// Java\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}",
  cpp: "// C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}",
  typescript:
    "// TypeScript\nfunction solution(input: any): any {\n  // Your code here\n  \n}\n\nconsole.log(solution(undefined));",
  go: '// Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    // Your code here\n    fmt.Println("Hello")\n}',
};

export const Languages = {
  javascript: {
    label: "JavaScript",
    version: "18.15.0",
    pistonLang: "javascript",
    ext: "js",
    monacoLang: "javascript",
  },
  typescript: {
    label: "TypeScript",
    version: "5.0.3",
    pistonLang: "typescript",
    ext: "ts",
    monacoLang: "typescript",
  },
  python: {
    label: "Python",
    version: "3.10.0",
    pistonLang: "python",
    ext: "py",
    monacoLang: "python",
  },
  java: {
    label: "Java",
    version: "15.0.2",
    pistonLang: "java",
    ext: "java",
    monacoLang: "java",
  },
  cpp: {
    label: "C++",
    version: "10.2.0",
    pistonLang: "c++",
    ext: "cpp",
    monacoLang: "cpp",
  },
  go: {
    label: "Go",
    version: "1.16.2",
    pistonLang: "go",
    ext: "go",
    monacoLang: "go",
  },
  rust: {
    label: "Rust",
    version: "1.50.0",
    pistonLang: "rust",
    ext: "rs",
    monacoLang: "rust",
  },
};

export const EVENT_META = {
  room_joined: {
    icon: "🟢",
    label: "joined the room",
    color: "text-emerald-400",
    bg: "bg-emerald-950/40 border-emerald-900/60",
  },
  room_left: {
    icon: "🔴",
    label: "left the room",
    color: "text-red-400",
    bg: "bg-red-950/40 border-red-900/60",
  },
  tab_hidden: {
    icon: "⚠️",
    label: "switched away from tab",
    color: "text-amber-400",
    bg: "bg-amber-950/60 border-amber-800/80",
  },
  tab_visible: {
    icon: "👁",
    label: "returned to tab",
    color: "text-teal-400",
    bg: "bg-teal-950/40 border-teal-900/60",
  },
  code_run: {
    icon: "▶",
    label: "ran code",
    color: "text-violet-400",
    bg: "bg-violet-950/40 border-violet-900/60",
  },
  language_changed: {
    icon: "🔄",
    label: "changed language",
    color: "text-blue-400",
    bg: "bg-blue-950/40 border-blue-900/60",
  },
  chat_message: {
    icon: "💬",
    label: "sent a message",
    color: "text-slate-400",
    bg: "bg-slate-800/40 border-slate-700/60",
  },
  no_show_reported: {
    icon: "🚨",
    label: "reported no-show",
    color: "text-red-400",
    bg: "bg-red-950/60 border-red-800/80",
  },
  interview_cancelled: {
    icon: "✕",
    label: "interview cancelled",
    color: "text-red-400",
    bg: "bg-red-950/60 border-red-800/80",
  },
  interview_completed: {
    icon: "✓",
    label: "interview completed",
    color: "text-emerald-400",
    bg: "bg-emerald-950/40 border-emerald-900/60",
  },
  feedback_submitted: {
    icon: "📝",
    label: "submitted feedback",
    color: "text-violet-400",
    bg: "bg-violet-950/40 border-violet-900/60",
  },
};
