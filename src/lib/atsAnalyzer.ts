import type { AtsScore, AtsIssue, ResumeData, JobDescriptionData } from '../types'

// ─── Non-Resume Detection ────────────────────────────────────────────────────

/**
 * Heuristic check: does this text look like a resume?
 * Returns a confidence value 0–1 and a short reason string when confidence is low.
 */
export function isLikelyResume(text: string): { confident: boolean; reason: string } {
  const lower = text.toLowerCase()

  // Positive signals — things commonly found in resumes
  const positiveSignals = [
    /\b(resume|curriculum vitae|cv)\b/i,
    /\b(experience|work history|employment)\b/i,
    /\b(education|university|college|degree|bachelor|master|phd)\b/i,
    /\b(skills|proficiencies|technologies|competencies)\b/i,
    /\b(summary|objective|profile)\b/i,
    /\b(certifications?|licenses?)\b/i,
    /\b(projects?|portfolio)\b/i,
    /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,           // email
    /(\+?1\s?)?([\d\s\-().]{10,})/,           // phone number
    /\b(19|20)\d{2}\b.*\b(present|current)\b/i, // date range
    /\b(managed|developed|designed|led|built|created|improved|achieved)\b/i,
  ]

  // Negative signals — things that suggest this is NOT a resume
  const negativeSignals = [
    /\b(dear\s+\w+|to whom it may concern|sincerely|regards)\b/i,  // letter
    /\b(chapter|section \d+|paragraph|thesis|abstract|bibliography)\b/i, // academic paper
    /\b(invoice|total due|payment|billing|subtotal)\b/i,            // invoice
    /\b(question \d+|answer:|response:|prompt:)\b/i,                // assignment/essay
    /\b(once upon a time|story|narrative|novel|fiction)\b/i,        // creative writing
    /\b(recipe|ingredients|instructions|preheat|tablespoon)\b/i,    // recipe
  ]

  const posCount = positiveSignals.filter(p => p.test(lower)).length
  const negCount = negativeSignals.filter(p => p.test(lower)).length

  // Require at least 3 positive signals and no strong negative signals
  if (negCount >= 2) {
    return { confident: false, reason: 'This document does not appear to be a resume — it may be a letter, essay, or other document.' }
  }
  if (negCount === 1 && posCount < 3) {
    return { confident: false, reason: 'This document may not be a resume. ATS scores will be inaccurate for non-resume content.' }
  }
  if (posCount < 3) {
    return { confident: false, reason: 'Could not find key resume sections (experience, education, skills, contact). ATS scores may not be meaningful.' }
  }

  return { confident: true, reason: '' }
}

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
    // No job description — compute content quality & depth scores from the resume itself
    // so two different resumes produce meaningfully different overall scores.

    // ── Content Quality: quantified achievements + action verb density + length ──
    let contentQuality = 50

    const resumeLines = resumeText.split('\n').filter(l => l.trim().length > 15)
    const quantifiedCount = resumeLines.filter(l =>
      /\b\d+\s*%|\$[\d,]+|\b\d{2,}\s*(users?|customers?|clients?|people|team|members?|engineers?)|improved.*\d|increased.*\d|reduced.*\d|saved.*\d|generated.*\$|grew.*\d/i.test(l)
    ).length
    const quantRatio = resumeLines.length > 0 ? quantifiedCount / Math.min(resumeLines.length, 40) : 0
    contentQuality += Math.round(quantRatio * 30)  // up to +30

    const ACTION_VERBS = [
      'managed', 'led', 'built', 'developed', 'designed', 'implemented',
      'increased', 'improved', 'created', 'launched', 'delivered', 'achieved',
      'spearheaded', 'drove', 'reduced', 'optimized', 'architected', 'established',
      'coordinated', 'streamlined', 'automated', 'deployed', 'scaled', 'mentored',
      'trained', 'negotiated', 'partnered', 'analyzed', 'refactored', 'migrated',
    ]
    const verbCount = ACTION_VERBS.filter(v =>
      new RegExp(`\\b${v}(d|ed|s)?\\b`, 'i').test(resumeText)
    ).length
    if (verbCount >= 10) contentQuality += 15
    else if (verbCount >= 6) contentQuality += 10
    else if (verbCount >= 3) contentQuality += 5
    else if (verbCount === 0) contentQuality -= 15

    const wordCount = resumeText.split(/\s+/).filter(Boolean).length
    if (wordCount < 150) contentQuality -= 25
    else if (wordCount < 300) contentQuality -= 12
    else if (wordCount > 1800) contentQuality -= 8

    keywordMatchScore = Math.max(0, Math.min(100, contentQuality))

    // ── Resume Depth: contact links, extra sections, skills breadth ──
    let depthScore = 45
    if (/linkedin\.com\/in\//i.test(resumeText)) depthScore += 12
    if (/github\.com\//i.test(resumeText)) depthScore += 8
    if (sections.certifications) depthScore += 10
    if (/\bprojects?\b/i.test(resumeText)) depthScore += 8
    if (/\b(volunteer|leadership|awards?|honors?|publications?|patents?)\b/i.test(resumeText)) depthScore += 6
    if (/\b[A-Z][a-z]+(,\s*[A-Z]{2})\b/.test(resumeText)) depthScore += 4  // city, state
    if (resumeData) {
      if (resumeData.skills.length >= 15) depthScore += 11
      else if (resumeData.skills.length >= 8) depthScore += 6
      else if (resumeData.skills.length >= 4) depthScore += 2
      if (resumeData.experience.length >= 4) depthScore += 5
      else if (resumeData.experience.length >= 2) depthScore += 2
    }
    skillsMatchScore = Math.max(0, Math.min(100, depthScore))

    issues.push({
      type: 'info',
      category: 'Keywords',
      message: 'Add a job description to get keyword match scores. Current scores reflect resume content quality and depth.',
    })
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
