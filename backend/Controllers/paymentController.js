import Stripe from "stripe"
import supabase from "../config/Supabaseclient.js"
import dotenv from "dotenv"

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ─────────────────────────────────────────────
//  GET USER PROFILE (subscription status)
// ─────────────────────────────────────────────

export const getProfile = async (req, res) => {
  try {
    let { data, error } = await supabase
      .from("profiles")
      .select("subscription_status, stripe_customer_id, auto_jd_match, weekly_report, monthly_analyses")
      .eq("id", req.user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({ 
          id: req.user.id,
          subscription_status: 'free',
          monthly_analyses: 0
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      data = newProfile
    } else if (error) {
      throw error
    }

    res.json({ 
      data: {
        ...data,
        usage_count: data.monthly_analyses || 0,
        monthly_limit: 5
      } 
    })
  } catch (err) {
    console.error("[getProfile] Error:", err.message)
    res.status(500).json({ error: "Failed to fetch profile." })
  }
}

// ─────────────────────────────────────────────
//  CREATE CHECKOUT SESSION
// ─────────────────────────────────────────────

export const createCheckoutSession = async (req, res) => {
  try {
    const { priceId } = req.body
    const user = req.user

    if (!priceId) {
      return res.status(400).json({ error: "Price ID is required." })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard/settings?success=true`,
      cancel_url:  `${process.env.FRONTEND_URL}/dashboard/settings?canceled=true`,
      customer_email: user.email,
      metadata: { user_id: user.id },
    })

    res.json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error("[createCheckoutSession] Error:", err.message)
    res.status(500).json({ error: "Failed to create checkout session." })
  }
}

// ─────────────────────────────────────────────
//  STRIPE WEBHOOK
// ─────────────────────────────────────────────

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"]
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error(`[Webhook] Signature Error: ${err.message}`)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // ── Payment Success ──────────────────────────
  if (event.type === "checkout.session.completed") {
    const session        = event.data.object
    const userId         = session.metadata.user_id
    const customerId     = session.customer
    const subscriptionId = session.subscription

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id:                     userId,
          subscription_status:    "pro",
          stripe_customer_id:     customerId,
          stripe_subscription_id: subscriptionId,
          updated_at:             new Date().toISOString(),
        })

      if (error) throw error
      console.log(`[Webhook] ✅ User ${userId} upgraded to Pro.`)
    } catch (dbErr) {
      console.error(`[Webhook] DB Error: ${dbErr.message}`)
      return res.status(500).json({ error: "Webhook handled but DB update failed." })
    }
  }

  // ── Subscription Canceled ────────────────────
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object
    const customerId   = subscription.customer

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: "free",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId)

      if (error) throw error
      console.log(`[Webhook] ℹ️ Subscription canceled for customer ${customerId}`)
    } catch (dbErr) {
      console.error(`[Webhook] Cancel DB Error: ${dbErr.message}`)
    }
  }

  res.json({ received: true })
}

// ─────────────────────────────────────────────
//  UPDATE USER PROFILE PREFERENCES
// ─────────────────────────────────────────────

export const updateProfile = async (req, res) => {
  try {
    const { auto_jd_match, weekly_report } = req.body
    const userId = req.user.id

    const updates = {}
    if (typeof auto_jd_match === "boolean") updates.auto_jd_match = auto_jd_match
    if (typeof weekly_report === "boolean") updates.weekly_report = weekly_report
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error
    res.json({ message: "Profile updated successfully", data })
  } catch (err) {
    console.error("[updateProfile] Error:", err.message)
    res.status(500).json({ error: "Failed to update profile." })
  }
}