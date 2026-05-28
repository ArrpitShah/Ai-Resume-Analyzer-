import express from "express"
import { generateCoverLetter } from "../Controllers/coverLetterController.js"
import { protect } from "../Middleware/authMiddleware.js"

const router = express.Router()

// POST /api/cover-letter/generate
router.post("/generate", protect, generateCoverLetter)

export default router
