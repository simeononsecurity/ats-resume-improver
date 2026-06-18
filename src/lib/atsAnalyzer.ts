import type { AtsScore, AtsIssue, ResumeData, JobDescriptionData } from '../types'

// ─── Section Detection ───────────────────────────────────────────────────────

const SECTION_PATTERNS: Record<string, RegExp[]> = {
  contact: [/email|phone|mobile|address|linkedin|github/i],
  summary: [/summary|objective|profile|about|overview/i],
  experience: [/experience|work history|employment|career/i],
  education: [/education|degree|university|college|school/i],
  skills: [/skills|technologies|competencies|proficiencies|tools/i],
  certifications: [/certifications?|licenses?|credentials?/i],
}

export function detectSections(text: string): Record<string, boolean> {
  const detected: Record<string, boolean> = {}
  for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
    detected[section] = patterns.some(p => p.test(text))
  }
  return detected
}

// ─── Contact Info Detection ──────────────────────────────────────────────────

export function detectContactInfo(text: string): {
  hasEmail: boolean
  hasPhone: boolean
  hasName: boolean
} {
  const hasEmail = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(text)
  const hasPhone = /(\+?1\s?)?([\d\s\-().]{10,})/i.test(text)
  // Name is hard to detect deterministically; assume it's there if first line looks like a name
  const firstLine = text.split('\n')[0]?.trim() ?? ''
  const hasName = firstLine.length > 2 && firstLine.length < 60 && !/[<>{}\[\]@]/.test(firstLine)
  return { hasEmail, hasPhone, hasName }
}

// ─── Date Detection ──────────────────────────────────────────────────────────

export function detectDateIssues(text: string): string[] {
  const issues: string[] = []

  // Check for "Present" or year patterns near experience section
  const hasPresent = /present|current|now/i.test(text)
  const hasYears = /\b(19|20)\d{2}\b/.test(text)

  if (!hasYears) {
    issues.push('No employment dates found — ATS systems require date ranges for experience entries.')
  }

  // Check for inconsistent date formats
  const formats = {
    mmyyyy: /\b(0?[1-9]|1[0-2])\/(19|20)\d{2}\b/g,
    monthYear: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (19|20)\d{2}\b/gi,
    yearOnly: /\b(19|20)\d{2}\b/g,
  }

  const foundFormats = Object.entries(formats).filter(([, re]) => re.test(text))
  if (foundFormats.length > 1 && !hasPresent) {
    issues.push('Multiple date formats detected — stick to one format (e.g., "Jan 2022 – Present").')
  }

  return issues
}

// ─── Formatting Issues ───────────────────────────────────────────────────────

export function detectFormattingProblems(text: string): AtsIssue[] {
  const issues: AtsIssue[] = []

  if (/\t.*\t/.test(text)) {
    issues.push({ type: 'error', category: 'Formatting', message: 'Tables or tab-based columns detected. ATS cannot parse these reliably.' })
  }

  if (text.length < 300) {
    issues.push({ type: 'error', category: 'Content', message: 'Resume appears very short. Ensure content was extracted correctly.' })
  }

  const lineCount = text.split('\n').filter(l => l.trim()).length
  if (lineCount < 15) {
    issues.push({ type: 'warning', category: 'Content', message: 'Fewer than 15 lines of content detected. Resume may not parse fully.' })
  }

  return issues
}

// ─── Scoring Engine ──────────────────────────────────────────────────────────

export function scoreResume(
  resumeText: string,
  resumeData: ResumeData | null,
  jobData: JobDescriptionData | null
): AtsScore {
  const issues: AtsIssue[] = []
  const sections = detectSections(resumeText)
  const contact = detectContactInfo(resumeText)
  const dateIssues = detectDateIssues(resumeText)
  const fmtIssues = detectFormattingProblems(resumeText)

  issues.push(...fmtIssues)

  // Completeness check
  let completenessScore = 100
  if (!sections.summary) {
    completenessScore -= 10
    issues.push({ type: 'warning', category: 'Completeness', message: 'No Summary/Objective section detected.' })
  }
  if (!sections.experience) {
    completenessScore -= 20
    issues.push({ type: 'error', category: 'Completeness', message: 'No Experience section detected.' })
  }
  if (!sections.education) {
    completenessScore -= 10
    issues.push({ type: 'warning', category: 'Completeness', message: 'No Education section detected.' })
  }
  if (!sections.skills) {
    completenessScore -= 10
    issues.push({ type: 'warning', category: 'Completeness', message: 'No Skills section detected.' })
  }
  if (!contact.hasEmail) {
    completenessScore -= 15
    issues.push({ type: 'error', category: 'Contact', message: 'No email address found.' })
  }
  if (!contact.hasPhone) {
    completenessScore -= 10
    issues.push({ type: 'warning', category: 'Contact', message: 'No phone number found.' })
  }

  // Date issues
  for (const di of dateIssues) {
    issues.push({ type: 'warning', category: 'Dates', message: di })
  }

  // Readability
  let readabilityScore = 85
  if (fmtIssues.some(i => i.type === 'error')) readabilityScore -= 20
  if (fmtIssues.some(i => i.type === 'warning')) readabilityScore -= 10
  if (dateIssues.length > 0) readabilityScore -= 5
  readabilityScore = Math.max(0, Math.min(100, readabilityScore))

  // Formatting score
  let formattingScore = 100
  if (fmtIssues.some(i => i.type === 'error')) formattingScore -= 30
  if (fmtIssues.some(i => i.type === 'warning')) formattingScore -= 15
  formattingScore = Math.max(0, Math.min(100, formattingScore))

  // Keyword match (needs job data)
  let keywordMatchScore = 0
  let skillsMatchScore = 0

  if (jobData && resumeData) {
    const allJobTerms = [
      ...jobData.requiredSkills,
      ...jobData.technologies,
      ...jobData.certifications,
    ]
    const resumeSkillsLower = resumeData.skills.map(s => s.toLowerCase())
    const resumeTextLower = resumeText.toLowerCase()

    const matched = allJobTerms.filter(term =>
      resumeTextLower.includes(term.toLowerCase())
    )
    keywordMatchScore = allJobTerms.length > 0
      ? Math.round((matched.length / allJobTerms.length) * 100)
      : 50

    const skillsMatched = jobData.requiredSkills.filter(s =>
      resumeSkillsLower.some(rs => rs.includes(s.toLowerCase()))
    )
    skillsMatchScore = jobData.requiredSkills.length > 0
      ? Math.round((skillsMatched.length / jobData.requiredSkills.length) * 100)
      : 50
  } else {
    // No job description provided - give neutral score
    keywordMatchScore = 50
    skillsMatchScore = 50
    issues.push({ type: 'info', category: 'Keywords', message: 'Add a job description to get keyword match analysis.' })
  }

  completenessScore = Math.max(0, Math.min(100, completenessScore))

  // Overall = weighted average
  const overall = Math.round(
    readabilityScore * 0.30 +
    keywordMatchScore * 0.30 +
    skillsMatchScore * 0.20 +
    completenessScore * 0.10 +
    formattingScore * 0.10
  )

  return {
    overall,
    readability: readabilityScore,
    keywordMatch: keywordMatchScore,
    skillsMatch: skillsMatchScore,
    completeness: completenessScore,
    formatting: formattingScore,
    issues,
  }
}
