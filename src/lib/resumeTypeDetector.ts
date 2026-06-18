import type { ResumeData } from '../types'

// ─── Resume Types ─────────────────────────────────────────────────────────────

export type ResumeType =
  | 'experienced'        // 5+ years, strong job history
  | 'mid-level'          // 2-5 years experience
  | 'entry-level'        // 0-2 years, fresh grad
  | 'student'            // Currently in school, minimal work experience
  | 'academic'           // PhD/Master's focused, research-heavy
  | 'certification-heavy' // Trades/IT with lots of certs
  | 'career-changer'     // Skills don't match job titles (transitioning)

export interface ResumeProfile {
  type: ResumeType
  label: string
  description: string
  icon: string
  sectionOrder: SectionKey[]
  rationale: string
}

export type SectionKey = 'summary' | 'experience' | 'education' | 'skills' | 'certifications'

// ─── Section Order Templates ──────────────────────────────────────────────────

const SECTION_ORDERS: Record<ResumeType, SectionKey[]> = {
  // Strong work history → experience leads
  experienced: ['summary', 'experience', 'skills', 'certifications', 'education'],

  // Moderate experience → experience still leads but education matters
  'mid-level': ['summary', 'experience', 'skills', 'education', 'certifications'],

  // Little experience → skills/education/certs more important than sparse history
  'entry-level': ['summary', 'skills', 'education', 'certifications', 'experience'],

  // Student → education is the main credential
  student: ['summary', 'education', 'skills', 'certifications', 'experience'],

  // Academic → education leads, then research/experience
  academic: ['summary', 'education', 'experience', 'skills', 'certifications'],

  // Certs are the credential → lead with certs, then skills
  'certification-heavy': ['summary', 'certifications', 'skills', 'experience', 'education'],

  // Transitioning → skills prove transferability
  'career-changer': ['summary', 'skills', 'experience', 'certifications', 'education'],
}

const PROFILES: Record<ResumeType, Omit<ResumeProfile, 'sectionOrder'>> = {
  experienced: {
    type: 'experienced',
    label: 'Experienced Professional',
    icon: '💼',
    description: '5+ years of relevant work history',
    rationale: 'Experience leads — your track record is your strongest asset. Recruiters want to see what you\'ve built and delivered.',
  },
  'mid-level': {
    type: 'mid-level',
    label: 'Mid-Level Professional',
    icon: '📈',
    description: '2-5 years of progressive experience',
    rationale: 'Experience leads with education supporting. You have enough history to show growth trajectory.',
  },
  'entry-level': {
    type: 'entry-level',
    label: 'Entry-Level / Recent Graduate',
    icon: '🎓',
    description: 'Early career with limited work history',
    rationale: 'Skills and education lead — without extensive work history, your capabilities and education are your primary selling points.',
  },
  student: {
    type: 'student',
    label: 'Student',
    icon: '📚',
    description: 'Currently enrolled, applying for internships/entry roles',
    rationale: 'Education leads — your current studies and academic achievements are your main qualification.',
  },
  academic: {
    type: 'academic',
    label: 'Academic / Researcher',
    icon: '🔬',
    description: 'Graduate degree focus with research/academic experience',
    rationale: 'Education leads — advanced degrees and academic credentials are the primary credential for academic/research roles.',
  },
  'certification-heavy': {
    type: 'certification-heavy',
    label: 'Certification-Heavy (IT/Trades)',
    icon: '🏆',
    description: 'Professional credentials are the primary qualification',
    rationale: 'Certifications lead — in IT/trades roles, certifications signal capability more directly than job titles or education.',
  },
  'career-changer': {
    type: 'career-changer',
    label: 'Career Changer',
    icon: '🔄',
    description: 'Transitioning to a new field or role type',
    rationale: 'Skills lead — transferable competencies are the bridge between your past and target role.',
  },
}

// ─── Detection Logic ──────────────────────────────────────────────────────────

function estimateTotalYearsExperience(resumeData: ResumeData): number {
  if (resumeData.experience.length === 0) return 0

  let totalMonths = 0
  const now = new Date()

  for (const exp of resumeData.experience) {
    try {
      const start = parseDate(exp.startDate)
      const end = exp.endDate && !/present|current|now/i.test(exp.endDate)
        ? parseDate(exp.endDate)
        : now

      if (start && end) {
        const months = (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth())
        totalMonths += Math.max(0, months)
      }
    } catch { /* ignore unparseable dates */ }
  }

  return totalMonths / 12
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const cleaned = dateStr.trim()

  // "Jan 2022", "January 2022"
  const monthYear = cleaned.match(/^([A-Za-z]+)[.\s]+(\d{4})$/)
  if (monthYear) {
    const d = new Date(`${monthYear[1]} 1 ${monthYear[2]}`)
    if (!isNaN(d.getTime())) return d
  }

  // "2022-01" or "01/2022"
  const numericDate = cleaned.match(/^(\d{1,2})[\/\-](\d{4})$/)
  if (numericDate) return new Date(parseInt(numericDate[2]), parseInt(numericDate[1]) - 1)

  // Just a year "2022"
  const yearOnly = cleaned.match(/^(\d{4})$/)
  if (yearOnly) return new Date(parseInt(yearOnly[1]), 0)

  return null
}

function hasAdvancedDegree(resumeData: ResumeData): boolean {
  const advancedTerms = /\b(phd|ph\.d|doctorate|master|m\.s|m\.a|mba|master of|graduate)/i
  return resumeData.education.some(e =>
    advancedTerms.test(e.degree) || advancedTerms.test(e.institution)
  )
}

function isCurrentlyStudying(resumeData: ResumeData): boolean {
  const currentTerms = /\b(expected|present|current|anticipated|graduating)/i
  return resumeData.education.some(e =>
    currentTerms.test(e.year) || currentTerms.test(e.degree)
  )
}

function isCertificationHeavy(resumeData: ResumeData): boolean {
  const itCertKeywords = /\b(aws|azure|gcp|cisco|CompTIA|cissp|ccna|ccnp|pmp|itil|cka|ckad|terraform|kubernetes|security\+|network\+|A\+|ceh|oscp)\b/i
  const hasManyTechCerts = resumeData.certifications.length >= 2 &&
    resumeData.certifications.some(c => itCertKeywords.test(c))
  const hasManyCertsOverall = resumeData.certifications.length >= 3

  return hasManyTechCerts || hasManyCertsOverall
}

function isCareerChanger(resumeData: ResumeData): boolean {
  // Heuristic: if the resume has experience but many skills that differ from job titles
  if (resumeData.experience.length === 0) return false

  const jobTitles = resumeData.experience.map(e => e.title.toLowerCase()).join(' ')
  const skills = resumeData.skills.map(s => s.toLowerCase()).join(' ')

  // Common career change indicators in summary
  const changeKeywords = /\btransition|career change|pivot|moving into|switching to|new career/i
  if (resumeData.summary && changeKeywords.test(resumeData.summary)) return true

  // Skills are substantially different from job title area (rough heuristic)
  const techSkills = (skills.match(/\b(python|javascript|react|aws|docker|kubernetes|sql|java|typescript|node)\b/g) || []).length
  const techTitles = (jobTitles.match(/\b(developer|engineer|analyst|architect|devops|programmer|software|data|cloud)\b/g) || []).length

  // Has tech skills but no tech job titles → career changer
  return techSkills >= 3 && techTitles === 0
}

// ─── Main Detector ────────────────────────────────────────────────────────────

export function detectResumeType(resumeData: ResumeData): ResumeProfile {
  const yearsExp = estimateTotalYearsExperience(resumeData)
  const hasExp = resumeData.experience.length > 0
  const expCount = resumeData.experience.length
  const certCount = resumeData.certifications.length
  const skillCount = resumeData.skills.length
  const advancedDegree = hasAdvancedDegree(resumeData)
  const studying = isCurrentlyStudying(resumeData)
  const certHeavy = isCertificationHeavy(resumeData)
  const careerChanger = isCareerChanger(resumeData)

  let type: ResumeType

  // Decision tree (order matters — most specific first)
  if (studying && yearsExp < 1) {
    type = 'student'
  } else if (advancedDegree && expCount <= 2 && yearsExp < 4) {
    type = 'academic'
  } else if (certHeavy && (yearsExp < 5 || certCount > expCount)) {
    type = 'certification-heavy'
  } else if (careerChanger) {
    type = 'career-changer'
  } else if (!hasExp || yearsExp < 1) {
    type = studying ? 'student' : 'entry-level'
  } else if (yearsExp < 2 || (expCount === 1 && yearsExp < 3)) {
    type = 'entry-level'
  } else if (yearsExp < 5) {
    type = 'mid-level'
  } else {
    type = 'experienced'
  }

  // Override: if skills are primary and experience is sparse
  if (!hasExp && skillCount >= 5 && certCount === 0) {
    type = 'entry-level'
  }

  const profile = PROFILES[type]
  return {
    ...profile,
    type,
    sectionOrder: SECTION_ORDERS[type],
  }
}

// ─── Get Section Order ────────────────────────────────────────────────────────

export function getSectionOrder(resumeData: ResumeData): SectionKey[] {
  const profile = detectResumeType(resumeData)
  // Filter out sections that have no content
  return profile.sectionOrder.filter(section => {
    switch (section) {
      case 'summary': return !!resumeData.summary
      case 'experience': return resumeData.experience.length > 0
      case 'education': return resumeData.education.length > 0
      case 'skills': return resumeData.skills.length > 0
      case 'certifications': return resumeData.certifications.length > 0
      default: return false
    }
  })
}

// ─── Human-readable section titles ───────────────────────────────────────────

export const SECTION_TITLES: Record<SectionKey, string> = {
  summary: 'PROFESSIONAL SUMMARY',
  experience: 'PROFESSIONAL EXPERIENCE',
  education: 'EDUCATION',
  skills: 'SKILLS',
  certifications: 'CERTIFICATIONS',
}
