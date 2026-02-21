// controllers/codeController.js
import axios from "axios";

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions";
const RAPID_API_KEY = process.env.RAPID_API_KEY; // get from RapidAPI

const languageMap = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  typescript: 74,
  go: 60,
};

export const runCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    const language_id = languageMap[language];

    if (!language_id) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    // Step 1: Submit code
    const submission = await axios.post(
      `${JUDGE0_URL}?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id,
        stdin: "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPID_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      },
    );

    const result = submission.data;

    return res.json({
      output:
        result.stdout || result.stderr || result.compile_output || "No output",
    });
  } catch (error) {
    console.error("Code execution error:", error.message);
    return res.status(500).json({
      error: "Code execution failed",
    });
  }
};
