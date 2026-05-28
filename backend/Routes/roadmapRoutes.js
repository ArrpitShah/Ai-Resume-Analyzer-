import express from "express"
import { generateRoadmap } from "../Controllers/roadmapController.js"
import { protect } from "../Middleware/authMiddleware.js"

const router = express.Router()

// POST /api/roadmap/generate
router.post("/generate", protect, generateRoadmap)

export default router
