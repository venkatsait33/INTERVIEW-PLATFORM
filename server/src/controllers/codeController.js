// import axios from "axios";

// export const runCode = async (req, res) => {
//   try {
//     const { language, code } = req.body;

//     const response = await axios.post("http://localhost:2000/api/v2/execute", {
//       language,
//       version: "*",
//       files: [{ content: code }],
//     });

//     const result = response.data;

//     return res.json({
//       output:
//         result.run?.stdout ||
//         result.run?.stderr ||
//         result.run?.output ||
//         "No output",
//     });
//   } catch (error) {
//     console.error("Execution error:", error.message);
//     return res.status(500).json({
//       error: "Code execution failed",
//     });
//   }
// };

import axios from "axios";

export const runCode = async (req, res) => {
  try {
    const { language, code } = req.body;

    const response = await axios.post("http://localhost:2000/api/v2/execute", {
      language,
      version: "*",
      files: [{ content: code }],
    });

    const result = response.data;

    return res.json({
      output:
        result.run?.stdout ||
        result.run?.stderr ||
        result.run?.output ||
        "No output",
    });
  } catch (error) {
    console.error("Execution error:", error.message);
    return res.status(500).json({
      error: "Code execution failed",
    });
  }
};
