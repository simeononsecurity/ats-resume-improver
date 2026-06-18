import type { JobDescriptionData, KeywordAnalysis } from '../types'

// Common tech skill synonyms / related terms
const SKILL_RELATIONS: Record<string, string[]> = {
  javascript: ['js', 'node', 'nodejs', 'react', 'vue', 'angular', 'typescript', 'ts'],
  python: ['django', 'flask', 'fastapi', 'pandas', 'numpy', 'scikit'],
  java: ['spring', 'springboot', 'maven', 'gradle'],
  kubernetes: ['k8s', 'helm', 'container orchestration'],
  docker: ['containers', 'containerization', 'podman'],
  aws: ['amazon web services', 'ec2', 's3', 'lambda', 'cloudformation'],
  azure: ['microsoft azure', 'az-900', 'az-104'],
  gcp: ['google cloud', 'google cloud platform'],
  terraform: ['iac', 'infrastructure as code'],
  ci_cd: ['jenkins', 'github actions', 'gitlab ci', 'circleci', 'devops'],
  sql: ['mysql', 'postgresql', 'database', 'postgres'],
  nosql: ['mongodb', 'cassandra', 'dynamodb', 'redis'],
  machine_learning: ['ml', 'ai', 'artificial intelligence', 'deep learning', 'neural network'],
  agile: ['scrum', 'kanban', 'jira', 'sprint'],
  powershell: ['ps script', 'powershell scripting'],
  linux: ['ubuntu', 'centos', 'rhel', 'bash', 'shell scripting'],
  windows: ['active directory', 'group policy', 'hyper-v'],
  networking: ['tcp/ip', 'dns', 'dhcp', 'vpn', 'firewall', 'bgp', 'ospf'],
  security: ['cybersecurity', 'soc', 'siem', 'penetration testing', 'zero trust'],
}

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/[\s-_]+/g, ' ')
}

function findRelated(term: string, resumeText: string): string[] {
  const termNorm = normalize(term)
  const related: string[] = []

  for (const [key, synonyms] of Object.entries(SKILL_RELATIONS)) {
    const groupTerms = [key.replace(/_/g, ' '), ...synonyms]
    const termInGroup = groupTerms.some(t => normalize(t) === termNorm || termNorm.includes(normalize(t)))

    if (termInGroup) {
      // Find other terms in this group that appear in the resume
      for (const sibling of groupTerms) {
        const sibNorm = normalize(sibling)
        if (sibNorm !== termNorm && resumeText.toLowerCase().includes(sibNorm)) {
          related.push(sibling)
        }
      }
    }
  }

  return [...new Set(related)]
}

export function analyzeKeywords(
  resumeText: string,
  jobData: JobDescriptionData
): KeywordAnalysis {
  const allTerms = [
    ...jobData.requiredSkills,
    ...jobData.preferredSkills,
    ...jobData.technologies,
    ...jobData.certifications,
  ]

  // Deduplicate
  const uniqueTerms = [...new Set(allTerms.map(t => t.trim()).filter(Boolean))]

  const resumeLower = resumeText.toLowerCase()

  const matching: string[] = []
  const missing: string[] = []
  const related: string[] = []

  for (const term of uniqueTerms) {
    const termNorm = normalize(term)
    if (resumeLower.includes(termNorm)) {
      matching.push(term)
    } else {
      missing.push(term)
      // Find related skills in resume that could be mentioned as evidence
      const rels = findRelated(term, resumeText)
      related.push(...rels)
    }
  }

  const coveragePercent = uniqueTerms.length > 0
    ? Math.round((matching.length / uniqueTerms.length) * 100)
    : 0

  return {
    matching: [...new Set(matching)],
    missing: [...new Set(missing)],
    related: [...new Set(related)],
    coveragePercent,
  }
}

/**
 * Parse a raw job description text into structured data (no AI needed)
 */
export function parseJobDescriptionLocal(text: string): Partial<JobDescriptionData> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  const requiredSkills: string[] = []
  const technologies: string[] = []
  const certifications: string[] = []

  // Common tech keywords to scan for
  const techKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'Ruby', 'PHP',
    'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'Spring',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Ansible',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins', 'GitHub Actions',
    'Linux', 'Windows Server', 'PowerShell', 'Bash',
    'REST', 'GraphQL', 'gRPC', 'Microservices', 'API',
    'Machine Learning', 'TensorFlow', 'PyTorch', 'Spark', 'Hadoop',
    'Agile', 'Scrum', 'Kanban', 'Jira',
    'Active Directory', 'SIEM', 'Splunk', 'Security',
    'Networking', 'TCP/IP', 'DNS', 'DHCP', 'VPN', 'Firewall',
    'Intune', 'SCCM', 'ServiceNow',
  ]

  const certKeywords = [
    'AWS Certified', 'Azure', 'GCP', 'CompTIA', 'CISSP', 'CCNA', 'CCNP',
    'PMP', 'ITIL', 'Kubernetes (CKA', 'CKS', 'CKAD', 'Terraform Associate',
    'Security+', 'Network+', 'A+', 'CEH', 'OSCP',
  ]

  const textLower = text.toLowerCase()

  for (const tech of techKeywords) {
    if (textLower.includes(tech.toLowerCase())) {
      technologies.push(tech)
    }
  }

  for (const cert of certKeywords) {
    if (textLower.includes(cert.toLowerCase())) {
      certifications.push(cert)
    }
  }

  // Extract required skills from "Required:" or "Requirements:" sections
  let inRequired = false
  for (const line of lines) {
    if (/required|requirements|must have|qualifications/i.test(line)) {
      inRequired = true
      continue
    }
    if (/preferred|nice to have|bonus|plus/i.test(line)) {
      inRequired = false
    }
    if (inRequired && line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
      requiredSkills.push(line.replace(/^[•\-*]\s*/, ''))
    }
  }

  // First line or title-looking line
  const title = lines[0] || ''

  return {
    title,
    requiredSkills: [...new Set(requiredSkills)],
    preferredSkills: [],
    technologies: [...new Set(technologies)],
    certifications: [...new Set(certifications)],
    responsibilities: [],
    rawText: text,
  }
}
