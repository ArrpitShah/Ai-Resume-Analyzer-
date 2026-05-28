import { GoogleGenerativeAI } from "@google/generative-ai"

const SYSTEM_PROMPT = `You are an expert resume parser. Your job is to extract structured data from resume text.

Return ONLY a valid JSON object — no markdown, no backticks, no explanation.

The JSON must follow this exact schema:

{
  "basic_info": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  },
  "summary": "string",
  "skills": {
    "technical": ["string"],
    "soft": ["string"],
    "tools": ["string"],
    "languages": ["string"]
  },
  "experience": [
    {
      "company": "string",
      "title": "string",
      "location": "string",
      "start_date": "string",
      "end_date": "string",
      "is_current": false,
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "start_year": "string",
      "end_year": "string",
      "gpa": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "links": ["string"],
      "bullets": ["string"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "year": "string",
      "url": "string"
    }
  ],
  "achievements": ["string"],
  "responsibilities": ["string"],
  "spoken_languages": [
    {
      "language": "string",
      "proficiency": "string"
    }
  ]
}

BASIC INFO Rules:
- name: full name of candidate
- email: email address
- phone: phone number with country code
- location: city, state, country — extract from anywhere in resume
- linkedin:
  * If full URL found like "linkedin.com/in/username" → use as is
  * If "ï" or "in|" symbol found before username → that is LinkedIn → format as "linkedin.com/in/username"
  * If text contains "linkedin.com/in/username" anywhere → extract it
  * Look for LinkedIn keyword near a username
- github:
  * If full URL found like "github.com/username" → use as is
  * If "§" symbol found before username → that is GitHub icon → format as "github.com/username"
  * Example: "§nidhikumari30" → github: "github.com/nidhikumari30"
  * Look for GitHub keyword near a username
  * IMPORTANT: § is commonly used as GitHub icon in PDF resumes
- SPECIAL CASE — PDF contact line format:
  * "ïName|§username|email|phone" → ï = LinkedIn name display, § = GitHub username
  * "Name|§githubuser|linkedinuser|email" → § before = GitHub, next = LinkedIn
  * Always check for § symbol — it means GitHub
- portfolio: any personal website URL that is not linkedin or github

SUMMARY Rules:
- Extract summary/objective/profile section if present
- If no explicit summary section exists, generate a 2-3 line professional summary based on candidate's skills, experience and education
- Never leave summary empty

SKILLS Rules:
- technical: programming languages, frameworks, libraries (React, Node.js, TensorFlow etc.)
- tools: software tools, platforms, IDEs (Git, Docker, Figma, Linux, Windows etc.)
- languages: spoken/human languages ONLY (English, Hindi, French etc.)
- soft: soft skills like leadership, communication, teamwork etc.
- Do NOT put academic courses or subjects in technical skills

PROJECTS Rules:
- links: extract ONLY actual URLs starting with http/https or containing github.com/username/repo
  * Ignore words like "Repo", "Link", "Demo", "Source" — these are NOT links
  * If project name contains "(Repo)" or "[Repo]", it means repo exists but URL not given — leave links empty
- bullets: extract EACH responsibility/feature as a SEPARATE bullet point string
- description: first/main description line of project
- technologies: all tech stack mentioned for that project

EXPERIENCE Rules:
- bullets: each responsibility as separate string in array
- is_current: true if end_date contains "Present", "Current", "Now" or is missing

ACHIEVEMENTS Rules:
- Only actual achievements: awards, hackathon results, rankings, competitions, certifications
- Do NOT include responsibilities, club memberships, volunteer work here

RESPONSIBILITIES Rules:
- Club memberships, volunteer work, organizational roles
- Examples: "Member of Arts Society", "Volunteer at Cultural Fest"

EDUCATION Rules:
- gpa: keep exact format from resume (e.g. "7.75 CGPA", "80.6%", "9.1/10")
- degree: full degree name

SPOKEN LANGUAGES Rules:
- If resume is in English, candidate likely knows English — add "English" with proficiency "Fluent"
- If candidate is from India, add "Hindi" with proficiency "Native" unless stated otherwise
- Extract any explicitly mentioned languages too`



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



function regexFallback(text) {
  const emailRx     = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/
  const phoneRx     = /(\+?\d[\d\s\-().]{7,}\d)/
  const linkedinRx  = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-_%]+\/?/i
  const githubRx    = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-_%]+\/?/i
  const portfolioRx = /(?:https?:\/\/)?(?:www\.)?(?!linkedin|github)[\w\-]+\.(?:io|dev|me|co\.in|com)\/[\w\-/_%?#=&.]*/i

  const nameLine = text
    .split("\n")
    .map(l => l.trim())
    .find(l => l.length > 1 && l.length < 60 && !/[@/:|]/.test(l) && !/^\d/.test(l))

  return {
    basic_info: {
      name:      nameLine ?? "",
      email:     text.match(emailRx)?.[0]         ?? "",
      phone:     text.match(phoneRx)?.[0]?.trim() ?? "",
      location:  "",
      linkedin:  text.match(linkedinRx)?.[0]      ?? "",
      github:    text.match(githubRx)?.[0]         ?? "",
      portfolio: text.match(portfolioRx)?.[0]      ?? "",
    },
    summary:          "",
    skills:           { technical: [], soft: [], tools: [], languages: [] },
    experience:       [],
    education:        [],
    projects:         [],
    certifications:   [],
    achievements:     [],
    responsibilities: [],
    spoken_languages: [],
  }
}


function safeParseJSON(raw) {
  
  let cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  
  try {
    return JSON.parse(cleaned)
  } catch (e1) {}

  
  try {
    const s2 = cleaned
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/\t/g, " ")
    return JSON.parse(s2)
  } catch (e2) {}

 
  try {
    const s3 = cleaned
      .replace(/[\u0000-\u001F\u007F]/g, " ")   
      .replace(/([^\\])\\([^"\\/bfnrtu])/g, "$1\\\\$2") 
    return JSON.parse(s3)
  } catch (e3) {}

  
  try {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch (e4) {}

  throw new Error(`JSON parse failed after all attempts`)
}



function applyDefaults(parsed) {
  const basic  = parsed.basic_info ?? {}
  const skills = parsed.skills ?? {}

  return {
    basic_info: {
      name:      basic.name      ?? "",
      email:     basic.email     ?? "",
      phone:     basic.phone     ?? "",
      location:  basic.location  ?? "",
      linkedin:  basic.linkedin  ?? "",
      github:    basic.github    ?? "",
      portfolio: basic.portfolio ?? "",
    },
    summary: parsed.summary ?? "",
    skills: {
      technical: skills.technical ?? [],
      soft:      skills.soft      ?? [],
      tools:     skills.tools     ?? [],
      languages: skills.languages ?? [],
    },
    experience:       Array.isArray(parsed.experience)       ? parsed.experience.map(normalizeExperience)    : [],
    education:        Array.isArray(parsed.education)        ? parsed.education.map(normalizeEducation)      : [],
    projects:         Array.isArray(parsed.projects)         ? parsed.projects.map(normalizeProject)         : [],
    certifications:   Array.isArray(parsed.certifications)   ? parsed.certifications.map(normalizeCert)      : [],
    achievements:     Array.isArray(parsed.achievements)     ? parsed.achievements                           : [],
    responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities                       : [],
    spoken_languages: Array.isArray(parsed.spoken_languages) ? parsed.spoken_languages                      : [],
  }
}

function normalizeExperience(e = {}) {
  return {
    company:    e.company    ?? "",
    title:      e.title      ?? "",
    location:   e.location   ?? "",
    start_date: e.start_date ?? "",
    end_date:   e.end_date   ?? "",
    is_current: e.is_current ?? /present|current|now/i.test(e.end_date ?? ""),
    bullets:    Array.isArray(e.bullets) ? e.bullets : [],
  }
}

function normalizeEducation(e = {}) {
  return {
    institution: e.institution ?? "",
    degree:      e.degree      ?? "",
    field:       e.field       ?? "",
    start_year:  e.start_year  ?? "",
    end_year:    e.end_year    ?? "",
    gpa:         e.gpa         ?? "",
  }
}

function normalizeProject(p = {}) {
  return {
    name:         p.name         ?? "",
    description:  p.description  ?? "",
    technologies: Array.isArray(p.technologies) ? p.technologies : [],
    links:        Array.isArray(p.links)
      ? p.links.filter(l =>
          typeof l === "string" &&
          (l.startsWith("http") || l.includes("github.com") || l.includes("linkedin.com"))
        )
      : [],
    bullets: Array.isArray(p.bullets) ? p.bullets : [],
  }
}

function normalizeCert(c = {}) {
  return {
    name:   c.name   ?? "",
    issuer: c.issuer ?? "",
    year:   c.year   ?? "",
    url:    c.url    ?? "",
  }
}


function buildMeta(result, source) {
  const totalExp = result.experience.reduce((sum, e) => {
    const s  = parseInt(e.start_date?.match(/\d{4}/)?.[0])
    const en = parseInt(e.end_date?.match(/\d{4}/)?.[0] ?? new Date().getFullYear())
    return s && en ? sum + (en - s) : sum
  }, 0)

  return {
    parsed_at:              new Date().toISOString(),
    extraction_source:      source,
    skills_count:           Object.values(result.skills).flat().length,
    experience_count:       result.experience.length,
    projects_count:         result.projects.length,
    education_count:        result.education.length,
    certifications_count:   result.certifications.length,
    total_experience_years: totalExp,
  }
}

// ─────────────────────────────────────────────

export const convertToJson = async (text, options = {}) => {
  const {
    fallbackOnly   = false,
    includeRawText = true,
    maxChars       = 12000,
  } = options

  if (!text || typeof text !== "string" || text.trim().length < 10) {
    throw new Error("convertToJson: text must be a non-empty string of at least 10 characters.")
  }

  const cleaned   = sanitizeText(text)
  const truncated = cleaned.length > maxChars
    ? cleaned.slice(0, maxChars) + "\n...[truncated]"
    : cleaned

  let structured
  let source = "gemini"

  if (!fallbackOnly) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt     = `${SYSTEM_PROMPT}\n\nExtract structured data from this resume:\n\n${truncated}`
      const response   = await model.generateContent(prompt)
      const rawContent = response.response.text()

      structured = applyDefaults(safeParseJSON(rawContent))

    } catch (err) {
      console.warn(`[jsonExtractor] Gemini extraction failed (${err.message}), falling back to regex.`)
      structured = applyDefaults(regexFallback(text))
      source = "regex_fallback"
    }

  } else {
    structured = applyDefaults(regexFallback(text))
    source = "regex_fallback"
  }

  structured._meta = buildMeta(structured, source)

  if (includeRawText) {
    structured.raw_text = text
  }

  return structured
}