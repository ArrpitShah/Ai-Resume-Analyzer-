import supabase from "../config/Supabaseclient.js"

export const checkProPlan = async (req, res, next) => {
  try {
    const userId = req.user.id

    // 1. Fetch profile for subscription status and usage
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("subscription_status, monthly_analyses")
      .eq("id", userId)
      .single()

    if (error || !profile) {
      // If no profile, we assume free and 0 usage (or create one)
      return next()
    }

    // 2. If user is PRO, no limits
    if (profile.subscription_status === "pro") {
      return next()
    }

    // 3. If FREE, check limit (5 analyses)
    if (profile.monthly_analyses >= 5) {
      return res.status(403).json({
        error: "Monthly limit reached",
        message: "You've used all 5 free analyses for this month. Upgrade to Pro for unlimited access!",
        upgrade: true
      })
    }

    next()
  } catch (err) {
    console.error("[planMiddleware] Error:", err.message)
    next() // Proceed anyway to avoid blocking users on error
  }
}
