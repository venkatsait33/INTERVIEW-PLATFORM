import express from "express";
import { runCode } from "../controllers/codeController.js";
// import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/run", runCode);

export default router;
