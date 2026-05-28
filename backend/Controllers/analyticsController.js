import { getDashboardAnalytics } from "../Services/analyticsService.js"

export const fetchDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.id
    const data = await getDashboardAnalytics(userId)
    res.json({ success: true, data })
  } catch (err) {
    console.error("[analyticsController] Error:", err.message)
    res.status(500).json({ error: "Failed to fetch analytics data." })
  }
}
