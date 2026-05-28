import { createRequire } from "module"
const require = createRequire(import.meta.url)
const pdf = require("pdf-parse")
import mammoth from "mammoth"
import fs from "fs"
import path from "path"


const SECTION_HEADERS = {
  experience:     /\b(work\s*experience|professional\s*experience|employment|work\s*history|experience)\b/i,
  education:      /\b(education|academic|qualification|schooling)\b/i,
  skills:         /\b(skills|technical\s*skills|core\s*competencies|technologies|tech\s*stack)\b/i,
  projects:       /\b(projects|personal\s*projects|key\s*projects|academic\s*projects)\b/i,
  certifications: /\b(certifications?|certificates?|courses?|training|licenses?)\b/i,
  achievements:   /\b(achievements?|awards?|honors?|accomplishments?|recognition)\b/i,
  summary:        /\b(summary|objective|profile|about\s*me|about)\b/i,
  languages:      /\b(languages?)\b/i,
}

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "application/octet-stream",
])



export async function fileToText(input) {
  
  if (typeof input === "string") return input.trim()

  const { buffer, mimetype = "", originalname = "" } = input

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new TypeError("fileToText: input.buffer must be a Buffer")
  }

  const ext = path.extname(originalname).toLowerCase()

  
  if (mimetype === "application/pdf" || ext === ".pdf") {
    try {
      const data = await pdf(buffer)
      if (!data.text?.trim()) throw new Error("PDF appears to be scanned/image-based; no extractable text found.")
      return data.text.trim()
    } catch (err) {
      throw new Error(`PDF parsing failed: ${err.message}`)
    }
  }

  
  const isWordMime =
    mimetype.includes("word") ||
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  const isWordExt = [".docx", ".doc"].includes(ext)

  if (isWordMime || isWordExt) {
    try {
      const result = await mammoth.extractRawText({ buffer })
      if (!result.value?.trim()) throw new Error("Word document appears to be empty.")
      return result.value.trim()
    } catch (err) {
      throw new Error(`Word document parsing failed: ${err.message}`)
    }
  }

  
  if (
    mimetype.startsWith("text/") ||
    [".txt", ".md", ".text"].includes(ext)
  ) {
    return buffer.toString("utf-8").trim()
  }

 
  const decoded = buffer.toString("utf-8").trim()
  if (decoded.length > 20) return decoded

  throw new Error(
    `Unsupported file type: mimetype="${mimetype}", extension="${ext}". ` +
    `Supported: PDF, DOCX, DOC, TXT, MD.`
  )
}


function splitIntoSections(text) {
  const lines = text.split("\n")
  const sections = { _header: [] }
  let current = "_header"

  for (const raw of lines) {
    const line = raw.trim()

    // Detect a section header line
    let matched = false
    for (const [name, regex] of Object.entries(SECTION_HEADERS)) {
      // A line is a header if it MATCHES the regex and is short (≤ 60 chars)
      if (regex.test(line) && line.length <= 60) {
        current = name
        sections[current] = sections[current] ?? []
        matched = true
        break
      }
    }

    if (!matched) {
      sections[current] = sections[current] ?? []
      sections[current].push(raw)
    }
  }

  
  return Object.fromEntries(
    Object.entries(sections).map(([k, v]) => [k, v.join("\n").trim()])
  )
}



function extractBasicInfo(text) {
  
  const top = text.split("\n").slice(0, 30).join("\n")

  const emailRx    = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g
  const phoneRx    = /(\+?\d[\d\s\-().]{7,}\d)/g
  const linkedinRx = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-_%]+\/?/gi
  const githubRx   = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-_%]+\/?/gi
  const portfolioRx= /(?:https?:\/\/)?(?:www\.)?(?!linkedin|github)[\w\-]+\.(?:com|io|dev|me|co|net)\/[\w\-/_%?#=&.]*/gi

  const emails    = [...new Set(top.match(emailRx)  ?? [])]
  const phones    = [...new Set((top.match(phoneRx) ?? []).map(p => p.trim()))]
  const linkedins = [...new Set(top.match(linkedinRx) ?? [])]
  const githubs   = [...new Set(top.match(githubRx)   ?? [])]
  const portfolios= [...new Set(top.match(portfolioRx) ?? [])].filter(
    u => !linkedins.includes(u) && !githubs.includes(u)
  )

 
  const nameLine = text
    .split("\n")
    .map(l => l.trim())
    .find(l => l.length > 1 && l.length < 60 && !/[@/:|]/.test(l) && !/^\d/.test(l))

  return {
    name:      nameLine ?? "",
    email:     emails[0]    ?? "",
    emails,
    phone:     phones[0]    ?? "",
    phones,
    linkedin:  linkedins[0] ?? "",
    github:    githubs[0]   ?? "",
    portfolio: portfolios[0] ?? "",
    social_links: { linkedin: linkedins, github: githubs, portfolio: portfolios },
  }
}




const TECH_KEYWORDS = new Set([
  "javascript","typescript","python","java","c++","c#","go","rust","ruby","swift",
  "kotlin","php","scala","r","matlab","dart","html","css","sql","bash","shell",
  "react","vue","angular","next.js","nuxt","svelte","node","express","fastapi",
  "django","flask","spring","laravel","rails","graphql","rest","grpc","websocket",
  "postgresql","mysql","mongodb","redis","sqlite","firebase","dynamodb","elasticsearch",
  "docker","kubernetes","aws","azure","gcp","terraform","ansible","ci/cd","git",
  "linux","nginx","apache","kafka","rabbitmq","pandas","numpy","scikit-learn",
  "tensorflow","pytorch","opencv","langchain","openai","llm","machine learning",
  "deep learning","nlp","data science","blockchain","web3","solidity","figma",
])

function extractSkills(sections, fullText) {
  const raw = sections.skills ?? ""
  const collected = new Set()
  const lowerFullText = fullText.toLowerCase()

  if (raw) {
    raw
      .split(/[\n,;|•\-\/]/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 50)
      .forEach(s => collected.add(s))
  }

 
  for (const kw of TECH_KEYWORDS) {
    if (lowerFullText.includes(kw)) {
      collected.add(kw.charAt(0).toUpperCase() + kw.slice(1))
    }
  }

  return [...collected].filter(Boolean)
}



const DEGREE_RX = /\b(b\.?tech|b\.?e\.?|b\.?sc?\.?|m\.?tech|m\.?sc?\.?|m\.?e\.?|mba|ph\.?d|bachelor|master|diploma|associate|b\.?a\.?|m\.?a\.?)\b/i
const YEAR_RX   = /\b(19|20)\d{2}\b/g
const GPA_RX    = /(?:gpa|cgpa|score)[^\d]*(\d+\.?\d*)/i

function extractEducation(sections) {
  const raw = sections.education ?? ""
  if (!raw) return []

  const blocks = raw.split(/\n{2,}/).filter(Boolean)
  if (blocks.length === 0) return raw.split("\n").filter(Boolean).map(l => ({ institution: l.trim() }))

  return blocks.map(block => {
    const lines = block.split("\n").filter(l => l.trim())
    const years = block.match(YEAR_RX) ?? []
    const degreeMatch = block.match(DEGREE_RX)
    const gpaMatch = block.match(GPA_RX)

    return {
      institution: lines[0]?.trim() ?? "",
      degree:      degreeMatch ? degreeMatch[0] : (lines[1]?.trim() ?? ""),
      field:       lines[2]?.trim() ?? "",
      start_year:  years[0] ?? "",
      end_year:    years[1] ?? years[0] ?? "",
      gpa:         gpaMatch ? gpaMatch[1] : "",
    }
  }).filter(e => e.institution)
}



const DATE_RANGE_RX = /((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{0,4}|\d{4})\s*[-–—to]+\s*((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{0,4}|\d{4}|present|current|now)/i

function extractExperience(sections) {
  const raw = sections.experience ?? ""
  if (!raw) return []

  const blocks = raw.split(/\n{2,}/).filter(Boolean)

  return blocks.map(block => {
    const lines  = block.split("\n").filter(l => l.trim())
    const dateMatch = block.match(DATE_RANGE_RX)
    const bullets = lines
      .filter(l => /^[\-•*▸►]/.test(l.trim()))
      .map(l => l.replace(/^[\-•*▸►]\s*/, "").trim())

    return {
      company:    lines[0]?.trim() ?? "",
      title:      lines[1]?.trim() ?? "",
      start_date: dateMatch?.[1] ?? "",
      end_date:   dateMatch?.[3] ?? "",
      location:   "",
      bullets,
      raw:        block.trim(),
    }
  }).filter(e => e.company)
}



const URL_RX = /https?:\/\/[^\s)>]+/g

function extractProjects(sections) {
  const raw = sections.projects ?? ""
  if (!raw) return []

  const blocks = raw.split(/\n{2,}/).filter(Boolean)

  return blocks.map(block => {
    const lines   = block.split("\n").filter(l => l.trim())
    const bullets = lines
      .filter(l => /^[\-•*▸►]/.test(l.trim()))
      .map(l => l.replace(/^[\-•*▸►]\s*/, "").trim())
    const urls    = [...new Set(block.match(URL_RX) ?? [])]
    const techLine= lines.find(l => /tech(nolog|stack|nique)?s?\s*:/i.test(l)) ?? ""
    const techs   = techLine
      ? techLine.replace(/tech.*?:/i, "").split(/,|;/).map(t => t.trim()).filter(Boolean)
      : []

    return {
      name:        lines[0]?.trim() ?? "",
      description: bullets.join(" ") || lines.slice(1).join(" ").trim(),
      bullets,
      technologies: techs,
      links:       urls,
    }
  }).filter(p => p.name)
}



function extractCertifications(sections) {
  const raw = sections.certifications ?? ""
  if (!raw) return []

  return raw
    .split("\n")
    .filter(Boolean)
    .map(l => l.replace(/^[\-•*▸►]\s*/, "").trim())
    .filter(l => l.length > 3)
    .map(line => {
      const years = line.match(YEAR_RX) ?? []
      return {
        name: line.replace(YEAR_RX, "").replace(/[,|–\-]+$/, "").trim(),
        year: years[0] ?? "",
      }
    })
}



function extractAchievements(sections) {
  const raw = sections.achievements ?? ""
  if (!raw) return []

  return raw
    .split("\n")
    .filter(Boolean)
    .map(l => l.replace(/^[\-•*▸►]\s*/, "").trim())
    .filter(l => l.length > 3)
}



function extractSummary(sections) {
  return (sections.summary ?? "").replace(/\s+/g, " ").trim()
}


function titleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function computeMetadata(parsed) {
  return {
    has_photo:          false, // cannot detect from plain text
    total_experience_years: estimateYearsOfExperience(parsed.experience),
    skills_count:       parsed.skills.length,
    projects_count:     parsed.projects.length,
    education_count:    parsed.education.length,
    parsed_at:          new Date().toISOString(),
  }
}

function estimateYearsOfExperience(experiences) {
  let total = 0
  for (const exp of experiences) {
    const start = parseInt(exp.start_date?.match(/\d{4}/)?.[0])
    const end   = parseInt(
      exp.end_date?.match(/\d{4}/)?.[0] ?? new Date().getFullYear()
    )
    if (start && end && end >= start) total += end - start
  }
  return total
}



/**
 * parseResume(input)
 *
 * @param {Object|string} input
 *   - { buffer: Buffer, mimetype: string, originalname: string }  — multer file object
 *   - string  — raw resume text
 *
 * @returns {Promise<ResumeParseResult>}
 */
export async function parseResume(input) {
 
  const rawText = await fileToText(input)

  if (!rawText || rawText.length < 20) {
    throw new Error("Resume text is too short or empty. Please provide a valid resume file.")
  }

  
  const sections = splitIntoSections(rawText)

 
  const basicInfo      = extractBasicInfo(rawText)
  const skills         = extractSkills(sections, rawText)
  const education      = extractEducation(sections)
  const experience     = extractExperience(sections)
  const projects       = extractProjects(sections)
  const certifications = extractCertifications(sections)
  const achievements   = extractAchievements(sections)
  const summary        = extractSummary(sections)

  const result = {
    raw_text:        rawText,
    summary,
    basic_info:      basicInfo,
    education,
    experience,
    skills,
    projects,
    certifications,
    achievements,
    languages:       extractListSection(sections.languages),
  }

  result._meta = computeMetadata(result)

  return result
}



function extractListSection(raw = "") {
  return raw
    .split(/[\n,;|•\-]/)
    .map(s => s.trim())
    .filter(s => s.length > 1 && s.length < 40)
}


export async function parseResumeFromPath(filePath) {
  const buffer       = fs.readFileSync(filePath)
  const ext          = path.extname(filePath).toLowerCase()
  const mimeMap      = {
    ".pdf":  "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc":  "application/msword",
    ".txt":  "text/plain",
    ".md":   "text/markdown",
  }
  const mimetype     = mimeMap[ext] ?? "application/octet-stream"
  const originalname = path.basename(filePath)

  return parseResume({ buffer, mimetype, originalname })
}