
export function jsonToText(resume) {

  const lines = []

  const b = resume.basic_info ?? {}
  if (b.name)      lines.push(`Name: ${b.name}`)
  if (b.email)     lines.push(`Email: ${b.email}`)
  if (b.phone)     lines.push(`Phone: ${b.phone}`)
  if (b.location)  lines.push(`Location: ${b.location}`)
  if (b.linkedin)  lines.push(`LinkedIn: ${b.linkedin}`)
  if (b.github)    lines.push(`GitHub: ${b.github}`)
  if (b.portfolio) lines.push(`Portfolio: ${b.portfolio}`)

  lines.push("")

  
  if (resume.summary) {
    lines.push(`Summary: ${resume.summary}`)
    lines.push("")
  }

  
  const s = resume.skills ?? {}
  if (s.technical?.length)  lines.push(`Technical Skills: ${s.technical.join(", ")}`)
  if (s.tools?.length)      lines.push(`Tools: ${s.tools.join(", ")}`)
  if (s.languages?.length)  lines.push(`Languages: ${s.languages.join(", ")}`)
  if (s.soft?.length)       lines.push(`Soft Skills: ${s.soft.join(", ")}`)

  lines.push("")

  
  if (resume.experience?.length) {
    lines.push("Experience:")
    for (const e of resume.experience) {
      const period = e.is_current
        ? `${e.start_date} - Present`
        : `${e.start_date} - ${e.end_date}`
      lines.push(`  ${e.company} | ${e.title} | ${period}`)
      if (e.location) lines.push(`  Location: ${e.location}`)
      for (const bullet of e.bullets ?? []) {
        lines.push(`  - ${bullet}`)
      }
    }
    lines.push("")
  }

  
  if (resume.education?.length) {
    lines.push("Education:")
    for (const e of resume.education) {
      const degree = [e.degree, e.field].filter(Boolean).join(" in ")
      const years  = [e.start_year, e.end_year].filter(Boolean).join(" - ")
      lines.push(`  ${e.institution} | ${degree} | ${years} | ${e.gpa}`)
    }
    lines.push("")
  }

  if (resume.projects?.length) {
    lines.push("Projects:")
    for (const p of resume.projects) {
      lines.push(`  ${p.name}`)
      if (p.description)          lines.push(`  Description: ${p.description}`)
      if (p.technologies?.length) lines.push(`  Tech Stack: ${p.technologies.join(", ")}`)
      for (const bullet of p.bullets ?? []) {
        lines.push(`  - ${bullet}`)
      }
      if (p.links?.length) lines.push(`  Links: ${p.links.join(", ")}`)
    }
    lines.push("")
  }

  
  if (resume.certifications?.length) {
    lines.push("Certifications:")
    for (const c of resume.certifications) {
      const yr = c.year ? ` (${c.year})` : ""
      lines.push(`  ${c.name} by ${c.issuer}${yr}`)
    }
    lines.push("")
  }

  
  if (resume.achievements?.length) {
    lines.push("Achievements:")
    for (const a of resume.achievements) {
      lines.push(`  - ${a}`)
    }
    lines.push("")
  }

 
  if (resume.responsibilities?.length) {
    lines.push("Responsibilities:")
    for (const r of resume.responsibilities) {
      lines.push(`  - ${r}`)
    }
    lines.push("")
  }

  
  if (resume.spoken_languages?.length) {
    const langs = resume.spoken_languages
      .map(l => `${l.language} (${l.proficiency})`)
      .join(", ")
    lines.push(`Spoken Languages: ${langs}`)
    lines.push("")
  }

  return lines.join("\n").trim()
}