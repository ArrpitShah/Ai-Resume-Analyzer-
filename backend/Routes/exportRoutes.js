import express from "express"
import { exportAnalysisPDF } from "../Controllers/exportController.js"
import { protect } from "../Middleware/authMiddleware.js"

const router = express.Router()

// GET /api/export/analysis/:id
router.get("/analysis/:id", protect, exportAnalysisPDF)

export default router
