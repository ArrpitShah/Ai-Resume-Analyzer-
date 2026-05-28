import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Send an email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email content in HTML
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"RemCheck AI" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    console.log("[EmailService] Email sent:", info.messageId)
    return info
  } catch (err) {
    console.error("[EmailService] Error sending email:", err.message)
    // We don't throw here to avoid breaking the main flow
    return null
  }
}

/**
 * Format the analysis result into a nice HTML email
 * @param {object} analysis - The analysis result object
 * @returns {string} HTML content
 */
export const formatAnalysisEmail = (analysis) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #2563EB, #6366f1); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Analysis Complete! 🚀</h1>
        <p style="margin: 8px 0 0; opacity: 0.9;">Your resume vs job description insights</p>
      </div>
      <div style="padding: 24px; color: #1e293b;">
        <h2 style="font-size: 18px; margin-bottom: 16px;">Hello ${analysis.candidate_name || 'there'},</h2>
        <p style="line-height: 1.6;">Your resume has been analyzed against <strong>${analysis.job_title || 'the job description'}</strong>. Here are your key scores:</p>
        
        <div style="display: flex; justify-content: space-around; background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #2563EB;">${analysis.ats_score}%</div>
            <div style="font-size: 12px; color: #64748b;">ATS Score</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${analysis.match_percentage}%</div>
            <div style="font-size: 12px; color: #64748b;">Match %</div>
          </div>
        </div>

        <h3 style="font-size: 16px; border-bottom: 2px solid #eff6ff; padding-bottom: 8px;">Key Strengths</h3>
        <ul style="padding-left: 20px; line-height: 1.6;">
          ${(analysis.strengths || []).slice(0, 3).map(s => `<li>${s}</li>`).join('')}
        </ul>

        <h3 style="font-size: 16px; border-bottom: 2px solid #eff6ff; padding-bottom: 8px;">Missing Skills</h3>
        <div style="margin: 10px 0;">
          ${(analysis.skill_gap?.missing_required || []).slice(0, 5).map(s => `<span style="display: inline-block; background: #fef2f2; color: #ef4444; padding: 4px 10px; border-radius: 100px; font-size: 12px; margin: 0 4px 4px 0; border: 1px solid #fecaca;">${s}</span>`).join('')}
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a href="${process.env.FRONTEND_URL}/dashboard/analyses/${analysis.analysis_id}" style="background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View Full Analysis</a>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} RemCheck AI. All rights reserved.
      </div>
    </div>
  `
}

/**
 * Send a welcome email to a new user
 * @param {string} to - User email
 * @param {string} name - User name
 */
export const sendWelcomeEmail = async (to, name) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px; padding: 24px;">
      <h1 style="color: #2563EB;">Welcome to RemCheck, ${name}! 🚀</h1>
      <p>We're excited to help you land your dream job with AI-powered resume insights.</p>
      <p>Get started by uploading your resume and matching it against any job description.</p>
      <div style="margin-top: 24px;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to Dashboard</a>
      </div>
    </div>
  `
  return sendEmail(to, "Welcome to RemCheck! ✨", html)
}

/**
 * Send analysis result email
 * @param {string} to - User email
 * @param {object} analysisData - The analysis result
 */
export const sendAnalysisEmail = async (to, analysisData) => {
  const html = formatAnalysisEmail(analysisData)
  return sendEmail(to, `Analysis Ready: ${analysisData.job_title || "Job Opportunity"} 📊`, html)
}
