import express from "express"
import dns from "node:dns"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"

dns.setDefaultResultOrder("ipv4first")

import resumeRoutes   from "./Routes/resumeRoutes.js"
import jdRoutes       from "./Routes/jdRoutes.js"
import matchingRoutes from "./Routes/matchingRoutes.js"
import authRoutes     from "./Routes/authRoutes.js"
import adminRoutes    from "./Routes/adminRoutes.js"
import paymentRoutes  from "./Routes/paymentRoutes.js"  // ✅ NEW
import analyticsRoutes from "./Routes/analyticsRoutes.js"
import rewriteRoutes from "./Routes/rewriteRoutes.js"
import roadmapRoutes from "./Routes/roadmapRoutes.js"
import coverLetterRoutes from "./Routes/coverLetterRoutes.js"
import exportRoutes from "./Routes/exportRoutes.js"
import {
  generalLimiter,
  sanitizeInput,
  requestLogger,
  errorHandler,
  validateEnv,
} from "./Middleware/securityMiddleware.js"

dotenv.config()
validateEnv()

const app = express()

// ── Security ──────────────────────────────────
app.use(helmet())
app.use(helmet.noSniff())
app.use(helmet.xssFilter())
app.use(helmet.hidePoweredBy())

// ── CORS ──────────────────────────────────────
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ??
  "http://localhost:3000,http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: Origin ${origin} not allowed`))
  },
  methods:        ["GET", "POST", "DELETE", "OPTIONS", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials:    true,
}))

// ✅ Stripe Webhook — Raw body PEHLE aana chahiye (before express.json)
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" })
)

// ── Body Parser ───────────────────────────────
app.use(express.json({ limit: "2mb" }))
app.use(express.urlencoded({ extended: true, limit: "2mb" }))

// ── Middleware ────────────────────────────────
app.use(requestLogger)
app.use(generalLimiter)
app.use(sanitizeInput)

// ── Health Check ──────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status:    "ok",
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
  })
})

// ── Routes ────────────────────────────────────
app.use("/api/auth",    authRoutes)
app.use("/api/resume",  resumeRoutes)
app.use("/api/jd",      jdRoutes)
app.use("/api/match",   matchingRoutes)
app.use("/api/payment", paymentRoutes)   // ✅ NEW
app.use("/api/analytics", analyticsRoutes)
app.use("/api/rewrite",   rewriteRoutes)
app.use("/api/roadmap",   roadmapRoutes)
app.use("/api/cover-letter", coverLetterRoutes)
app.use("/api/export",       exportRoutes)
app.use("/admin",       adminRoutes)

// ── 404 ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." })
})

// ── Error Handler ─────────────────────────────
app.use(errorHandler)

// ── Start Server ──────────────────────────────
const PORT = process.env.PORT ?? 5000

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Running on port ${PORT} 🚀`)
  console.log(`[Server] Environment: ${process.env.NODE_ENV ?? "development"}`)
  console.log(`[Server] Patch Version: 1.0.1 (Fixed Export)`)
})

process.on("SIGTERM", () => {
  server.close(() => process.exit(0))
})

process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled Rejection:", reason)
})

process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught Exception:", err.message)
  process.exit(1)
})