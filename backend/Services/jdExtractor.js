import { GoogleGenerativeAI } from "@google/generative-ai"

const SYSTEM_PROMPT = `You are an expert job description parser. Extract structured data from job description text.

Return ONLY a valid JSON object — no markdown, no backticks, no explanation.

The JSON must follow this exact schema:

{
  "title": "string",
  "company_name": "string",
  "location": "string",
  "employment_type": "string",
  "experience_required": "string",
  "salary_range": "string",
  "summary": "string",
  "responsibilities": ["string"],
  "requirements": {
    "required": ["string"],
    "preferred": ["string"]
  },
  "skills": {
    "technical": ["string"],
    "soft": ["string"],
    "tools": ["string"]
  },
  "benefits": ["string"],
  "about_company": "string"
}

Rules:
- Use empty string "" for missing string fields
- Use empty array [] for missing array fields
- employment_type: "Full-time", "Part-time", "Contract", "Internship", "Remote" etc.
- experience_required: e.g. "2-4 years", "3+ years", "Fresher"
- responsibilities: each responsibility as separate string
- requirements.required: must-have skills/qualifications
- requirements.preferred: good-to-have skills
- skills.technical: programming languages, frameworks, libraries
- skills.tools: software tools, platforms
- skills.soft: communication, leadership etc.
- Extract salary if mentioned
- Never return null`



function sanitizeText(text) {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/\\/g, "/")
    .replace(/[^\x00-\x7F]/g, " ")
    .trim()
}



function safeParseJSON(raw) {
  let cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (e1) {
    try {
      const sanitized = cleaned
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/\t/g, " ")
        .trim()
      return JSON.parse(sanitized)
    } catch (e2) {
      throw new Error(`JSON parse failed: ${e1.message}`)
    }
  }
}


function applyDefaults(parsed) {
  const skills = parsed.skills ?? {}
  const requirements = parsed.requirements ?? {}

  return {
    title:               parsed.title               ?? "",
    company_name:        parsed.company_name        ?? "",
    location:            parsed.location            ?? "",
    employment_type:     parsed.employment_type     ?? "",
    experience_required: parsed.experience_required ?? "",
    salary_range:        parsed.salary_range        ?? "",
    summary:             parsed.summary             ?? "",
    responsibilities:    Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
    requirements: {
      required:  Array.isArray(requirements.required)  ? requirements.required  : [],
      preferred: Array.isArray(requirements.preferred) ? requirements.preferred : [],
    },
    skills: {
      technical: Array.isArray(skills.technical) ? skills.technical : [],
      soft:      Array.isArray(skills.soft)      ? skills.soft      : [],
      tools:     Array.isArray(skills.tools)     ? skills.tools     : [],
    },
    benefits:       Array.isArray(parsed.benefits)  ? parsed.benefits  : [],
    about_company:  parsed.about_company ?? "",
  }
}



export function jdToText(jd) {
  const lines = []

  if (jd.title)               lines.push(`Job Title: ${jd.title}`)
  if (jd.company_name)        lines.push(`Company: ${jd.company_name}`)
  if (jd.location)            lines.push(`Location: ${jd.location}`)
  if (jd.employment_type)     lines.push(`Employment Type: ${jd.employment_type}`)
  if (jd.experience_required) lines.push(`Experience Required: ${jd.experience_required}`)
  if (jd.salary_range)        lines.push(`Salary: ${jd.salary_range}`)

  lines.push("")

  if (jd.summary) {
    lines.push(`Summary: ${jd.summary}`)
    lines.push("")
  }

  if (jd.responsibilities?.length) {
    lines.push("Responsibilities:")
    for (const r of jd.responsibilities) lines.push(`  - ${r}`)
    lines.push("")
  }

  if (jd.requirements?.required?.length) {
    lines.push(`Required Skills: ${jd.requirements.required.join(", ")}`)
  }
  if (jd.requirements?.preferred?.length) {
    lines.push(`Preferred Skills: ${jd.requirements.preferred.join(", ")}`)
  }

  if (jd.skills?.technical?.length) lines.push(`Technical Skills: ${jd.skills.technical.join(", ")}`)
  if (jd.skills?.tools?.length)     lines.push(`Tools: ${jd.skills.tools.join(", ")}`)
  if (jd.skills?.soft?.length)      lines.push(`Soft Skills: ${jd.skills.soft.join(", ")}`)

  lines.push("")

  if (jd.benefits?.length) {
    lines.push(`Benefits: ${jd.benefits.join(", ")}`)
  }

  if (jd.about_company) {
    lines.push(`About Company: ${jd.about_company}`)
  }

  return lines.join("\n").trim()
}


export async function convertJDToJson(text) {
  if (!text || typeof text !== "string" || text.trim().length < 10) {
    throw new Error("convertJDToJson: valid text required")
  }

  const cleaned = sanitizeText(text)

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt   = `${SYSTEM_PROMPT}\n\nExtract structured data from this job description:\n\n${cleaned}`
    const response = await model.generateContent(prompt)
    const raw      = response.response.text()

    const parsed    = safeParseJSON(raw)
    const structured = applyDefaults(parsed)

    structured._meta = {
      parsed_at:          new Date().toISOString(),
      extraction_source:  "gemini",
      skills_count:       Object.values(structured.skills).flat().length,
      responsibilities_count: structured.responsibilities.length,
    }

    structured.raw_text = text
    return structured

  } catch (err) {
    console.warn(`[jdExtractor] Gemini failed (${err.message})`)
    throw err
  }
}