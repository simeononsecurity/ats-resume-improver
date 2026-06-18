import { useState } from 'react'
import { Mail, Wand2, Copy, Check, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { ResumeData, JobDescriptionData } from '@/types'

interface CoverLetterGeneratorProps {
  apiKey: string
  aiModel?: string
  resumeData: ResumeData
  jobData: JobDescriptionData | null
  coverLetter: string
  onGenerated: (letter: string) => void
}

export function CoverLetterGenerator({
  apiKey,
  aiModel,
  resumeData,
  jobData,
  coverLetter,
  onGenerated,
}: CoverLetterGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('OpenAI API key required to generate a cover letter.')
      return
    }
    if (!jobData) {
      setError('Please add a job description first to generate a tailored cover letter.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      const { generateCoverLetterWithAI } = await import('@/lib/openaiService')
      const result = await generateCoverLetterWithAI(apiKey, resumeData, jobData, aiModel)
      onGenerated(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cover letter generation failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cover-letter.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Requirements check */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          apiKey ? 'border-emerald-500/30 bg-emerald-600/5' : 'border-[#2e3347] bg-[#1a1d27]'
        }`}>
          <Mail className={`w-4 h-4 ${apiKey ? 'text-emerald-400' : 'text-slate-600'}`} />
          <div>
            <p className={`text-sm font-medium ${apiKey ? 'text-emerald-300' : 'text-slate-500'}`}>
              OpenAI API Key
            </p>
            <p className="text-xs text-slate-600">{apiKey ? 'Connected' : 'Required'}</p>
          </div>
          <Badge variant={apiKey ? 'success' : 'muted'} className="ml-auto">
            {apiKey ? '✓' : 'Missing'}
          </Badge>
        </div>

        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          jobData ? 'border-emerald-500/30 bg-emerald-600/5' : 'border-[#2e3347] bg-[#1a1d27]'
        }`}>
          <Mail className={`w-4 h-4 ${jobData ? 'text-emerald-400' : 'text-slate-600'}`} />
          <div>
            <p className={`text-sm font-medium ${jobData ? 'text-emerald-300' : 'text-slate-500'}`}>
              Job Description
            </p>
            <p className="text-xs text-slate-600">
              {jobData ? (jobData.title || 'Analyzed') : 'Required for tailored letter'}
            </p>
          </div>
          <Badge variant={jobData ? 'success' : 'muted'} className="ml-auto">
            {jobData ? '✓' : 'Missing'}
          </Badge>
        </div>
      </div>

      {/* Generate button */}
      {!coverLetter && (
        <Card variant="bordered" className="border-indigo-500/30">
          <CardContent>
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
                <Wand2 className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">AI Cover Letter Generator</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Generates a compelling, role-specific cover letter that connects your experience
                  directly to the job requirements — without fabricating anything.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-600/10 border border-red-500/30 rounded-lg px-3 py-2 max-w-sm mx-auto">
                  {error}
                </p>
              )}

              <Button
                onClick={handleGenerate}
                loading={isLoading}
                disabled={!apiKey || !jobData}
                size="lg"
              >
                {!isLoading && <Wand2 className="w-5 h-5" />}
                {isLoading ? 'Generating...' : 'Generate Cover Letter'}
              </Button>

              {!apiKey && (
                <p className="text-xs text-slate-600">
                  Add your OpenAI API key to enable cover letter generation
                </p>
              )}
              {apiKey && !jobData && (
                <p className="text-xs text-slate-600">
                  Add a job description above to generate a tailored cover letter
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cover letter output */}
      {coverLetter && (
        <Card className="animate-fade-in">
          <CardHeader className="justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-indigo-600/20">
                <Mail className="w-4 h-4 text-indigo-400" />
              </div>
              <CardTitle>Generated Cover Letter</CardTitle>
              <Badge variant="success">AI Generated</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4" />
                .txt
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-[#0f1117] rounded-xl border border-[#2e3347] p-6 whitespace-pre-wrap text-sm text-slate-300 leading-relaxed max-h-[500px] overflow-y-auto">
              {coverLetter}
            </div>
          </CardContent>
        </Card>
      )}

      {coverLetter && (
        <Button
          onClick={handleGenerate}
          variant="secondary"
          loading={isLoading}
          size="sm"
          className="w-full"
        >
          <Wand2 className="w-4 h-4" />
          Regenerate
        </Button>
      )}
    </div>
  )
}
