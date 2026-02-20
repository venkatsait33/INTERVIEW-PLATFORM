export const LANGUAGES = [
  "javascript",
  "python",
  "java",
  "cpp",
  "typescript",
  "go",
];

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
