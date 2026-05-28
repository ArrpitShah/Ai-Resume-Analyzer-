import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"
import supabase from "../config/Supabaseclient.js"

export const exportAnalysisPDF = async (req, res) => {
  try {
    const { id } = req.params
    console.log("[exportController] Exporting analysis ID:", id)
    
    // 1. Fetch analysis data
    const { data: analysis, error } = await supabase
      .from("resume_jd_analysis")
      .select(`
        *,
        resumes!resume_id(candidate_name),
        job_descriptions!jd_id(title, company_name)
      `)
      .eq("id", id)
      .single()

    if (error || !analysis) {
      console.error("[exportController] Supabase error or no data:", error)
      return res.status(404).json({ error: "Analysis not found." })
    }

    console.log("[exportController] Data fetched for candidate:", analysis.resumes?.candidate_name)

    const candidateName = analysis.resumes?.candidate_name || "Candidate"
    const jobTitle = analysis.job_descriptions?.title || "Job Opportunity"
    const company = analysis.job_descriptions?.company_name || "Company"

    // 2. HTML Template
    console.log("[exportController] Generating HTML...")
    const htmlContent = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563EB; padding-bottom: 20px; }
          .candidate-info { margin-bottom: 20px; text-align: center; }
          .rating-badge { display: inline-block; padding: 6px 16px; border-radius: 100px; background: #2563EB15; color: #2563EB; font-weight: 800; text-transform: uppercase; font-size: 14px; margin-top: 10px; border: 1px solid #2563EB30; }
          
          .score-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px; }
          .score-card { background: #f8fafc; padding: 15px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; }
          .score-val { font-size: 28px; font-weight: 800; color: #2563EB; }
          .score-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em; margin-top: 4px; }
          
          .section { margin-bottom: 30px; break-inside: avoid; }
          .section-title { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 12px; border-left: 4px solid #2563EB; padding-left: 12px; text-transform: uppercase; letter-spacing: 0.02em; }
          
          .summary-text { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 13px; }
          
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          
          ul { padding-left: 20px; margin: 0; }
          li { font-size: 13px; margin-bottom: 6px; }
          
          .skill-tag { display: inline-block; background: #eff6ff; color: #2563EB; padding: 4px 12px; border-radius: 100px; font-size: 11px; margin: 4px; font-weight: 600; border: 1px solid #dbeafe; }
          .missing-tag { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
          .kw-tag { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
          
          .sug-card { margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #2563EB; }
          .sug-area { font-weight: 700; color: #2563EB; font-size: 12px; margin-bottom: 4px; }
          .sug-text { font-size: 12px; color: #475569; }
          
          .q-card { margin-bottom: 12px; padding: 12px; border: 1px solid #f1f5f9; border-radius: 10px; }
          .q-cat { display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; margin-bottom: 6px; }
          .q-text { font-weight: 700; font-size: 13px; margin-bottom: 6px; color: #0f172a; }
          .q-tip { font-size: 11px; color: #d97706; background: #fffbeb; padding: 8px; border-radius: 6px; display: flex; align-items: flex-start; gap: 6px; }
          
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin:0; color:#2563EB; font-size: 24px; font-weight: 800;">REMAI ANALYSIS REPORT</h1>
        </div>

        <div class="candidate-info">
          <h2 style="margin:0; font-size: 18px; color: #0f172a;">${candidateName}</h2>
          <p style="margin:5px 0; color:#64748b; font-size: 14px; font-weight: 600;">${jobTitle} at ${company}</p>
          <div class="rating-badge">${analysis.overall_rating || 'N/A'}</div>
        </div>

        <div class="score-grid">
          <div class="score-card">
            <div class="score-val">${analysis.match_percentage}%</div>
            <div class="score-label">Match Score</div>
          </div>
          <div class="score-card">
            <div class="score-val">${analysis.ats_score}%</div>
            <div class="score-label">ATS Score</div>
          </div>
          <div class="score-card">
            <div class="score-val">${Math.round(((analysis.match_percentage || 0) + (analysis.ats_score || 0)) / 2)}%</div>
            <div class="score-label">Overall Compatibility</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Analysis Summary</div>
          <div class="summary-text">${analysis.improvement_summary}</div>
        </div>

        <div class="grid-2">
          <div class="section">
            <div class="section-title">Key Strengths</div>
            <ul>
              ${(analysis.strengths || []).map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
          <div class="section">
            <div class="section-title">Required Skill Gaps</div>
            <div>
              ${(analysis.skill_gap?.missing_required || []).length > 0 
                ? (analysis.skill_gap.missing_required).map(s => `<span class="skill-tag missing-tag">${s}</span>`).join('')
                : '<p style="font-size:12px; color:#10b981; font-weight:700;">✓ All required skills found!</p>'}
            </div>
          </div>
        </div>

        ${(analysis.missing_keywords || []).length > 0 ? `
        <div class="section">
          <div class="section-title">Missing Keywords</div>
          <div>
            ${analysis.missing_keywords.map(kw => `<span class="skill-tag kw-tag">${kw}</span>`).join('')}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Improvement Suggestions</div>
          ${(analysis.improvement_suggestions || []).map(item => `
            <div class="sug-card">
              <div class="sug-area">${item.area}</div>
              <div class="sug-text">${item.suggestion}</div>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <div class="section-title">Interview Preparation (Q&A)</div>
          ${(analysis.interview_questions || []).map(q => `
            <div class="q-card">
              <div class="q-cat">${q.category}</div>
              <div class="q-text">${q.question}</div>
              <div class="q-tip">
                <span>💡</span>
                <span>${q.tip}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          Generated by <strong>RemAI Analysis Engine</strong> on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          <br/>
          Confidential Report for Recruiting Purposes
        </div>
      </body>
    </html>
    `

    // 3. Launch Puppeteer
    const isWin = process.platform === "win32"
    console.log("[exportController] Launching Puppeteer, isWin:", isWin)
    
    const launchOptions = isWin ? {
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    } : {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    }

    const browser = await puppeteer.launch(launchOptions)
    console.log("[exportController] Browser launched")

    const page = await browser.newPage()
    await page.setContent(htmlContent)
    console.log("[exportController] Content set")

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true })
    console.log("[exportController] PDF generated, buffer length:", pdfBuffer.length)

    await browser.close()

    res.contentType("application/pdf")
    res.send(pdfBuffer)

  } catch (err) {
    console.error("[exportController] CRITICAL ERROR:", err)
    res.status(500).json({ 
      error: "Failed to generate PDF.", 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}
