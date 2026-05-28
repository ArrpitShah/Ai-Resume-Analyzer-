import { fileToText } from "../Services/parserServices.js"
import { convertToJson } from "../Services/jsonExtractor.js"
import { jsonTotext } from "../Services/jsonTotext.js"
import { saveResume, getResumeById, getResumesByUser, deleteResume, getResumeVersions } from "../Services/resumeService.js"
import { generateAndSaveEmbedding } from "../Services/embeddingService.js"
import { getCache, setCache, delCache } from "../Services/cacheService.js"
import {
  generateRequestId,
  logRequest,
  logParser,
  logAI,
  logError,
  logPerformance,
} from "../Services/logger.js"



export const uploadResume = async (req, res) => {
  const request_id = generateRequestId()  
  const user_id    = req.user?.id ?? null
  const totalStart = Date.now()

  try {
    let rawText
    let fileInfo = {}
    const { parent_id } = req.body

    if (req.file) {
      await logRequest({ request_id, user_id, file_type: req.file.mimetype, file_size_kb: Math.round(req.file.size / 1024), status: "processing" })
      const parseStart = Date.now()
      rawText = await fileToText({ buffer: req.file.buffer, mimetype: req.file.mimetype, originalname: req.file.originalname })
      const parse_ms = Date.now() - parseStart
      fileInfo = { file_name: req.file.originalname, file_path: "", file_size: req.file.size, mime_type: req.file.mimetype }
      await logParser({ request_id, user_id, event: "PARSE_SUCCESS", file_type: req.file.mimetype, duration_ms: parse_ms })
    } else if (req.body?.text) {
      await logRequest({ request_id, user_id, file_type: "text/plain", file_size_kb: Math.round(req.body.text.length / 1024), status: "processing" })
      rawText = req.body.text
    } else {
      await logError({ request_id, user_id, error_type: "NO_INPUT", error_message: "No file or text provided" })
      return res.status(400).json({ error: "No file or text provided." })
    }

    if (!rawText || rawText.trim().length < 50) {
      await logError({ request_id, user_id, error_type: "CONTENT_TOO_SHORT", error_message: "Resume content too short" })
      return res.status(400).json({ error: "Resume content too short to process." })
    }

    const aiStart = Date.now()
    const jsonData = await convertToJson(rawText)
    const ai_ms = Date.now() - aiStart

    await logAI({ user_id, model_name: "gemini-2.5-flash", provider: "google", latency_ms: ai_ms, status: "success", retry_count: 0, extraction_source: "ai", request_payload: { text_length: rawText.length } })

    const plainText = jsonTotext(jsonData)
    const { resume_id, version } = await saveResume(jsonData, plainText, fileInfo, user_id, parent_id)

    generateAndSaveEmbedding(resume_id, plainText).catch(err => console.warn(`Embedding failed: ${err.message}`))

    // ── Invalidate Cache ───────────────────────
    if (user_id) await delCache(`resumes:user:${user_id}`)

    await logPerformance({ request_id, user_id, total_ms: Date.now() - totalStart, parse_ms: req.file ? Date.now() - totalStart - ai_ms : null, ai_ms })

    res.status(201).json({ message: "Resume uploaded successfully", resume_id, version, data: jsonData })
  } catch (err) {
    console.error("[uploadResume] Error:", err.message)
    res.status(500).json({ error: "Failed to process resume." })
  }
}

export const fetchResumeVersions = async (req, res) => {
  try {
    const versions = await getResumeVersions(req.params.id)
    res.json({ success: true, data: versions })
  } catch (err) {
    console.error("[fetchResumeVersions] Error:", err.message)
    res.status(500).json({ error: "Failed to fetch versions." })
  }
}

export const fetchResumeById = async (req, res) => {
  try {
    const resume = await getResumeById(req.params.id)
    if (!resume) return res.status(404).json({ error: "Resume not found." })
    res.json({ data: resume })
  } catch (err) {
    console.error("[fetchResumeById] Error:", err.message)
    res.status(500).json({ error: "Failed to fetch resume." })
  }
}

export const fetchResumesByUser = async (req, res) => {
  try {
    const userId = req.params.userId
    const cacheKey = `resumes:user:${userId}`

    // ── Cache Check ────────────────────────────
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.json({ data: cached, cached: true })
    }

    const resumes = await getResumesByUser(userId)
    
    // ── Save to Cache (5 minutes) ──────────────
    await setCache(cacheKey, resumes, 300)

    res.json({ data: resumes })
  } catch (err) {
    console.error("[fetchResumesByUser] Error:", err.message)
    res.status(500).json({ error: "Failed to fetch resumes." })
  }
}

export const removeResume = async (req, res) => {
  try {
    const resume = await getResumeById(req.params.id)
    await deleteResume(req.params.id)
    
    // ── Invalidate Cache ───────────────────────
    if (resume?.user_id) await delCache(`resumes:user:${resume.user_id}`)

    res.json({ message: "Resume deleted successfully" })
  } catch (err) {
    console.error("[removeResume] Error:", err.message)
    res.status(500).json({ error: "Failed to delete resume." })
  }
}
