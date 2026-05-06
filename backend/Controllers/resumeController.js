import { fileToText } from "../Services/parserServices.js"
import { convertToJson } from "../Services/jsonExtractor.js"
import { jsonTotext } from "../Services/jsonTotext.js"
import { saveResume, getResumeById, getResumesByUser, deleteResume } from "../Services/resumeService.js"
import { generateAndSaveEmbedding } from "../Services/embeddingService.js"
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

    
    if (req.file) {

    
      await logRequest({
        request_id,
        user_id,
        file_type:    req.file.mimetype,
        file_size_kb: Math.round(req.file.size / 1024),
        status:       "processing",
      })

      
      const parseStart = Date.now()

      rawText = await fileToText({
        buffer:       req.file.buffer,
        mimetype:     req.file.mimetype,
        originalname: req.file.originalname,
      })

      const parse_ms = Date.now() - parseStart

      fileInfo = {
        file_name: req.file.originalname,
        file_path: "",
        file_size: req.file.size,
        mime_type: req.file.mimetype,
      }

    
      await logParser({
        request_id,
        user_id,
        event:       "PARSE_SUCCESS",
        file_type:   req.file.mimetype,
        duration_ms: parse_ms,
      })

    } else if (req.body?.text) {

      
      await logRequest({
        request_id,
        user_id,
        file_type:    "text/plain",
        file_size_kb: Math.round(req.body.text.length / 1024),
        status:       "processing",
      })

      rawText = req.body.text

    } else {

      
      await logError({
        request_id,
        user_id,
        error_type:    "NO_INPUT",
        error_message: "No file or text provided",
      })

      return res.status(400).json({
        error: "No file or text provided. Send a file in 'resume' field or text in body."
      })
    }

    
    if (!rawText || rawText.trim().length < 50) {

      await logError({
        request_id,
        user_id,
        error_type:    "CONTENT_TOO_SHORT",
        error_message: "Resume content too short to process",
      })

      return res.status(400).json({ error: "Resume content too short to process." })
    }

    
    const aiStart = Date.now()

    const jsonData = await convertToJson(rawText)

    const ai_ms = Date.now() - aiStart

   
    await logAI({
      user_id,
      model_name:        "claude-sonnet-4-20250514",
      provider:          "anthropic",
      latency_ms:        ai_ms,
      status:            "success",
      retry_count:       0,
      extraction_source: jsonData._meta?.extraction_source ?? "ai",
      request_payload:   { text_length: rawText.length },
      response_metadata: {
        skills_count:     jsonData._meta?.skills_count,
        experience_count: jsonData._meta?.experience_count,
        projects_count:   jsonData._meta?.projects_count,
      },
    })

    
    const plainText        = jsonToText(jsonData)
    const { resume_id }    = await saveResume(jsonData, plainText, fileInfo, user_id)

    
    generateAndSaveEmbedding(resume_id, plainText)
      .then(() => console.log(`[uploadResume] Embedding saved for ${resume_id}`))
      .catch(err => console.warn(`[uploadResume] Embedding failed: ${err.message}`))

   
    await logPerformance({
      request_id,
      user_id,
      total_ms: Date.now() - totalStart,
      parse_ms: req.file ? Date.now() - totalStart - ai_ms : null,
      ai_ms,
    })

  
    res.status(201).json({
      message:    "Resume uploaded and processed successfully",
      resume_id,
      data:       jsonData,
      plain_text: plainText,
    })

  } catch (err) {

    
    await logError({
      request_id,
      user_id,
      error_type:    err.name ?? "UNKNOWN_ERROR",
      error_message: err.message,
      stack_trace:   err.stack,
    })

    console.error("[uploadResume] Error:", err.message)
    res.status(500).json({ error: "Failed to process resume. Please try again." })
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
    const resumes = await getResumesByUser(req.params.userId)
    res.json({ data: resumes })
  } catch (err) {
    console.error("[fetchResumesByUser] Error:", err.message)
    res.status(500).json({ error: "Failed to fetch resumes." })
  }
}



export const removeResume = async (req, res) => {
  try {
    await deleteResume(req.params.id)
    res.json({ message: "Resume deleted successfully" })
  } catch (err) {
    console.error("[removeResume] Error:", err.message)
    res.status(500).json({ error: "Failed to delete resume." })
  }
}