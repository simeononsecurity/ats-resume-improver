import { useState } from 'react'
import { Mail, Wand2, Copy, Check, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { ResumeData, JobDescriptionData } from '@/types'
import type { AIConfig } from '@/lib/aiProvider'

interface CoverLetterGeneratorProps {
  aiConfig: AIConfig
  resumeData: ResumeData
  jobData: JobDescriptionData | null
  coverLetter: string
  onGenerated: (letter: string) => void
}

export function CoverLetterGenerator({
  aiConfig,
  resumeData,
  jobData,
  coverLetter,
  onGenerated,
}: CoverLetterGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const hasAI = aiConfig.provider === 'ollama' || !!aiConfig.apiKey

  const providerLabel =
    aiConfig.provider === 'ollama'
      ? '🦙 Ollama'
      : aiConfig.provider === 'anthropic'
      ? 'Claude'
      : 'GPT'

  const handleGenerate = async () => {
    if (!hasAI) {
      setError('Configure an AI provider to generate a cover letter.')
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
      const result = await generateCoverLetterWithAI(aiConfig, resumeData, jobData)
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

  const handleDownloadDOCX = async () => {
    try {
      const { Document, Paragraph, TextRun, Packer } = await import('docx')
      const paragraphs = coverLetter.split('\n').map(
        (line) =>
          new Paragraph({
            children: [new TextRun({ text: line, size: 22, font: 'Calibri' })],
            spacing: { after: line.trim() === '' ? 80 : 160 },
          }),
      )
      const doc = new Document({
        sections: [{
          properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
          children: paragraphs,
        }],
        styles: {
          default: {
            document: { run: { font: 'Calibri', size: 22 }, paragraph: { spacing: { line: 276 } } },
          },
        },
      })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cover-letter.docx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Fallback to txt if docx fails
      handleDownload()
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Requirements check */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          hasAI ? 'border-emerald-500/30 bg-emerald-600/5' : 'border-[#2e3347] bg-[#1a1d27]'
        }`}>
          <Mail className={`w-4 h-4 ${hasAI ? 'text-emerald-400' : 'text-slate-600'}`} />
          <div>
            <p className={`text-sm font-medium ${hasAI ? 'text-emerald-300' : 'text-slate-500'}`}>
              AI Provider
            </p>
            <p className="text-xs text-slate-600">
              {hasAI ? `${providerLabel} — ${aiConfig.model}` : 'Required'}
            </p>
          </div>
          <Badge variant={hasAI ? 'success' : 'muted'} className="ml-auto">
            {hasAI ? '✓' : 'Missing'}
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
                disabled={!hasAI || !jobData}
                size="lg"
              >
                {!isLoading && <Wand2 className="w-5 h-5" />}
                {isLoading ? 'Generating...' : `Generate with ${providerLabel}`}
              </Button>

              {!hasAI && (
                <p className="text-xs text-slate-600">
                  Configure an AI provider in the sidebar to enable cover letter generation
                </p>
              )}
              {hasAI && !jobData && (
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
              <Button variant="secondary" size="sm" onClick={handleDownloadDOCX}>
                <Download className="w-4 h-4" />
                .docx
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
