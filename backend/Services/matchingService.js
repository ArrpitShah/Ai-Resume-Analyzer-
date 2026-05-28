import { GoogleGenerativeAI } from "@google/generative-ai"
import supabase from "../config/Supabaseclient.js"



function cosineSimilarity(vecA, vecB) {
  if (typeof vecA === "string") vecA = vecA.replace(/[\[\]]/g, "").split(",").map(Number)
  if (typeof vecB === "string") vecB = vecB.replace(/[\[\]]/g, "").split(",").map(Number)

  if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0
  if (vecA.length !== vecB.length) return 0

  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < vecA.length; i++) {
    dot   += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}



async function getAIAnalysis(resumePlainText, jdPlainText, similarityScore) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = `You are an expert ATS (Applicant Tracking System) and resume analyzer.

Analyze this resume against the job description and return ONLY a valid JSON object.

RESUME:
${resumePlainText}

JOB DESCRIPTION:
${jdPlainText}

Vector Similarity Score: ${(similarityScore * 100).toFixed(1)}%

Return ONLY this JSON (no markdown, no backticks):
{
  "ats_score": <number 0-100, ATS compatibility score>,
  "match_percentage": <number 0-100, overall match percentage>,
  "overall_rating": <"Excellent" | "Good" | "Average" | "Poor">,
  "strengths": [<list of candidate's strong matching points>],
  "improvement_summary": "<2-3 line summary of what needs improvement>",
  "skill_gap": {
    "missing_required": [<skills required in JD but missing in resume>],
    "missing_preferred": [<preferred skills missing in resume>],
    "extra_skills": [<skills in resume not required but good to have>]
  },
  "missing_keywords": [<important keywords from JD missing in resume>],
  "improvement_suggestions": [
    {
      "area": "<area of improvement>",
      "suggestion": "<specific actionable suggestion>"
    }
  ],
  "interview_questions": [
    {
      "category": "<Technical | Behavioral | Situational>",
      "question": "<interview question based on JD and resume>",
      "tip": "<tip for answering this question>"
    }
  ]
}

Rules:
- ats_score: based on keyword matching, format, sections present
- match_percentage: overall fit considering skills, experience, education
- Generate exactly 8-10 interview questions
- Questions should be specific to candidate's background + JD requirements
- improvement_suggestions: at least 3-5 specific suggestions
- Be honest and accurate in assessment`

  const response = await model.generateContent(prompt)
  const raw = response.response.text()

  let cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  return JSON.parse(cleaned)
}



export async function matchResumeWithJD(resumeId, jdId, userId = null) {

  
  const [resumeResult, jdResult] = await Promise.all([
    supabase.from("resumes").select("id, plain_text, embedding, candidate_name").eq("id", resumeId).single(),
    supabase.from("job_descriptions").select("id, plain_text, embedding, title, company_name").eq("id", jdId).single(),
  ])

  if (resumeResult.error) throw new Error(`Resume not found: ${resumeResult.error.message}`)
  if (jdResult.error)     throw new Error(`JD not found: ${jdResult.error.message}`)

  const resume = resumeResult.data
  const jd     = jdResult.data

  if (!resume.embedding) throw new Error("Resume embedding not found. Please re-upload resume.")
  if (!jd.embedding)     throw new Error("JD embedding not found. Please re-upload JD.")


  const similarityScore = cosineSimilarity(resume.embedding, jd.embedding)
  const similarityPct   = parseFloat((similarityScore * 100).toFixed(1))
  console.log(`[matchingService] Similarity: ${similarityPct}%`)

  
  const analysis = await getAIAnalysis(resume.plain_text, jd.plain_text, similarityScore)

  const payload = {
    user_id:                 userId,
    resume_id:               resumeId,
    jd_id:                   jdId,
    ats_score:               analysis.ats_score              ?? 0,
    match_percentage:        analysis.match_percentage       ?? Math.round(similarityScore * 100),
    overall_rating:          analysis.overall_rating         ?? "Average",
    strengths:               analysis.strengths              ?? [],
    improvement_summary:     analysis.improvement_summary    ?? "",
    skill_gap:               analysis.skill_gap              ?? {},
    missing_keywords:        analysis.missing_keywords       ?? [],
    improvement_suggestions: analysis.improvement_suggestions ?? [],
    interview_questions:     analysis.interview_questions    ?? [],
    ai_full_response:        analysis,
    model_used:              "gemini-1.5-flash",
    processing_status:       "completed",
    version:                 1,
  }

  const { data, error } = await supabase
    .from("resume_jd_analysis")
    .insert(payload)
    .select("id")
    .single()

  if (error) throw new Error(`Failed to save analysis: ${error.message}`)

  console.log(`[matchingService] Analysis saved: ${data.id}`)

  return {
    analysis_id:      data.id,
    resume_id:        resumeId,
    jd_id:            jdId,
    candidate_name:   resume.candidate_name,
    job_title:        jd.title,
    company_name:     jd.company_name,
    similarity_score: similarityPct,   
    ...analysis,
  }
}



export async function matchMultipleJDs(resumeId, jdIds = [], userId = null) {
  if (jdIds.length > 5) throw new Error("Maximum 5 job descriptions allowed for comparison.")
  
  const results = await Promise.all(jdIds.map(async (jdId) => {
    try {
      return await matchResumeWithJD(resumeId, jdId, userId)
    } catch (err) {
      console.error(`[matchMultipleJDs] Failed for JD ${jdId}:`, err.message)
      return { jd_id: jdId, error: err.message }
    }
  }))

  return results
}


export async function getAnalysisById(analysisId) {
  const { data, error } = await supabase
    .from("resume_jd_analysis")
    .select("*")
    .eq("id", analysisId)
    .single()

  if (error) throw new Error(`Failed to fetch analysis: ${error.message}`)
  return data
}



export async function getAnalysesByUser(userId, options = {}) {
  const { page = 1, limit = 10, search = "", rating = "", minScore = 0 } = options
  const offset = (page - 1) * limit

  let query = supabase
    .from("resume_jd_analysis")
    .select(`
      id, resume_id, jd_id, match_percentage, ats_score, overall_rating, created_at,
      resumes!resume_id(candidate_name)
    `, { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (rating) query = query.eq("overall_rating", rating)
  if (minScore) query = query.gte("ats_score", minScore)

  const { data, error, count } = await query

  if (error) throw new Error(`Failed to fetch analyses: ${error.message}`)

  // Manual search filter if search term provided (Supabase joined filter is complex)
  let filteredData = data
  if (search) {
    filteredData = data.filter(a => 
      a.resumes?.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.overall_rating?.toLowerCase().includes(search.toLowerCase())
    )
  }

  return { data: filteredData, total: count, page, limit }
}