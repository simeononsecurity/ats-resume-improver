import type { AIConfig } from '../lib/aiProvider'

export interface ResumeData {
  name: string
  email: string
  phone: string
  location: string
  summary: string
  experience: ExperienceItem[]
  education: EducationItem[]
  skills: string[]
  certifications: string[]
  rawText: string
}

export interface ExperienceItem {
  title: string
  company: string
  startDate: string
  endDate: string
  bullets: string[]
}

export interface EducationItem {
  degree: string
  institution: string
  year: string
  gpa?: string
}

export interface JobDescriptionData {
  title: string
  company: string
  requiredSkills: string[]
  preferredSkills: string[]
  technologies: string[]
  certifications: string[]
  responsibilities: string[]
  rawText: string
}

export interface KeywordAnalysis {
  matching: string[]
  missing: string[]
  related: string[]
  coveragePercent: number
}

export interface AtsIssue {
  type: 'error' | 'warning' | 'info'
  category: string
  message: string
}

export interface AtsScore {
  overall: number
  readability: number
  keywordMatch: number
  skillsMatch: number
  completeness: number
  formatting: number
  issues: AtsIssue[]
}

export interface OptimizationChange {
  original: string
  updated: string
  reason: string
  section: string
}

export interface OptimizedResume {
  atsVersion: string
  tailoredVersion: string
  changes: OptimizationChange[]
  structuredData: ResumeData
}

export interface AppState {
  step: AppStep
  aiConfig: AIConfig
  resumeRawText: string
  resumeData: ResumeData | null
  jobDescription: string
  jobData: JobDescriptionData | null
  keywordAnalysis: KeywordAnalysis | null
  atsScore: AtsScore | null
  optimizedResume: OptimizedResume | null
  coverLetter: string
  isLoading: boolean
  loadingMessage: string
  error: string | null
}

export type AppStep =
  | 'upload'
  | 'ats-view'
  | 'job-description'
  | 'analysis'
  | 'optimize'
  | 'diff'
  | 'export'

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'md'
