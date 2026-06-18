import { useState, useCallback } from 'react'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ResumeUploadProps {
  onParsed: (rawText: string, fileName: string) => void
  isLoading: boolean
}

export function ResumeUpload({ onParsed, isLoading }: ResumeUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')

  const processFile = useCallback(async (file: File) => {
    setError('')
    setFileName(file.name)
    try {
      const { parseDocument, createAtsView } = await import('../lib/documentParser')
      const raw = await parseDocument(file)
      const normalized = createAtsView(raw)
      onParsed(normalized, file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.')
    }
  }, [onParsed])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Drop zone */}
      <label
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all duration-200',
          dragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-[#2e3347] bg-[#1a1d27] hover:border-indigo-500/50 hover:bg-indigo-500/5'
        )}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <>
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
            <p className="text-slate-400 text-sm">Extracting text from {fileName}...</p>
          </>
        ) : (
          <>
            <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
              <Upload className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-slate-200 font-medium">Drop your resume here</p>
              <p className="text-slate-500 text-sm mt-1">or click to browse</p>
            </div>
            <div className="flex gap-2">
              {['PDF', 'DOCX', 'TXT', 'MD'].map(fmt => (
                <span
                  key={fmt}
                  className="bg-[#242736] border border-[#2e3347] text-slate-400 text-xs px-2 py-1 rounded-md font-mono"
                >
                  .{fmt.toLowerCase()}
                </span>
              ))}
            </div>
          </>
        )}
      </label>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-600/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Or paste text */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#2e3347]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#0f1117] px-3 text-xs text-slate-600">or paste resume text</span>
        </div>
      </div>

      <PasteResumeText onParsed={onParsed} isLoading={isLoading} />
    </div>
  )
}

function PasteResumeText({
  onParsed,
  isLoading,
}: {
  onParsed: (text: string, name: string) => void
  isLoading: boolean
}) {
  const [text, setText] = useState('')

  const handleUse = () => {
    if (text.trim().length > 50) {
      onParsed(text.trim(), 'pasted-resume.txt')
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste your resume content here..."
          rows={6}
          className="w-full bg-[#1a1d27] border border-[#2e3347] rounded-xl pl-9 pr-4 py-3 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 resize-y font-mono"
        />
      </div>
      <Button
        onClick={handleUse}
        variant="secondary"
        size="sm"
        disabled={text.trim().length < 50 || isLoading}
        className="w-full"
      >
        Use Pasted Text
      </Button>
    </div>
  )
}
