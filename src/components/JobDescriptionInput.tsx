import { useState } from 'react'
import { Briefcase, Wand2, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { JobDescriptionData } from '@/types'

interface JobDescriptionInputProps {
  apiKey: string
  resumeRawText?: string
  onAnalyzed: (jobData: JobDescriptionData) => void
  jobData: JobDescriptionData | null
}

export function JobDescriptionInput({ apiKey, resumeRawText, onAnalyzed, jobData }: JobDescriptionInputProps) {
  const [text, setText] = useState(jobData?.rawText ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!text.trim()) return
    setError('')
    setIsLoading(true)
    try {
      if (apiKey) {
        const { parseJobDescriptionWithAI } = await import('@/lib/openaiService')
        const result = await parseJobDescriptionWithAI(apiKey, text, resumeRawText)
        onAnalyzed(result)
      } else {
        const { parseJobDescriptionLocal } = await import('@/lib/keywordMatcher')
        const result = parseJobDescriptionLocal(text)
        onAnalyzed({
          title: result.title ?? '',
          company: result.company ?? '',
          requiredSkills: result.requiredSkills ?? [],
          preferredSkills: result.preferredSkills ?? [],
          technologies: result.technologies ?? [],
          certifications: result.certifications ?? [],
          responsibilities: result.responsibilities ?? [],
          rawText: text,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze job description.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <div className="p-2 rounded-lg bg-cyan-600/20">
            <Briefcase className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <CardTitle>Job Description</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Paste the full job posting to get keyword gap analysis</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste the full job description here... LinkedIn, Indeed, ClearanceJobs, USAJobs, etc."
              rows={10}
              className="w-full bg-[#0f1117] border border-[#2e3347] rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 resize-y"
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-600/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={text.trim().length < 50 || isLoading}
                loading={isLoading}
                className="flex-1"
              >
                {!isLoading && <Wand2 className="w-4 h-4" />}
                {isLoading ? 'Analyzing...' : apiKey ? 'Analyze with AI' : 'Analyze Keywords'}
              </Button>
              {!apiKey && (
                <span className="text-xs text-slate-500">
                  Add an API key for deeper AI analysis
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parsed results */}
      {jobData && (
        <Card variant="bordered" className="animate-fade-in">
          <CardHeader>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <CardTitle className="text-emerald-300">Job Analysis Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobData.title && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Position</p>
                  <p className="text-sm font-medium text-slate-200">
                    {jobData.title}{jobData.company ? ` @ ${jobData.company}` : ''}
                  </p>
                </div>
              )}

              {jobData.requiredSkills.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Required Skills ({jobData.requiredSkills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {jobData.requiredSkills.slice(0, 12).map(s => (
                      <Badge key={s} variant="danger">{s}</Badge>
                    ))}
                    {jobData.requiredSkills.length > 12 && (
                      <Badge variant="muted">+{jobData.requiredSkills.length - 12} more</Badge>
                    )}
                  </div>
                </div>
              )}

              {jobData.technologies.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Technologies ({jobData.technologies.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {jobData.technologies.map(t => (
                      <Badge key={t} variant="info">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {jobData.certifications.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-1.5">
                    {jobData.certifications.map(c => (
                      <Badge key={c} variant="warning">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skip option */}
      {!jobData && (
        <div className="text-center">
          <p className="text-xs text-slate-600">
            No job posting? You can still get ATS score and optimization without a job description.
          </p>
        </div>
      )}
    </div>
  )
}
