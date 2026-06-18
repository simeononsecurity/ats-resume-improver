import { useState } from 'react'
import { GitCompare, Eye, Copy, Check, Download, FileText, File, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { OptimizedResume, ResumeData } from '@/types'

interface DiffViewerProps {
  original: string
  optimized: OptimizedResume
  apiKey?: string
  resumeData?: ResumeData
}

type ViewMode = 'side-by-side' | 'ats' | 'tailored'
type ExportFormat = 'pdf' | 'docx' | 'txt'

export function DiffViewer({ original, optimized, apiKey, resumeData }: DiffViewerProps) {
  const [mode, setMode] = useState<ViewMode>('side-by-side')
  const [copied, setCopied] = useState<string | null>(null)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const getActiveContent = () =>
    mode === 'tailored' ? optimized.tailoredVersion : optimized.atsVersion

  const getVersionLabel = () => mode === 'tailored' ? 'tailored' : 'ats'

  const getCandidateName = () => {
    const name = resumeData?.name || optimized.structuredData?.name || ''
    return (name || 'resume').toLowerCase().replace(/\s+/g, '-').slice(0, 30)
  }

  const getStructuredData = (): ResumeData | undefined =>
    resumeData ?? optimized.structuredData ?? undefined

  const handleExport = async (format: ExportFormat) => {
    setExporting(format)
    try {
      const fileName = `${getCandidateName()}-${getVersionLabel()}.${format}`
      const content = getActiveContent()
      const data = getStructuredData()

      if (apiKey && data) {
        // AI-enhanced export: formats with AI then renders beautifully
        const { exportWithAI } = await import('@/lib/exportService')
        await exportWithAI(apiKey, data, format, content, fileName)
      } else {
        // Direct export with improved templates
        const { exportPDF, exportDOCX, exportTXT } = await import('@/lib/exportService')
        if (format === 'pdf') await exportPDF(content, fileName, data)
        else if (format === 'docx' && data) await exportDOCX(data, fileName)
        else if (format === 'docx') await exportPDF(content, fileName.replace('.docx', '.pdf'))
        else exportTXT(content, fileName)
      }
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(null)
    }
  }

  const ExportBtn = ({ format, label, icon }: { format: ExportFormat; label: string; icon: React.ReactNode }) => (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => handleExport(format)}
      loading={exporting === format}
      className="gap-1.5"
    >
      {exporting !== format && icon}
      {label}
    </Button>
  )

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Mode tabs */}
      <div className="flex items-center gap-2 bg-[#1a1d27] border border-[#2e3347] rounded-xl p-1 w-fit">
        {(['side-by-side', 'ats', 'tailored'] as ViewMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {m === 'side-by-side' ? 'Side by Side' : m === 'ats' ? 'ATS Version' : 'Tailored Version'}
          </button>
        ))}
      </div>

      {/* Download bar */}
      <div className="flex items-center gap-2 flex-wrap bg-[#1a1d27] border border-[#2e3347] rounded-xl px-4 py-3">
        <div className="flex items-center gap-1.5 mr-2">
          {apiKey ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs text-indigo-400 font-medium">AI-Enhanced</span>
            </>
          ) : (
            <span className="text-xs text-slate-500 font-medium">Download:</span>
          )}
        </div>
        <ExportBtn format="pdf" label="PDF" icon={<File className="w-3.5 h-3.5 text-red-400" />} />
        <ExportBtn format="docx" label="DOCX" icon={<FileText className="w-3.5 h-3.5 text-blue-400" />} />
        <ExportBtn format="txt" label="TXT" icon={<Download className="w-3.5 h-3.5 text-slate-400" />} />
        {apiKey && (
          <span className="text-xs text-slate-600 ml-1">AI formats & validates before downloading</span>
        )}
      </div>

      {/* Changes badges */}
      {optimized.changes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <GitCompare className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500">{optimized.changes.length} changes:</span>
          {['Experience', 'Skills', 'Summary', 'Education'].map(section => {
            const count = optimized.changes.filter(c => c.section === section).length
            if (!count) return null
            return <Badge key={section} variant="muted">{section}: {count}</Badge>
          })}
        </div>
      )}

      {/* Side by side */}
      {mode === 'side-by-side' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="danger">Original</Badge>
                <CardTitle className="text-sm">Before</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyText(original, 'orig')}>
                {copied === 'orig' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-[#0f1117] rounded-xl border border-[#2e3347] p-3 max-h-[500px] overflow-y-auto">
                <pre className="resume-text text-slate-400">{original}</pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="success">Optimized</Badge>
                <CardTitle className="text-sm">After (ATS Version)</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyText(optimized.atsVersion, 'ats')}>
                {copied === 'ats' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-[#0f1117] rounded-xl border border-emerald-500/20 p-3 max-h-[500px] overflow-y-auto">
                <pre className="resume-text text-slate-200">{optimized.atsVersion}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ATS only */}
      {mode === 'ats' && (
        <Card>
          <CardHeader className="justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <CardTitle>ATS-Optimized Version</CardTitle>
              <Badge variant="success">ATS Friendly</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => copyText(optimized.atsVersion, 'ats2')}>
              {copied === 'ats2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied === 'ats2' ? 'Copied!' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="bg-[#0f1117] rounded-xl border border-[#2e3347] p-4 max-h-[600px] overflow-y-auto">
              <pre className="resume-text text-slate-200">{optimized.atsVersion}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tailored only */}
      {mode === 'tailored' && (
        <Card>
          <CardHeader className="justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <CardTitle>Job-Tailored Version</CardTitle>
              <Badge variant="info">Customized</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => copyText(optimized.tailoredVersion, 'tail')}>
              {copied === 'tail' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied === 'tail' ? 'Copied!' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="bg-[#0f1117] rounded-xl border border-[#2e3347] p-4 max-h-[600px] overflow-y-auto">
              <pre className="resume-text text-slate-200">{optimized.tailoredVersion}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change log */}
      {optimized.changes.length > 0 && (
        <Card>
          <CardHeader>
            <GitCompare className="w-4 h-4 text-indigo-400" />
            <CardTitle>Change Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {optimized.changes.map((change, i) => (
                <div key={i} className="border-l-2 border-indigo-500/30 pl-4 py-1">
                  <Badge variant="muted" className="text-[10px] mb-1">{change.section}</Badge>
                  <div className="text-xs space-y-1">
                    <p className="text-red-400/80 line-through">{change.original}</p>
                    <p className="text-emerald-400">{change.updated}</p>
                    <p className="text-slate-600 italic">{change.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {optimized.changes.length === 0 && (
        <div className="text-center py-4 text-slate-600 text-sm">
          Review the ATS Version above for the complete reformatted resume.
        </div>
      )}
    </div>
  )
}
