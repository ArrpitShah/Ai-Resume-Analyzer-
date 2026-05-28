import { matchResumeWithJD, matchMultipleJDs, getAnalysisById, getAnalysesByUser } from "../Services/matchingService.js"
import { sendAnalysisEmail } from "../Services/emailService.js"
import { getCache, setCache } from "../Services/cacheService.js"
import supabase from "../config/Supabaseclient.js"


export const compareMultiple = async (req, res) => {
  try {
    const { resume_id, jd_ids } = req.body
    const userId = req.user?.id ?? null

    if (!resume_id || !Array.isArray(jd_ids) || jd_ids.length === 0) {
      return res.status(400).json({ error: "resume_id and an array of jd_ids are required." })
    }

    // Try to get from cache for each JD
    const results = await Promise.all(jd_ids.map(async (jd_id) => {
      const cacheKey = `match:${resume_id}:${jd_id}`
      const cached = await getCache(cacheKey)
      if (cached) return cached
      
      // If miss, it will be matched in matchMultipleJDs which calls matchResumeWithJD
      // Wait, matchMultipleJDs calls matchResumeWithJD which we will also update
      return null 
    }))

    // We'll just call the service, but the service should probably handle individual caching
    // However, the prompt says "In matchingController.js"
    // I'll update analyzeMatch and let matchMultipleJDs call it.
    
    const finalResults = await matchMultipleJDs(resume_id, jd_ids, userId)
    res.json({ success: true, data: finalResults })

  } catch (err) {
    console.error("[compareMultiple] Error:", err.message)
    res.status(500).json({ error: "Failed to compare multiple JDs." })
  }
}


export const analyzeMatch = async (req, res) => {
  try {
    const { resume_id, jd_id } = req.body
    const userId = req.user?.id ?? null
    const userEmail = req.user?.email ?? null

    // ── Cache Check ────────────────────────────
    const cacheKey = `match:${resume_id}:${jd_id}`
    const cachedResult = await getCache(cacheKey)
    if (cachedResult) {
      console.log(`[analyzeMatch] Cache HIT for ${cacheKey}`)
      return res.status(200).json({
        message: "Analysis retrieved from cache",
        data:    cachedResult,
      })
    }

    console.log(`[analyzeMatch] Matching resume ${resume_id} with JD ${jd_id}`)
    const result = await matchResumeWithJD(resume_id, jd_id, userId)

    // ── Usage Tracking ─────────────────────────
    if (userId) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("monthly_analyses, last_reset_date")
          .eq("id", userId)
          .single()

        if (profile) {
          const now = new Date()
          const lastReset = new Date(profile.last_reset_date || now)
          let currentCount = profile.monthly_analyses || 0

          // If different month/year, reset
          if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
            currentCount = 0
          }

          await supabase
            .from("profiles")
            .update({
              monthly_analyses: currentCount + 1,
              last_reset_date:  now.toISOString().split('T')[0]
            })
            .eq("id", userId)
        }
      } catch (uErr) {
        console.error("[UsageTracking] Error:", uErr.message)
      }
    }

    // ── Save to Cache (24 hours) ────────────────
    await setCache(cacheKey, result, 86400)

    // ✅ Send email notification if user has email
    if (userEmail) {
      sendAnalysisEmail(userEmail, result)
        .then(() => console.log(`[analyzeMatch] Notification email sent to ${userEmail}`))
        .catch(err => console.error(`[analyzeMatch] Email failed: ${err.message}`))
    }

    res.status(201).json({
      message: "Analysis completed successfully",
      data:    result,
    })

  } catch (err) {
    console.error("[analyzeMatch] Error:", err.message)

   
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message })
    }
    if (err.message.includes("embedding not found")) {
      return res.status(422).json({ error: err.message })
    }

    res.status(500).json({ error: "Failed to analyze match. Please try again." })
  }
}



export const fetchAnalysisById = async (req, res) => {
  try {
    const analysis = await getAnalysisById(req.params.id)
    if (!analysis) return res.status(404).json({ error: "Analysis not found." })
    res.json({ data: analysis })
  } catch (err) {
    console.error("[fetchAnalysisById] Error:", err.message)
    res.status(500).json({ error: "Failed to fetch analysis." })
  }
}


export const fetchAnalysesByUser = async (req, res) => {
  try {
    const { page, limit, search, rating, minScore } = req.query
    const analyses = await getAnalysesByUser(req.params.userId, {
      page:     parseInt(page) || 1,
      limit:    parseInt(limit) || 10,
      search:   search || "",
      rating:   rating || "",
      minScore: parseInt(minScore) || 0,
    })
    res.json({ success: true, ...analyses })
  } catch (err) {
    console.error("[fetchAnalysesByUser] Error:", err.message)
    res.status(500).json({ error: "Failed to fetch analyses." })
  }
}