import { GoogleGenerativeAI } from "@google/generative-ai"
import supabase from "../config/Supabaseclient.js"

export const generateRoadmap = async (req, res) => {
  try {
    const { resume_id, jd_id } = req.body
    const userId = req.user?.id

    if (!resume_id || !jd_id) {
      return res.status(400).json({ error: "resume_id and jd_id are required." })
    }

    // 1. Fetch Skill Gaps from latest analysis
    const { data: analysis, error: aErr } = await supabase
      .from("resume_jd_analysis")
      .select("skill_gap")
      .eq("resume_id", resume_id)
      .eq("jd_id", jd_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (aErr || !analysis) {
      return res.status(404).json({ error: "Analysis not found. Please run match analysis first." })
    }

    const skillGaps = analysis.skill_gap?.missing_required || []
    if (skillGaps.length === 0) {
      return res.json({ 
        message: "No skill gaps found! You're fully qualified.",
        roadmap: [] 
      })
    }

    // 2. Call Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Given these skill gaps: ${JSON.stringify(skillGaps)}, create a 30-day learning roadmap. 
    Return ONLY a valid JSON object: 
    { 
      "roadmap": [ 
        { 
          "week": number, 
          "skills": string[], 
          "resources": [
            { "title": string, "url": string, "type": "video" | "article" | "course" }
          ], 
          "milestone": string 
        } 
      ] 
    }`

    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    const cleaned = raw.replace(/```json|```/g, "").trim()
    const roadmapData = JSON.parse(cleaned)

    // 3. Save to Supabase
    const { data: savedData, error: sErr } = await supabase
      .from("skill_roadmaps")
      .insert({
        user_id: userId,
        resume_id,
        jd_id,
        roadmap: roadmapData.roadmap,
      })
      .select()
      .single()

    if (sErr) {
      console.error("[roadmapController] Supabase Insert Error:", sErr)
    }

    res.json({
      roadmap: roadmapData.roadmap
    })

  } catch (err) {
    console.error("[roadmapController] Error:", err.message)
    res.status(500).json({ error: "Failed to generate skill roadmap." })
  }
}
