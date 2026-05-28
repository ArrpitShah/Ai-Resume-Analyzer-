import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
import supabase from "../config/Supabaseclient.js"

export const suggestRewrites = async (req, res) => {
  try {
    const { resume_id, jd_id } = req.body
    const userId = req.user?.id

    if (!resume_id || !jd_id) {
      return res.status(400).json({ error: "resume_id and jd_id are required." })
    }

    // 1. Fetch resume and JD text
    const { data: resume, error: rErr } = await supabase
      .from("resumes")
      .select("plain_text")
      .eq("id", resume_id)
      .single()

    const { data: jd, error: jErr } = await supabase
      .from("job_descriptions")
      .select("plain_text")
      .eq("id", jd_id)
      .single()

    if (rErr || !resume) return res.status(404).json({ error: "Resume not found." })
    if (jErr || !jd) return res.status(404).json({ error: "Job description not found." })

    const prompt = `Given this resume: ${resume.plain_text} and this job description: ${jd.plain_text}, suggest exactly 5 specific bullet point rewrites that would increase ATS score. Return JSON: { "suggestions": [{ "original": "string", "improved": "string", "reason": "string" }] }`

    let suggestionsData

    // 2. Call AI API (Prefer Claude as requested, fallback to Gemini if no key)
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      })

      let rawContent = message.content[0].text
      const cleaned = rawContent.replace(/```json|```/g, "").trim()
      suggestionsData = JSON.parse(cleaned)
    } else {
      // Fallback to Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      const result = await model.generateContent(prompt)
      const raw = result.response.text()
      const cleaned = raw.replace(/```json|```/g, "").trim()
      suggestionsData = JSON.parse(cleaned)
    }

    // 3. Save to Supabase
    const { data: savedData, error: sErr } = await supabase
      .from("rewrite_suggestions")
      .insert({
        user_id: userId,
        resume_id,
        jd_id,
        suggestions: suggestionsData.suggestions,
      })
      .select()
      .single()

    if (sErr) {
      console.error("[rewriteController] Supabase Insert Error:", sErr)
    }

    res.json({
      suggestions: suggestionsData.suggestions
    })

  } catch (err) {
    console.error("[rewriteController] Error:", err.message)
    res.status(500).json({ error: "Failed to generate rewrite suggestions." })
  }
}
