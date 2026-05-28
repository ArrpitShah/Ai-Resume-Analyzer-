import express from "express"
import { suggestRewrites } from "../Controllers/rewriteController.js"
import { protect } from "../Middleware/authMiddleware.js"
import { validateMatchInput } from "../Middleware/securityMiddleware.js"

const router = express.Router()

// POST /api/rewrite/suggest
router.post("/suggest", protect, validateMatchInput, suggestRewrites)

export default router
