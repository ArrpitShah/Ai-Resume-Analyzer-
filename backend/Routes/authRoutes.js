import express from "express"
import {
  register,
  loginUser,
  logoutUser,
  getMe,
  refresh,
  forgotPasswordHandler,
} from "../Controllers/authController.js"
import { protect } from "../Middleware/authMiddleware.js"
import rateLimit from "express-rate-limit"

const router = express.Router()


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,                    
  message: { error: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
})


router.post("/signup",          authLimiter, register)
router.post("/login",           authLimiter, loginUser)
router.post("/logout",          logoutUser)
router.post("/refresh",         refresh)
router.post("/forgot-password", authLimiter, forgotPasswordHandler)

router.get("/me", protect, getMe)

export default router