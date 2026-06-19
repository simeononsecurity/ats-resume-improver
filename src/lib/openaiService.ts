import type { ResumeData, JobDescriptionData, OptimizedResume, OptimizationChange, InterviewPrediction, SalaryEstimate } from '../types'
import { getSectionOrder, SECTION_TITLES } from './resumeTypeDetector'
import { callAI } from './aiProvider'
import type { AIConfig } from './aiProvider'

// Re-export for any legacy imports
export { MODELS_BY_PROVIDER as AVAILABLE_MODELS } from './aiProvider'
export const DEFAULT_MODEL = 'gpt-4.1-mini'

// ─── Shared ATS Best-Practices Context ────────────────────────────────────────

const ATS_EXPERTISE = `
You are an expert ATS resume strategist trained on best practices from Harvard OCS, Columbia CCE, and 
industry consensus. Apply these rules in every response:

HONESTY AND ACCURACY RULES (absolute — override everything else):
• NEVER invent, fabricate, or assume any certification, degree, job title, company, date, or credential
• NEVER add skills, tools, technologies, or experiences the candidate has not already stated in their source resume
• NEVER inflate tenure, change employment dates, or create experience entries that do not exist
• NEVER add a keyword from the job description unless the candidate's existing resume already demonstrates that skill
• Your ONLY job is to REWRITE and REFRAME what is already present: stronger verbs, clearer structure, better phrasing
• Rewriting a bullet is allowed. Inventing the content of that bullet is not.
• If a required keyword cannot be supported by the candidate's actual experience, leave it out entirely
• Adding false credentials causes direct, real-world harm: it fails background checks, kills job offers, and ends careers

ATS FORMATTING RULES (non-negotiable):
• Single-column layout only — no tables, columns, text boxes, headers, footers, or graphics
• Section headings in ALL CAPS: PROFESSIONAL SUMMARY, PROFESSIONAL EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS
• Standard fonts (Arial, Calibri, Georgia) — no special characters, icons, or emoji
• Dates must be spelled out (e.g., "Jan 2022") and placed consistently (right side or after company)
• Name on the first line ONLY — no credentials (MBA, CPA) in the name field
• Full spelled-out terms plus abbreviations: "Certified Public Accountant (CPA)"

KEYWORD INTEGRATION RULES:
• Use exact phrases from the job description — do NOT paraphrase (ATS matches exact strings)
• Integrate keywords CONTEXTUALLY into bullet points, not just listed in skills
• Place keywords in multiple sections: summary, experience bullets, and skills
• Prioritize the job title match: your most recent title should align with or match the target role

BULLET POINT RULES (CAR Method — Context → Action → Result):
• Format: [Strong Action Verb] + [What/How with specific technology/keyword] + [Quantifiable Result]
• Example: "Administered 200+ Windows and Linux servers (Terraform, Ansible), reducing incident response time by 35%"
• NEVER start with weak phrases: "Responsible for", "Helped with", "Worked on", "Assisted with"
• Every bullet should have a number, percentage, dollar amount, or scale metric where possible
• Use past tense for previous roles, present tense ONLY for current role

STRONG ACTION VERBS (use these, not weak alternatives):
Leadership: Spearheaded, Orchestrated, Directed, Supervised, Championed, Established
Technical: Engineered, Architected, Developed, Deployed, Implemented, Optimized, Automated
Results: Reduced, Increased, Accelerated, Generated, Delivered, Achieved, Surpassed
Analysis: Analyzed, Evaluated, Diagnosed, Identified, Forecasted, Streamlined

SUMMARY SECTION RULES:
• 2-4 sentences maximum
• Must include: years of experience, target job title, top 3-4 keywords from job description
• Example: "Senior DevOps Engineer with 8+ years designing and automating cloud infrastructure on AWS and Azure. 
  Proven track record implementing CI/CD pipelines with Jenkins and GitHub Actions, reducing deployment cycles by 40%."
• Rewrite summary to DIRECTLY address the specific role being targeted
`

// ─── Parse Resume Locally (No AI) ────────────────────────────────────────────

export function parseResumeLocal(rawText: string): ResumeData {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)
  const name = lines[0] ?? ''
  const email = rawText.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)?.[0] ?? ''
  const phone = rawText.match(/(\+?1\s?)?(\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4})/)?.[0] ?? ''

  let summary = ''
  const summaryIdx = lines.findIndex((l) => /^(summary|objective|profile|about|overview)/i.test(l))
  if (summaryIdx >= 0 && summaryIdx + 1 < lines.length) summary = lines[summaryIdx + 1]

  const skills: string[] = []
  const skillsIdx = lines.findIndex((l) => /^skills/i.test(l))
  if (skillsIdx >= 0 && skillsIdx + 1 < lines.length) {
    skills.push(...lines[skillsIdx + 1].split(/[,•·|]/).map((s) => s.trim()).filter(Boolean))
  }

  const certifications: string[] = []
  const certIdx = lines.findIndex((l) => /^certifications?/i.test(l))
  if (certIdx >= 0) {
    for (let i = certIdx + 1; i < Math.min(certIdx + 6, lines.length); i++) {
      if (/^(education|experience|skills)/i.test(lines[i])) break
      if (lines[i].length > 5) certifications.push(lines[i].replace(/^[•\-]\s*/, ''))
    }
  }

  const experience: ResumeData['experience'] = []
  let inExperience = false
  let currentExp: ResumeData['experience'][0] | null = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^(professional experience|work history|employment|experience)/i.test(line)) { inExperience = true; continue }
    if (/^(education|skills|certifications?|projects?)/i.test(line)) {
      inExperience = false
      if (currentExp) { experience.push(currentExp); currentExp = null }
      continue
    }
    if (inExperience) {
      if (line.includes('|')) {
        if (currentExp) experience.push(currentExp)
        const parts = line.split('|').map((p) => p.trim())
        currentExp = { title: parts[0] ?? '', company: parts[1] ?? '', startDate: parts[2]?.split('-')[0]?.trim() ?? '', endDate: parts[2]?.split('-')[1]?.trim() ?? 'Present', bullets: [] }
      } else if (currentExp && (line.startsWith('-') || line.startsWith('•'))) {
        currentExp.bullets.push(line.replace(/^[-•]\s*/, ''))
      }
    }
  }
  if (currentExp) experience.push(currentExp)

  const education: ResumeData['education'] = []
  const eduIdx = lines.findIndex((l) => /^education/i.test(l))
  if (eduIdx >= 0) {
    for (let i = eduIdx + 1; i < Math.min(eduIdx + 8, lines.length); i++) {
      if (/^(experience|skills|certifications?|projects?)/i.test(lines[i])) break
      if (lines[i].includes('|')) {
        const parts = lines[i].split('|').map((p) => p.trim())
        education.push({ degree: parts[0] ?? '', institution: parts[1] ?? '', year: parts[2] ?? '' })
      }
    }
  }

  return { name, email, phone, location: '', summary, experience, education, skills, certifications, rawText }
}

// ─── Stage 1: Parse Resume with AI ───────────────────────────────────────────

export async function parseResumeWithAI(
  config: AIConfig,
  resumeText: string,
): Promise<ResumeData> {
  const system = `You are an expert resume parser and ATS specialist.
${ATS_EXPERTISE}
TASK: Extract structured data from this resume with perfect accuracy.
Return ONLY valid JSON — no markdown, no code fences, no explanation.
Do NOT fabricate data. If a field is missing, use "" or [].
Preserve ALL original text exactly — do not improve or change anything at this stage.`

  const user = `Parse this resume into JSON. Extract EVERY piece of information present.

RESUME TEXT:
${resumeText.slice(0, 8000)}

Return this exact JSON structure:
{
  "name": "", "email": "", "phone": "", "location": "", "summary": "",
  "experience": [{ "title": "", "company": "", "startDate": "", "endDate": "", "bullets": [] }],
  "education": [{ "degree": "", "institution": "", "year": "", "gpa": "" }],
  "skills": [], "certifications": [], "rawText": ""
}`

  const raw = await callAI(config, system, user, 0.1)
  try {
    return { ...JSON.parse(raw), rawText: resumeText }
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { return { ...JSON.parse(match[0]), rawText: resumeText } } catch { /* fall through */ }
    }
    throw new Error('Failed to parse resume structure from AI response.')
  }
}

// ─── Stage 2: Parse Job Description with AI ──────────────────────────────────

export async function parseJobDescriptionWithAI(
  config: AIConfig,
  jobText: string,
  resumeRawText?: string,
): Promise<JobDescriptionData> {
  const system = `You are an expert recruiter and ATS keyword strategist.
${ATS_EXPERTISE}
TASK: Extract and prioritize all requirements from this job description.
Return ONLY valid JSON — no markdown, no code fences.`

  const resumeContext = resumeRawText
    ? `\n=== CANDIDATE'S CURRENT RESUME (for context — extract what's MISSING) ===\n${resumeRawText.slice(0, 3000)}`
    : ''

  const user = `Extract all requirements from this job description.${resumeContext}

JOB DESCRIPTION:
${jobText.slice(0, 5000)}

Return this exact JSON:
{
  "title": "exact job title", "company": "company name if stated",
  "requiredSkills": [], "preferredSkills": [], "technologies": [],
  "certifications": [], "responsibilities": [], "rawText": ""
}`

  const raw = await callAI(config, system, user, 0.1)
  try {
    return { ...JSON.parse(raw), rawText: jobText }
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { return { ...JSON.parse(match[0]), rawText: jobText } } catch { /* fall through */ }
    }
    throw new Error('Failed to parse job description from AI response.')
  }
}

// ─── Stage 3: Optimize Resume with AI ────────────────────────────────────────

export async function optimizeResumeWithAI(
  config: AIConfig,
  resumeData: ResumeData,
  jobData: JobDescriptionData | null,
  missingKeywords: string[],
): Promise<OptimizedResume> {
  const { detectResumeType, getSectionOrder } = await import('./resumeTypeDetector')
  const profile = detectResumeType(resumeData)
  const sectionOrder = getSectionOrder(resumeData)

  const system = `You are a master resume writer and ATS optimization expert.
${ATS_EXPERTISE}

CANDIDATE PROFILE DETECTED: ${profile.icon} ${profile.label}
${profile.description}
${profile.rationale}

RECOMMENDED SECTION ORDER: ${sectionOrder.join(' → ')}
FOLLOW THIS ORDER in both atsVersion and tailoredVersion.

YOUR MISSION: Transform this resume into the highest-probability version to pass ATS AND impress human recruiters.

OPTIMIZATION PRIORITIES:
1. Reorder sections: ${sectionOrder.join(' → ')}
2. Rewrite PROFESSIONAL SUMMARY to target the specific role (job title + top 3 keywords + years experience)
3. Improve bullets using CAR method: [Strong Action Verb] + [Context/Keyword] + [Quantifiable Result]
4. Integrate missing keywords NATURALLY (only if the experience supports it)
5. Strengthen weak action verbs: Managed→Directed, Made→Developed, Helped→Spearheaded
6. Add metrics to vague bullets where the original implies scale
7. Ensure ATS formatting: ALL CAPS section headers, no tables, single column

CONSTRAINTS (non-negotiable — these override all optimization goals):
• PRESERVE every job title, company name, date, degree, and certification exactly as written
• NEVER add a certification, degree, or credential the candidate did not list
• NEVER invent a job, project, or skill the candidate did not mention
• NEVER add a keyword from the job description to the candidate's skills unless it already appears in their resume
• You may rephrase a bullet point but you may NOT change what actually happened
• You may quantify an implied scale (e.g. "large team" → "team of ~20") but must not fabricate specific numbers
• If a keyword gap cannot be filled honestly, leave it unfilled — gaps are better than lies
• Output must be COMPLETE — every section with ALL original content
• Return ONLY valid JSON — no markdown fences, no comments`

  const jobContext = jobData
    ? `TARGET ROLE: ${jobData.title}${jobData.company ? ` at ${jobData.company}` : ''}
REQUIRED SKILLS: ${jobData.requiredSkills.join(', ')}
PREFERRED SKILLS: ${jobData.preferredSkills.join(', ')}
KEY TECHNOLOGIES: ${jobData.technologies.join(', ')}
CERTIFICATIONS: ${jobData.certifications.join(', ')}
RESPONSIBILITIES: ${jobData.responsibilities.slice(0, 5).join(' | ')}
MISSING KEYWORDS: ${missingKeywords.slice(0, 15).join(', ')}`
    : 'No specific job description — optimize for general ATS compatibility.'

  const user = `Optimize this resume.

${jobContext}

=== FULL ORIGINAL RESUME TEXT ===
${(resumeData.rawText || '').slice(0, 7000)}

=== STRUCTURED DATA ===
Name: ${resumeData.name} | Email: ${resumeData.email} | Phone: ${resumeData.phone}
Skills: ${resumeData.skills.join(', ')}
${resumeData.experience.length} experience entries | ${resumeData.education.length} education entries

RETURN this exact JSON (no markdown). structuredData MUST include ALL experience entries with ALL bullets rewritten:
{
  "changes": [{"section":"","original":"","updated":"","reason":""}],
  "structuredData": {
    "name":"","email":"","phone":"","location":"","summary":"",
    "experience":[{"title":"","company":"","startDate":"","endDate":"","bullets":[]}],
    "education":[{"degree":"","institution":"","year":"","gpa":""}],
    "skills":[],"certifications":[],"rawText":""
  }
}`

  const raw = await callAI(config, system, user, 0.3)
  try {
    const parsed = JSON.parse(raw)
    const sd: ResumeData = { ...resumeData, ...parsed.structuredData, rawText: resumeData.rawText }
    // Always rebuild atsVersion/tailoredVersion deterministically from structuredData
    // so the output is always complete regardless of AI response length
    const atsVersion = buildAtsVersion([], sd)
    const missingKwAppendix = missingKeywords.length > 0
      ? `\n\nSUGGESTED KEYWORDS TO INTEGRATE\n${'─'.repeat(50)}\n` +
        `Review these keywords from the job description. If you have genuine experience with any,\n` +
        `naturally incorporate them into your existing bullet points using this format:\n` +
        `"[Action Verb] [keyword/tool] to [what you did], resulting in [measurable outcome]"\n\n` +
        `Keywords: ${missingKeywords.slice(0, 20).join(', ')}`
      : ''
    return {
      atsVersion,
      tailoredVersion: atsVersion + missingKwAppendix,
      changes: parsed.changes || [],
      structuredData: sd,
    } as OptimizedResume
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        const sd: ResumeData = { ...resumeData, ...parsed.structuredData, rawText: resumeData.rawText }
        const atsVersion = buildAtsVersion([], sd)
        return {
          atsVersion,
          tailoredVersion: atsVersion,
          changes: parsed.changes || [],
          structuredData: sd,
        } as OptimizedResume
      } catch { /* fall through */ }
    }
    throw new Error('AI returned unexpected optimization format.')
  }
}

// ─── Stage 4: Deterministic ATS Optimization (No API Key) ────────────────────

export function optimizeResumeLocal(resumeData: ResumeData, missingKeywords: string[]): OptimizedResume {
  const changes: OptimizationChange[] = []
  const rawLines = (resumeData.rawText || '').split('\n')
  const improvedLines = rawLines.map((line) => {
    const trimmed = line.trim()
    if (!trimmed) return line
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const bulletContent = trimmed.replace(/^[-•]\s*/, '')
      const improved = improveBullet(bulletContent, changes)
      const indent = line.match(/^(\s*)/)?.[1] ?? ''
      return `${indent}• ${improved}`
    }
    return line
  })

  const atsVersion = buildAtsVersion(improvedLines, resumeData)
  let tailoredVersion = atsVersion
  if (missingKeywords.length > 0) {
    tailoredVersion += `\n\nSUGGESTED KEYWORDS TO INTEGRATE\n${'─'.repeat(50)}\n` +
      `Review these keywords from the job description. If you have genuine experience with any,\n` +
      `naturally incorporate them into your existing bullet points using this format:\n` +
      `"[Action Verb] [keyword/tool] to [what you did], resulting in [measurable outcome]"\n\n` +
      `Keywords: ${missingKeywords.slice(0, 20).join(', ')}`
  }
  return { atsVersion, tailoredVersion, changes, structuredData: resumeData }
}

function buildAtsVersion(_improvedLines: string[], resumeData: ResumeData): string {
  if (resumeData.experience.length > 0 || resumeData.skills.length > 0 || resumeData.education.length > 0) {
    const order = getSectionOrder(resumeData)
    const DIV = '─'.repeat(50)
    const lines: string[] = []
    if (resumeData.name) lines.push(resumeData.name.toUpperCase())
    const contact = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean)
    if (contact.length) lines.push(contact.join(' | '))
    lines.push('')
    for (const section of order) {
      switch (section) {
        case 'summary':
          if (resumeData.summary) { lines.push(SECTION_TITLES.summary, DIV, resumeData.summary, '') }
          break
        case 'experience':
          if (resumeData.experience.length > 0) {
            lines.push(SECTION_TITLES.experience, DIV)
            for (const exp of resumeData.experience) {
              lines.push('', `${exp.title} | ${exp.company}`, `${exp.startDate}${exp.endDate ? ' – ' + exp.endDate : ' – Present'}`)
              for (const bullet of exp.bullets) lines.push(`• ${improveBullet(bullet, [])}`)
            }
            lines.push('')
          }
          break
        case 'education':
          if (resumeData.education.length > 0) {
            lines.push(SECTION_TITLES.education, DIV)
            for (const edu of resumeData.education) {
              lines.push(`${edu.degree} | ${edu.institution}${edu.year ? ' | ' + edu.year : ''}${edu.gpa ? ' | GPA: ' + edu.gpa : ''}`)
            }
            lines.push('')
          }
          break
        case 'skills':
          if (resumeData.skills.length > 0) { lines.push(SECTION_TITLES.skills, DIV, resumeData.skills.join(' • '), '') }
          break
        case 'certifications':
          if (resumeData.certifications.length > 0) {
            lines.push(SECTION_TITLES.certifications, DIV)
            for (const cert of resumeData.certifications) lines.push(`• ${cert}`)
            lines.push('')
          }
          break
      }
    }
    return lines.join('\n')
  }
  return _improvedLines.join('\n')
}

function improveBullet(bullet: string, changes: OptimizationChange[]): string {
  let improved = bullet.trim()
  if (!improved) return improved
  improved = improved.charAt(0).toUpperCase() + improved.slice(1)
  if (improved.endsWith('.')) improved = improved.slice(0, -1)

  const replacements: [RegExp, string][] = [
    [/^(was responsible for|responsible for)/i, 'Spearheaded'],
    [/^(helped with|assisted with|helped to|assisted)/i, 'Supported'],
    [/^(worked on|worked with)/i, 'Collaborated on'],
    [/^(was in charge of|in charge of)/i, 'Directed'],
    [/^(did the|did)/i, 'Executed'],
    [/^(was part of|participated in)/i, 'Contributed to'],
    [/^(managed servers?|managed the server)/i, 'Administered'],
    [/^(managed)/i, 'Directed'],
    [/^(made changes to|made improvements to)/i, 'Optimized'],
    [/^(made)/i, 'Developed'],
    [/^(created)/i, 'Engineered'],
    [/^(built)/i, 'Architected'],
    [/^(fixed)/i, 'Resolved'],
    [/^(handled)/i, 'Managed'],
    [/^(used|utilized|leveraged)/i, 'Implemented'],
    [/^(helped)/i, 'Facilitated'],
    [/^(worked)/i, 'Executed'],
    [/^(did)/i, 'Performed'],
    [/^(wrote)/i, 'Authored'],
    [/^(ran)/i, 'Operated'],
    [/^(set up|setup)/i, 'Deployed'],
    [/^(took care of)/i, 'Maintained'],
    [/^(looked at|reviewed)/i, 'Analyzed'],
  ]

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(improved)) {
      const original = improved
      improved = improved.replace(pattern, replacement)
      if (improved !== original && changes) {
        changes.push({
          section: 'Experience', original, updated: improved,
          reason: `Replaced weak opening with strong action verb "${replacement}" for better ATS impact.`,
        })
      }
      break
    }
  }
  return improved
}

// ─── Stage 5: Cover Letter Generation ────────────────────────────────────────

export async function generateCoverLetterWithAI(
  config: AIConfig,
  resumeData: ResumeData,
  jobData: JobDescriptionData,
): Promise<string> {
  const system = `You are a master cover letter writer combining expertise from Harvard OCS and professional recruiting.
${ATS_EXPERTISE}

COVER LETTER RULES:
• 3-4 tight paragraphs — no fluff, no filler, every sentence earns its place
• Paragraph 1: Hook — specific role, why THIS company, strongest relevant qualification
• Paragraph 2: Strongest achievement story (STAR format) that directly addresses job requirement
• Paragraph 3: Second achievement or complementary skill with specific metric
• Paragraph 4: Closing — clear next step, enthusiasm, thank you
• Use EXACT keywords from the job description naturally woven in
• Never use: "I believe I would be a great fit", "I am a quick learner", "I am passionate"
• Professional salutation: "Dear [Name]:" or "Dear Hiring Manager:" — never "To Whom It May Concern"
• Do NOT write [placeholder] brackets or generic fillers — write the actual letter
• HONESTY: Every achievement, skill, and technology mentioned must come from the candidate's actual resume — never invent experience to fill a gap in the job requirements`

  const user = `Write a tailored cover letter for this specific application.

=== CANDIDATE'S FULL RESUME ===
${(resumeData.rawText || '').slice(0, 4000)}

=== STRUCTURED CANDIDATE DATA ===
Name: ${resumeData.name}
Most Recent: ${resumeData.experience[0]?.title} at ${resumeData.experience[0]?.company}
Key Skills: ${resumeData.skills.slice(0, 10).join(', ')}
Summary: ${resumeData.summary}
Certifications: ${resumeData.certifications.join(', ')}

=== TARGET JOB DESCRIPTION ===
${jobData.rawText.slice(0, 3000)}

=== EXTRACTED JOB REQUIREMENTS ===
Role: ${jobData.title}${jobData.company ? ` at ${jobData.company}` : ''}
Required Skills: ${jobData.requiredSkills.join(', ')}
Key Technologies: ${jobData.technologies.join(', ')}
Key Responsibilities: ${jobData.responsibilities.slice(0, 5).join(' | ')}

Write the complete cover letter now (no brackets, no placeholders):`

  return callAI(config, system, user, 0.6)
}

// ─── Stage 6: Interview Question Predictor ───────────────────────────────────

export async function predictInterviewQuestionsWithAI(
  config: AIConfig,
  resumeData: ResumeData,
  jobData: JobDescriptionData | null,
): Promise<InterviewPrediction> {
  const system = `You are an expert interview coach and technical recruiting specialist with 15+ years of experience.
Analyze the candidate's background against the target role and predict the most likely interview questions.
Consider the candidate's experience gaps, standout achievements, and the role's technical requirements.
Return ONLY valid JSON — no markdown fences, no explanation.`

  const user = `Predict likely interview questions for this candidate and role.

=== CANDIDATE RESUME ===
${(resumeData.rawText || '').slice(0, 3000)}

=== STRUCTURED DATA ===
Most Recent: ${resumeData.experience[0]?.title ?? 'N/A'} at ${resumeData.experience[0]?.company ?? 'N/A'}
Positions: ${resumeData.experience.length}
Skills: ${resumeData.skills.slice(0, 15).join(', ')}
Certifications: ${resumeData.certifications.join(', ')}

${jobData
  ? `=== TARGET ROLE ===
Role: ${jobData.title}${jobData.company ? ` at ${jobData.company}` : ''}
Required Skills: ${jobData.requiredSkills.join(', ')}
Technologies: ${jobData.technologies.join(', ')}
Responsibilities: ${jobData.responsibilities.slice(0, 5).join(' | ')}`
  : '=== NO JOB DESCRIPTION — predict questions based on candidate background and most recent role ==='
}

Return ONLY this JSON structure (12-15 questions, 3-5 items each for the arrays):
{
  "questions": [
    {
      "question": "the actual interview question",
      "category": "behavioral" | "technical" | "role-specific" | "culture-fit" | "situational",
      "difficulty": "easy" | "medium" | "hard",
      "tip": "1-2 sentence specific tip for answering this question well"
    }
  ],
  "focusAreas": ["area to prepare", ...],
  "keyStrengths": ["strength to highlight", ...],
  "warningAreas": ["potential weakness or gap to address", ...]
}`

  const raw = await callAI(config, system, user, 0.7)
  try {
    const cleaned = raw.replace(/^```(?:json)?\n?|```\s*$/gm, '').trim()
    return JSON.parse(cleaned) as InterviewPrediction
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) as InterviewPrediction } catch { /* fall through */ }
    }
    throw new Error('Failed to parse interview prediction response.')
  }
}

// ─── Stage 7: Salary Range Estimator ─────────────────────────────────────────

export async function estimateSalaryWithAI(
  config: AIConfig,
  resumeData: ResumeData,
  jobData: JobDescriptionData | null,
): Promise<SalaryEstimate> {
  const system = `You are a compensation expert with current knowledge of salary data from levels.fyi, Glassdoor, LinkedIn Salary, and the U.S. Bureau of Labor Statistics.
Analyze the candidate's experience level, skills, and target role to estimate realistic salary ranges.
Be realistic — base ranges on market data, not aspirational numbers.
Return ONLY valid JSON — no markdown fences, no explanation.`

  const user = `Estimate salary ranges for this candidate and role.

=== CANDIDATE RESUME ===
${(resumeData.rawText || '').slice(0, 2500)}

=== STRUCTURED DATA ===
Most Recent: ${resumeData.experience[0]?.title ?? 'N/A'} at ${resumeData.experience[0]?.company ?? 'N/A'}
Positions: ${resumeData.experience.length}
Skills: ${resumeData.skills.slice(0, 15).join(', ')}
Education: ${resumeData.education.map(e => `${e.degree} from ${e.institution}`).join(', ')}
Certifications: ${resumeData.certifications.join(', ')}
Location: ${resumeData.location || 'Not specified'}

${jobData
  ? `=== TARGET ROLE ===
Role: ${jobData.title}${jobData.company ? ` at ${jobData.company}` : ''}
Required Skills: ${jobData.requiredSkills.join(', ')}
Technologies: ${jobData.technologies.join(', ')}`
  : '=== NO JOB DESCRIPTION — estimate based on candidate\'s most recent role and experience level ==='
}

Return ONLY this JSON structure (all salary figures as whole-number integers, USD):
{
  "base": { "low": 0, "median": 0, "high": 0, "currency": "USD" },
  "totalComp": { "low": 0, "median": 0, "high": 0, "currency": "USD" },
  "experienceLevel": "e.g. Mid-Level, Senior, Staff/Principal",
  "location": "derived from resume/job or 'United States (National Average)'",
  "factors": [
    { "factor": "factor name", "impact": "positive" | "negative" | "neutral", "note": "brief explanation" }
  ],
  "negotiationTips": ["actionable tip", ...],
  "disclaimer": "These are market estimates based on publicly available compensation data and may not reflect actual offers. Compensation varies significantly by company size, location, and negotiation."
}`

  const raw = await callAI(config, system, user, 0.3)
  try {
    const cleaned = raw.replace(/^```(?:json)?\n?|```\s*$/gm, '').trim()
    return JSON.parse(cleaned) as SalaryEstimate
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) as SalaryEstimate } catch { /* fall through */ }
    }
    throw new Error('Failed to parse salary estimation response.')
  }
}
