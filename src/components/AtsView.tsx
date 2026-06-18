import { useState } from 'react'
import { Eye, AlertTriangle, CheckCircle, Info, Copy, Check } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { detectSections, detectContactInfo } from '@/lib/atsAnalyzer'
import { detectFormattingIssues } from '@/lib/documentParser'
import { detectResumeType } from '@/lib/resumeTypeDetector'
import { parseResumeLocal } from '@/lib/openaiService'
import type { ResumeData } from '@/types'

interface AtsViewProps {
  rawText: string
  fileName?: string
  resumeData?: ResumeData
}

export function AtsView({ rawText, fileName, resumeData }: AtsViewProps) {
  // Use provided resumeData or detect from raw text
  const data = resumeData ?? parseResumeLocal(rawText)
  const profile = detectResumeType(data)
  const [copied, setCopied] = useState(false)

  const sections = detectSections(rawText)
  const contact = detectContactInfo(rawText)
  const formattingIssues = detectFormattingIssues(rawText)

  const sectionLabels: Record<string, string> = {
    contact: 'Contact Info',
    summary: 'Summary',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    certifications: 'Certifications',
  }

  const copyText = async () => {
    await navigator.clipboard.writeText(rawText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Characters"
          value={rawText.length.toLocaleString()}
          icon={<Eye className="w-4 h-4 text-indigo-400" />}
        />
        <StatCard
          label="Lines"
          value={rawText.split('\n').filter(l => l.trim()).length.toLocaleString()}
          icon={<Info className="w-4 h-4 text-cyan-400" />}
        />
        <StatCard
          label="Words"
          value={rawText.split(/\s+/).filter(Boolean).length.toLocaleString()}
          icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="File"
          value={fileName?.split('.').pop()?.toUpperCase() ?? 'TEXT'}
          icon={<Info className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Resume type card */}
      <div className="flex items-start gap-4 bg-[#1a1d27] border border-indigo-500/30 rounded-xl px-4 py-3">
        <div className="text-2xl">{profile.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-indigo-300">{profile.label}</p>
            <Badge variant="default">Detected Profile</Badge>
          </div>
          <p className="text-xs text-slate-500 mb-1.5">{profile.description}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{profile.rationale}</p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-xs text-slate-600">Optimal section order:</span>
            {profile.sectionOrder.map((s, i) => (
              <span key={s} className="flex items-center gap-1">
                <span className="text-xs font-medium text-indigo-300 capitalize">{s}</span>
                {i < profile.sectionOrder.length - 1 && <span className="text-slate-700 text-xs">→</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Section detection */}
      <Card>
        <CardHeader>
          <CardTitle>Detected Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(sectionLabels).map(([key, label]) => (
              <Badge
                key={key}
                variant={sections[key] ? 'success' : 'danger'}
              >
                {sections[key] ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {label}
              </Badge>
            ))}
            <Badge variant={contact.hasEmail ? 'success' : 'danger'}>
              {contact.hasEmail ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              Email
            </Badge>
            <Badge variant={contact.hasPhone ? 'success' : 'warning'}>
              {contact.hasPhone ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              Phone
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Formatting issues */}
      {formattingIssues.length > 0 && (
        <Card variant="bordered" className="border-amber-500/30">
          <CardHeader>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <CardTitle className="text-amber-300">Formatting Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {formattingIssues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-200/80">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ATS text view */}
      <Card>
        <CardHeader className="justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-indigo-600/20">
              <Eye className="w-4 h-4 text-indigo-400" />
            </div>
            <CardTitle>What the ATS Sees</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={copyText}>
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-[#0f1117] rounded-xl border border-[#2e3347] p-4 max-h-96 overflow-y-auto">
            <pre className="resume-text text-slate-300">{rawText}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="text-xl font-bold text-slate-100">{value}</div>
    </div>
  )
}
