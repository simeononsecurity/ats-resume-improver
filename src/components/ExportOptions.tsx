import { useState } from 'react'
import { Download, FileText, File, Code2, BookOpen, CheckCircle, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { OptimizedResume, ResumeData } from '@/types'
import type { AIConfig } from '@/lib/aiProvider'

interface ExportOptionsProps {
  optimizedResume: OptimizedResume
  resumeData: ResumeData
  aiConfig?: AIConfig
}

type Format = 'pdf' | 'docx' | 'txt' | 'md'
type Version = 'ats' | 'tailored'

const FORMAT_INFO: Record<Format, { label: string; icon: React.ReactNode; description: string }> = {
  pdf: {
    label: 'PDF',
    icon: <File className="w-5 h-5 text-red-400" />,
    description: 'Best for email & direct applications',
  },
  docx: {
    label: 'DOCX',
    icon: <FileText className="w-5 h-5 text-blue-400" />,
    description: 'Best for uploading to job portals',
  },
  txt: {
    label: 'TXT',
    icon: <Code2 className="w-5 h-5 text-slate-400" />,
    description: 'Maximum ATS compatibility',
  },
  md: {
    label: 'Markdown',
    icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
    description: 'For portfolios & GitHub',
  },
}

export function ExportOptions({ optimizedResume, resumeData, aiConfig }: ExportOptionsProps) {
  const [selectedFormat, setSelectedFormat] = useState<Format>('pdf')
  const [selectedVersion, setSelectedVersion] = useState<Version>('ats')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const getContent = () =>
    selectedVersion === 'ats' ? optimizedResume.atsVersion : optimizedResume.tailoredVersion

  const getStructuredData = () => optimizedResume.structuredData ?? resumeData

  const getFileName = (ext: string) => {
    const name = (getStructuredData().name || 'resume').toLowerCase().replace(/\s+/g, '-').slice(0, 30)
    return `${name}-${selectedVersion}.${ext}`
  }

  const hasAI = !!aiConfig && (aiConfig.provider === 'ollama' || !!aiConfig.apiKey)

  const handleExport = async () => {
    setLoading(true)
    setSuccess(false)
    try {
      const content = getContent()
      const data = getStructuredData()
      const fileName = getFileName(selectedFormat)

      if (hasAI && aiConfig && selectedFormat !== 'md') {
        // AI-enhanced: ask AI to format perfectly before rendering
        const { exportWithAI } = await import('@/lib/exportService')
        await exportWithAI(aiConfig, data, selectedFormat as 'pdf' | 'docx' | 'txt', content, fileName)
      } else {
        const { exportTXT, exportMarkdown, exportPDF, exportDOCX } = await import('@/lib/exportService')
        switch (selectedFormat) {
          case 'txt': exportTXT(content, fileName); break
          case 'md': exportMarkdown(data, fileName); break
          case 'pdf': await exportPDF(content, fileName, data); break
          case 'docx': await exportDOCX(data, fileName); break
        }
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* AI indicator */}
      {hasAI && (
        <div className="flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/30 rounded-xl px-4 py-2.5">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <p className="text-xs text-indigo-300">
            <span className="font-medium">AI-enhanced exports active</span> — AI will format and validate your resume before generating PDF/DOCX/TXT
          </p>
        </div>
      )}

      {/* Version selector */}
      <Card>
        <CardHeader><CardTitle>Choose Version</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {(['ats', 'tailored'] as Version[]).map(v => (
              <button
                key={v}
                onClick={() => setSelectedVersion(v)}
                className={`flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all ${
                  selectedVersion === v ? 'border-indigo-500/60 bg-indigo-600/10' : 'border-[#2e3347] bg-[#242736] hover:border-indigo-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {selectedVersion === v && <CheckCircle className="w-4 h-4 text-indigo-400" />}
                  <span className="font-medium text-slate-200">{v === 'ats' ? 'ATS Version' : 'Tailored Version'}</span>
                  <Badge variant={v === 'ats' ? 'success' : 'info'}>{v === 'ats' ? 'Recommended' : 'Job-Specific'}</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {v === 'ats' ? 'Single-column, plain-text compatible, universal ATS layout' : 'Optimized for the specific job description you provided'}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Format selector */}
      <Card>
        <CardHeader><CardTitle>Choose Format</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(FORMAT_INFO) as [Format, typeof FORMAT_INFO[Format]][]).map(([fmt, info]) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                  selectedFormat === fmt ? 'border-indigo-500/60 bg-indigo-600/10' : 'border-[#2e3347] bg-[#242736] hover:border-indigo-500/30'
                }`}
              >
                {info.icon}
                <span className={`text-sm font-semibold ${selectedFormat === fmt ? 'text-indigo-300' : 'text-slate-300'}`}>.{info.label}</span>
                <span className="text-[10px] text-slate-500 text-center leading-tight">{info.description}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export button */}
      <Card variant="bordered" className="border-indigo-500/30">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">
                Export as <span className="text-indigo-400">.{selectedFormat.toUpperCase()}</span>
                {' — '}<span className="text-cyan-400">{selectedVersion === 'ats' ? 'ATS' : 'Tailored'} version</span>
                {hasAI && selectedFormat !== 'md' && <span className="text-indigo-400/70"> (AI-formatted)</span>}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">File: {getFileName(selectedFormat)}</p>
            </div>
            <Button onClick={handleExport} loading={loading} size="lg" className="shrink-0">
              {!loading && success && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {!loading && !success && <Download className="w-5 h-5" />}
              {success ? 'Downloaded!' : loading ? 'Exporting...' : 'Download'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick format buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(['pdf', 'docx', 'txt', 'md'] as Format[]).map(fmt => (
          <button
            key={fmt}
            onClick={() => setSelectedFormat(fmt)}
            disabled={loading}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all disabled:opacity-50 ${
              selectedFormat === fmt
                ? 'border-indigo-500/50 bg-indigo-600/10 text-indigo-300'
                : 'border-[#2e3347] bg-[#1a1d27] text-slate-400 hover:border-indigo-500/40 hover:text-slate-200'
            }`}
          >
            {FORMAT_INFO[fmt].icon}
            .{fmt}
          </button>
        ))}
      </div>
    </div>
  )
}
