import supabase from "../config/Supabaseclient.js"

export const checkSubscriptionLimit = async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: "Unauthorized" })

    // 1. Get user subscription status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("[SubscriptionMiddleware] Profile fetch error:", profileError.message)
      // Default to free if profile not found or error
      req.subscriptionStatus = "free"
    } else {
      req.subscriptionStatus = profile.subscription_status || "free"
    }

    // 2. If Pro, skip checks
    if (req.subscriptionStatus === "pro") {
      return next()
    }

    // 3. For Free users, count analyses this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count, error: countError } = await supabase
      .from("resume_jd_analysis")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString())

    if (countError) {
      console.error("[SubscriptionMiddleware] Count error:", countError.message)
      return res.status(500).json({ error: "Failed to verify usage limits." })
    }

    const LIMIT = 5
    if (count >= LIMIT) {
      return res.status(403).json({
        error: "Monthly limit reached",
        message: `You have used all ${LIMIT} free analyses for this month. Upgrade to Pro for unlimited access.`,
        limitReached: true
      })
    }

    next()
  } catch (err) {
    console.error("[SubscriptionMiddleware] Unexpected error:", err.message)
    res.status(500).json({ error: "Internal server error during limit check." })
  }
}
