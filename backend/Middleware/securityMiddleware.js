import rateLimit from "express-rate-limit"

export const resumeUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "Too many resume uploads. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
})

export const jdUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: "Too many JD uploads. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
})

export const matchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { error: "Too many analysis requests. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
})


export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
})



const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validateUUID(req, res, next) {
  const id = req.params.id ?? req.params.userId ?? req.params.resumeId ?? req.params.jdId

  if (id && !UUID_REGEX.test(id)) {
    return res.status(400).json({ error: "Invalid ID format." })
  }
  next()
}



function sanitize(value) {
  if (typeof value !== "string") return value
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
}

function sanitizeObject(obj) {
  if (typeof obj === "string") return sanitize(obj)
  if (Array.isArray(obj))      return obj.map(sanitizeObject)
  if (obj && typeof obj === "object") {
    const clean = {}
    for (const [k, v] of Object.entries(obj)) {
      clean[k] = sanitizeObject(v)
    }
    return clean
  }
  return obj
}

export function sanitizeInput(req, res, next) {
 
  const skipPaths = ["/api/auth/signup", "/api/auth/login", "/api/auth/forgot-password"]
  if (skipPaths.some(p => req.originalUrl.includes(p))) return next()

  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body)
  }
  next()
}



export function validateTextInput(maxLength = 50000) {
  return (req, res, next) => {
    const text = req.body?.text
    if (text) {
      if (typeof text !== "string") {
        return res.status(400).json({ error: "Text must be a string." })
      }
      if (text.trim().length < 10) {
        return res.status(400).json({ error: "Text too short. Minimum 10 characters required." })
      }
      if (text.length > maxLength) {
        return res.status(400).json({ error: `Text too long. Maximum ${maxLength} characters allowed.` })
      }
    }
    next()
  }
}



const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validateMatchInput(req, res, next) {
  const { resume_id, jd_id } = req.body

  if (!resume_id || !jd_id) {
    return res.status(400).json({ error: "resume_id and jd_id is required ." })
  }

  if (!UUID_RX.test(resume_id)) {
    return res.status(400).json({ error: "Invalid resume_id format." })
  }

  if (!UUID_RX.test(jd_id)) {
    return res.status(400).json({ error: "Invalid jd_id format." })
  }

  next()
}


export function errorHandler(err, req, res, next) {
  console.error("[ErrorHandler]", err.message)


  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large. Maximum 10MB allowed." })
  }
  if (err.message?.includes("Only PDF")) {
    return res.status(415).json({ error: err.message })
  }

  res.status(500).json({ error: "Something went wrong. Please try again." })
}



export function requestLogger(req, res, next) {
  const start = Date.now()
  const { method, url, ip } = req

  res.on("finish", () => {
    const ms = Date.now() - start
    console.log(`[${new Date().toISOString()}] ${method} ${url} ${res.statusCode} — ${ms}ms — ${ip}`)
  })

  next()
}



export function validateEnv() {
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "GEMINI_API_KEY", "PORT"]
  const missing  = required.filter(k => !process.env[k])

  if (missing.length > 0) {
    console.error(`[ENV] Missing required environment variables: ${missing.join(", ")}`)
    process.exit(1)
  }

  console.log("[ENV] All required environment variables are present.")
}