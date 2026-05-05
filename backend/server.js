import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import resumeRoutes from "./Routes/resumeRoutes.js"
import jdRoutes from "./Routes/jdRoutes.js"
import matchingRoutes from "./Routes/matchingRoutes.js"
import authRoutes from "./Routes/authRoutes.js"
import adminRoutes from "./Routes/adminRoutes.js"
import {
  generalLimiter,
  sanitizeInput,
  requestLogger,
  errorHandler,
  validateEnv,
} from "./Middleware/securityMiddleware.js"

dotenv.config()

// ── Validate env on startup ───────────────────
validateEnv()

const app = express()

// ─────────────────────────────────────────────
//  SECURITY HEADERS
// ─────────────────────────────────────────────
app.use(helmet())
app.use(helmet.noSniff())
app.use(helmet.xssFilter())
app.use(helmet.hidePoweredBy())

// ─────────────────────────────────────────────
//  CORS
// ─────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000,http://localhost:5173")
  .split(",")
  .map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: Origin ${origin} not allowed`))
  },
  methods:        ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials:    true,
}))

// ─────────────────────────────────────────────
//  BODY LIMITS
// ─────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" }))

// ─────────────────────────────────────────────
//  GLOBAL MIDDLEWARE
// ─────────────────────────────────────────────
app.use(requestLogger)
app.use(generalLimiter)
app.use(sanitizeInput)

// ─────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status:    "ok",
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
  })
})

// ─────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────
app.use("/api/auth",    authRoutes)     // Public — signup, login
app.use("/api/resume",  resumeRoutes)   // Protected
app.use("/api/jd",      jdRoutes)       // Protected
app.use("/api/match",   matchingRoutes) // Protected
app.use("/admin",       adminRoutes)    // Admin — logs check karne ke liye

// ─────────────────────────────────────────────
//  404 HANDLER
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." })
})

// ─────────────────────────────────────────────
//  GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────
app.use(errorHandler)

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────
const server = app.listen(process.env.PORT, () => {
  console.log(`[Server] Running on port ${process.env.PORT} 🚀`)
})

// ─────────────────────────────────────────────
//  GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM — shutting down gracefully")
  server.close(() => { process.exit(0) })
})

process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled Rejection:", reason)
})

process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught Exception:", err.message)
  process.exit(1)
})