import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
import supabase from "../config/Supabaseclient.js"

export const generateCoverLetter = async (req, res) => {
  try {
    const { resume_id, jd_id, tone = "professional" } = req.body
    const userId = req.user?.id

    if (!resume_id || !jd_id) {
      return res.status(400).json({ error: "resume_id and jd_id are required." })
    }

    // 1. Fetch Resume and JD details
    // We need some structured info if possible, or just plain text
    const { data: resume, error: rErr } = await supabase
      .from("resumes")
      .select("plain_text, candidate_name")
      .eq("id", resume_id)
      .single()

    const { data: jd, error: jErr } = await supabase
      .from("job_descriptions")
      .select("plain_text, title, company_name")
      .eq("id", jd_id)
      .single()

    if (rErr || !resume) return res.status(404).json({ error: "Resume not found." })
    if (jErr || !jd) return res.status(404).json({ error: "Job description not found." })

    const prompt = `Write a compelling cover letter for this candidate: ${resume.candidate_name} applying for ${jd.title} at ${jd.company_name}. 
    Candidate Details: ${resume.plain_text}
    Job Description: ${jd.plain_text}
    Tone: ${tone}. 
    Max 300 words. 
    Return ONLY a valid JSON object: { "cover_letter": "string", "subject_line": "string" }`

    let clData

    // 2. Call AI API
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      })
      const cleaned = message.content[0].text.replace(/```json|```/g, "").trim()
      clData = JSON.parse(cleaned)
    } else {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      const result = await model.generateContent(prompt)
      const cleaned = result.response.text().replace(/```json|```/g, "").trim()
      clData = JSON.parse(cleaned)
    }

    // 3. Save to Supabase
    const { data: savedData, error: sErr } = await supabase
      .from("cover_letters")
      .insert({
        user_id: userId,
        resume_id,
        jd_id,
        tone,
        cover_letter: clData.cover_letter,
        subject_line: clData.subject_line,
      })
      .select()
      .single()

    if (sErr) console.error("[coverLetterController] Supabase Error:", sErr)

    res.json({
      cover_letter: clData.cover_letter,
      subject_line: clData.subject_line
    })

  } catch (err) {
    console.error("[coverLetterController] Error:", err.message)
    res.status(500).json({ error: "Failed to generate cover letter." })
  }
}
