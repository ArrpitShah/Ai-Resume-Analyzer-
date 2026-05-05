import { matchResumeWithJD, getAnalysisById, getAnalysesByUser } from "../Services/matchingService.js"


export const analyzeMatch = async (req, res) => {
  try {
    const { resume_id, jd_id } = req.body
    const userId = req.user?.id ?? null

    console.log(`[analyzeMatch] Matching resume ${resume_id} with JD ${jd_id}`)
    const result = await matchResumeWithJD(resume_id, jd_id, userId)

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
    const analyses = await getAnalysesByUser(req.params.userId)
    res.json({ data: analyses })
  } catch (err) {
    console.error("[fetchAnalysesByUser] Error:", err.message)
    res.status(500).json({ error: "Failed to fetch analyses." })
  }
}