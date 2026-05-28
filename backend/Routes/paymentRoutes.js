import express from "express"
import {
  createCheckoutSession,
  stripeWebhook,
  getProfile,
  updateProfile,
} from "../Controllers/paymentController.js"
import { protect } from "../Middleware/authMiddleware.js"

const router = express.Router()

// ✅ Stripe Webhook — no auth, raw body handled in server.js
router.post("/webhook", stripeWebhook)

// ✅ Get user subscription status & preferences
router.get("/profile", protect, getProfile)

// ✅ Update user preferences
router.patch("/profile", protect, updateProfile)

// ✅ Create Stripe checkout session
router.post("/create-checkout-session", protect, createCheckoutSession)

export default router