import type { ResumeData } from '../types'
import { callAI } from './aiProvider'
import type { AIConfig } from './aiProvider'

/**
 * Ask AI to produce a clean, professionally formatted plain-text version of the resume
 * specifically for export (PDF/DOCX/TXT). Ensures perfect ATS formatting.
 */
export async function callOpenAIForExport(
  config: AIConfig,
  resumeData: ResumeData,
  currentVersion: string,
): Promise<string> {
  const system = `You are a professional resume formatter specializing in ATS-optimized plain-text resumes.
Your task is to take an optimized resume and produce a PERFECTLY formatted plain-text version for export.

ATS FORMATTING REQUIREMENTS:
• Name on first line — ALL CAPS
• Contact info on second line (email | phone | location)
• Section headers in ALL CAPS with a line of dashes below
• Single-column format only
• Dates formatted consistently: "Jan 2020 – Present" or "Jan 2020 – Dec 2022"
• Bullet points with "• " prefix
• No special characters, tables, or boxes
• Consistent spacing between sections

SECTION ORDER:
1. PROFESSIONAL SUMMARY
2. PROFESSIONAL EXPERIENCE
3. EDUCATION
4. SKILLS
5. CERTIFICATIONS (if present)

Return ONLY the formatted resume text. No JSON, no markdown, no explanation.`

  const user = `Format this resume for clean export. Preserve ALL content — every job, company, date, bullet point.
Improve only the formatting and structure, not the content.

=== CURRENT RESUME VERSION ===
${currentVersion.slice(0, 6000)}

=== STRUCTURED DATA FOR REFERENCE ===
Name: ${resumeData.name}
Email: ${resumeData.email} | Phone: ${resumeData.phone}
Experience: ${resumeData.experience.length} positions
Skills: ${resumeData.skills.join(', ')}

Output the complete formatted resume now:`

  return callAI(config, system, user, 0.1)
}
