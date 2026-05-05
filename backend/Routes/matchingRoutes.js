import express from "express"
import {
  analyzeMatch,
  fetchAnalysisById,
  fetchAnalysesByUser,
} from "../Controllers/matchingController.js"
import {
  matchLimiter,
  validateUUID,
  validateMatchInput,
} from "../Middleware/securityMiddleware.js"
import { protect } from "../Middleware/authMiddleware.js"

const router = express.Router()

router.post("/analyze", protect, matchLimiter, validateMatchInput, analyzeMatch)
router.get("/user/:userId", protect, validateUUID, fetchAnalysesByUser)
router.get("/:id", protect, validateUUID, fetchAnalysisById)

export default router