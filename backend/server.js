import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import resumeRoutes  from "./Routes/resumeRoutes.js"
import jdRoutes      from "./Routes/jdRoutes.js"
import matchingRoutes from "./Routes/matchingRoutes.js"
import authRoutes    from "./Routes/authRoutes.js"
import adminRoutes   from "./Routes/adminRoutes.js"
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

app.use(helmet())
app.use(helmet.noSniff())
app.use(helmet.xssFilter())
app.use(helmet.hidePoweredBy())


const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ??
  "https://remcheck-web.vercel.app,https://remcheck-ai.vercel.app,http://localhost:3000,http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map(o => o.trim())

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
      callback(null, true)
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`)
      callback(new Error("Not allowed by CORS"))
    }
  },
  methods: ["GET", "POST", "DELETE", "OPTIONS", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}))


app.use(express.json({ limit: "2mb" }))
app.use(express.urlencoded({ extended: true, limit: "2mb" }))


app.use(requestLogger)
app.use(generalLimiter)
app.use(sanitizeInput)


app.get("/", (req, res) => {
  res.json({
    message:   "Welcome to RemCheck AI API",
    status:    "running",
    docs:      "Please use the frontend to interact with this API",
    health:    "/health"
  })
})


app.get("/health", (req, res) => {
  res.json({
    status:    "ok",
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    env:       process.env.NODE_ENV ?? "development",
  })
})


app.use("/api/auth",   authRoutes)
app.use("/api/resume", resumeRoutes)
app.use("/api/jd",     jdRoutes)
app.use("/api/match",  matchingRoutes)
app.use("/admin",      adminRoutes)


app.use((req, res) => {
  res.status(404).json({ error: "Route not found." })
})

app.use(errorHandler)


const PORT = process.env.PORT ?? 5000

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Running on port ${PORT} 🚀`)
  console.log(`[Server] Environment: ${process.env.NODE_ENV ?? "development"}`)
  console.log(`[Server] Allowed Origins: ${allowedOrigins.join(", ")}`)
})


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