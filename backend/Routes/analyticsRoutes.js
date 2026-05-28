import express from "express"
import { fetchDashboardAnalytics } from "../Controllers/analyticsController.js"
import { protect } from "../Middleware/authMiddleware.js"

const router = express.Router()

router.get("/dashboard", protect, fetchDashboardAnalytics)

export default router
