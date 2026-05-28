import express from "express"
import supabase from "../config/Supabaseclient.js"
import { getMetrics } from "../Controllers/adminController.js"
import { protect } from "../Middleware/authMiddleware.js"

const router = express.Router()

// GET /admin/metrics
router.get("/metrics", protect, getMetrics)

router.get("/logs", async (req, res) => {
  const { table = "error_logs", limit = 50 } = req.query

  const allowedTables = [
    "request_logs",
    "parser_logs", 
    "ai_logs",
    "error_logs",
    "performance_logs"
  ]

  if (!allowedTables.includes(table)) {
    return res.status(400).json({ error: `Invalid table. Allowed: ${allowedTables.join(", ")}` })
  }

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Number(limit))

  if (error) return res.status(500).json({ error: error.message })
  res.json({ count: data.length, data })
})

export default router