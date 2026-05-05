import { convertJDToJson, jdToText } from "../Services/jdExtractor.js"
import { saveJD, getJDById, getJDsByUser, deleteJD, saveJDEmbedding } from "../Services/jdService.js"
import { generateEmbedding } from "../Services/embeddingService.js"



export const uploadJD = async (req, res) => {
  try {
    const text = req.body?.text

    if (!text) {
      return res.status(400).json({ error: "No text provided. Send JD text in body.text field." })
    }

    const jsonData  = await convertJDToJson(text)
    const plainText = jdToText(jsonData)
    const userId    = req.user?.id ?? null

    const { jd_id } = await saveJD(jsonData, plainText, userId)

    
    try {
      const embedding = await generateEmbedding(plainText)
      await saveJDEmbedding(jd_id, embedding)
      console.log(`[uploadJD] Embedding saved for ${jd_id}`)
    } catch (embErr) {
      console.warn(`[uploadJD] Embedding failed: ${embErr.message}`)
    }

    res.status(201).json({
      message:    "Job Description uploaded and processed successfully",
      jd_id,
      data:       jsonData,
      plain_text: plainText,
    })

  } catch (err) {
    console.error("[uploadJD] Error:", err.message)
    res.status(500).json({ error: "Failed to process job description. Please try again." })
  }
}



export const fetchJDById = async (req, res) => {
  try {
    const jd = await getJDById(req.params.id)
    if (!jd) return res.status(404).json({ error: "Job description not found." })
    res.json({ data: jd })
  } catch (err) {
    console.error("[fetchJDById] Error:", err.message)
    res.status(500).json({ error: "Failed to fetch job description." })
  }
}



export const fetchJDsByUser = async (req, res) => {
  try {
    const jds = await getJDsByUser(req.params.userId)
    res.json({ data: jds })
  } catch (err) {
    console.error("[fetchJDsByUser] Error:", err.message)
    res.status(500).json({ error: "Failed to fetch job descriptions." })
  }
}



export const removeJD = async (req, res) => {
  try {
    await deleteJD(req.params.id)
    res.json({ message: "Job Description deleted successfully" })
  } catch (err) {
    console.error("[removeJD] Error:", err.message)
    res.status(500).json({ error: "Failed to delete job description." })
  }
}