import express from "express"
import {
  analyzeMatch,
  compareMultiple,
  fetchAnalysisById,
  fetchAnalysesByUser,
} from "../Controllers/matchingController.js"
import {
  matchLimiter,
  validateUUID,
  validateMatchInput,
} from "../Middleware/securityMiddleware.js"
import { protect } from "../Middleware/authMiddleware.js"
import { checkSubscriptionLimit } from "../Middleware/subscriptionMiddleware.js"

const router = express.Router()

router.post("/analyze", protect, checkSubscriptionLimit, matchLimiter, validateMatchInput, analyzeMatch)
router.post("/compare", protect, checkSubscriptionLimit, matchLimiter, compareMultiple)
router.get("/user/:userId", protect, validateUUID, fetchAnalysesByUser)
router.get("/:id", protect, validateUUID, fetchAnalysisById)

export default router