import supabase from "../config/Supabaseclient.js"

export async function getDashboardAnalytics(userId) {
  const [resumesRes, analysesRes, jdsRes] = await Promise.all([
    supabase.from("resumes").select("created_at, structured_json").eq("user_id", userId),
    supabase.from("resume_jd_analysis").select("ats_score, match_percentage, overall_rating, created_at").eq("user_id", userId),
    supabase.from("job_descriptions").select("created_at").eq("user_id", userId),
  ])

  if (resumesRes.error) throw new Error(resumesRes.error.message)
  if (analysesRes.error) throw new Error(analysesRes.error.message)
  if (jdsRes.error) throw new Error(jdsRes.error.message)

  const resumes  = resumesRes.data
  const analyses = analysesRes.data
  const jds      = jdsRes.data

  // 1. Basic Stats
  const totalResumes = resumes.length
  const totalMatches = analyses.length
  const avgATS       = analyses.length ? Math.round(analyses.reduce((acc, a) => acc + (a.ats_score || 0), 0) / analyses.length) : 0

  // 2. Rating Breakdown
  const ratings = { Excellent: 0, Good: 0, Average: 0, Poor: 0 }
  analyses.forEach(a => {
    if (ratings[a.overall_rating] !== undefined) ratings[a.overall_rating]++
  })

  // 3. Trends (Last 7 Days)
  const today = new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(today.getDate() - i)
    return d.toISOString().split("T")[0]
  }).reverse()

  const trendData = last7Days.map(date => ({
    date,
    resumes: resumes.filter(r => r.created_at.startsWith(date)).length,
    matches: analyses.filter(a => a.created_at.startsWith(date)).length,
  }))

  // 4. Skills Heatmap (Top 10)
  const skillCount = {}
  resumes.forEach(r => {
    const skills = r.structured_json?.skills?.technical ?? []
    skills.forEach(s => {
      skillCount[s] = (skillCount[s] || 0) + 1
    })
  })
  const topSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  return {
    summary: { totalResumes, totalMatches, avgATS },
    ratings,
    trends: trendData,
    topSkills,
  }
}
