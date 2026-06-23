import { useState } from 'react'
import { Link2, Wand2, Copy, Check, ChevronDown, ChevronUp, Briefcase, User, AlignLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { ResumeData, LinkedInOptimization, LinkedInJobEntry } from '@/types'
import type { AIConfig } from '@/lib/aiProvider'

interface LinkedInOptimizerProps {
  aiConfig: AIConfig
  resumeData: ResumeData
  optimization: LinkedInOptimization | null
  onGenerated: (result: LinkedInOptimization) => void
  onPendingChange?: (pending: boolean) => void
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-[#22263a]"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {label ?? (copied ? 'Copied' : 'Copy')}
    </button>
  )
}

function CharCount({ text, max, warn }: { text: string; max: number; warn?: number }) {
  const len = text.length
  const over = len > max
  const close = warn && len > warn
  return (
    <span className={`text-[10px] tabular-nums ${over ? 'text-red-400' : close ? 'text-amber-400' : 'text-slate-600'}`}>
      {len}/{max}
    </span>
  )
}

function JobCard({ job, index: _index }: { job: LinkedInJobEntry; index: number }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#22263a] transition-colors"
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-200 truncate">{job.title}</span>
            <span className="text-slate-600 text-xs">at</span>
            <span className="text-sm text-slate-400 truncate">{job.company}</span>
            {job.isCurrent && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                Current
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            {job.startDate} – {job.endDate || 'Present'}
            {' · '}
            <span className={job.isCurrent ? 'text-emerald-600' : 'text-slate-600'}>
              {job.isCurrent ? 'present tense' : 'past tense'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {job.optimizedDescription && <CopyButton text={job.optimizedDescription} />}
          {open ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#2e3347]">
          {job.optimizedDescription ? (
            <div className="mt-3">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{job.optimizedDescription}</p>
              <div className="flex items-center justify-between mt-2">
                <CharCount text={job.optimizedDescription} max={2000} warn={1800} />
                <span className="text-[10px] text-slate-600">LinkedIn experience description</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-slate-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              No description generated for this role yet.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function LinkedInOptimizer({
  aiConfig,
  resumeData,
  optimization,
  onGenerated,
  onPendingChange,
}: LinkedInOptimizerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [headlineOpen, setHeadlineOpen] = useState(true)
  const [aboutOpen, setAboutOpen] = useState(true)

  const hasAI = aiConfig.provider === 'ollama' || !!aiConfig.apiKey

  const providerLabel =
    aiConfig.provider === 'ollama' ? '🦙 Ollama'
    : aiConfig.provider === 'anthropic' ? 'Claude'
    : 'GPT'

  const handleGenerate = async () => {
    if (!hasAI) {
      setError('Configure an AI provider to generate LinkedIn optimizations.')
      return
    }
    setError('')
    setIsLoading(true)
    onPendingChange?.(true)
    try {
      const { generateLinkedInOptimization } = await import('@/lib/openaiService')
      const result = await generateLinkedInOptimization(aiConfig, resumeData)
      onGenerated(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'LinkedIn optimization failed.')
    } finally {
      setIsLoading(false)
      onPendingChange?.(false)
    }
  }

  const hasExperience = resumeData.experience.length > 0

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30">
              <Link2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">LinkedIn Profile Optimizer</h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-lg">
                Generates an optimized headline, About section, and per-job descriptions.
                Current roles use present tense. Past roles use past tense.
                Everything is rewritten from your actual resume — nothing invented.
              </p>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !hasAI}
            size="sm"
            className="shrink-0 gap-1.5"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                {optimization ? 'Regenerate' : 'Generate'}
                {hasAI && <Badge variant="default" className="text-[9px]">{providerLabel}</Badge>}
              </>
            )}
          </Button>
        </div>

        {!hasAI && (
          <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Configure an AI provider in the sidebar to enable LinkedIn optimization.
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {!hasExperience && !optimization && (
          <div className="mt-4 text-xs text-slate-500 bg-[#22263a] rounded-lg px-3 py-2">
            No experience entries detected in your resume. The optimized job descriptions section will be empty.
            If you have experience, try re-uploading with a cleaner format.
          </div>
        )}
      </div>

      {/* Output sections */}
      {optimization && (
        <div className="space-y-4">

          {/* Headline */}
          <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl overflow-hidden">
            <button
              onClick={() => setHeadlineOpen(o => !o)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#22263a] transition-colors"
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-slate-200">Headline</span>
                <span className="ml-2 text-xs text-slate-600">· ≤220 characters</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {optimization.headline && <CopyButton text={optimization.headline} />}
                {headlineOpen ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
            </button>
            {headlineOpen && (
              <div className="px-4 pb-4 border-t border-[#2e3347]">
                <p className="mt-3 text-base font-medium text-slate-100 leading-snug">
                  {optimization.headline || <span className="text-slate-600 italic">No headline generated.</span>}
                </p>
                {optimization.headline && (
                  <div className="flex items-center justify-between mt-2">
                    <CharCount text={optimization.headline} max={220} warn={200} />
                    <span className="text-[10px] text-slate-600">keyword-rich · no buzzwords</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* About */}
          <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl overflow-hidden">
            <button
              onClick={() => setAboutOpen(o => !o)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#22263a] transition-colors"
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
                <AlignLeft className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-slate-200">About Section</span>
                <span className="ml-2 text-xs text-slate-600">· first person · ≤2,600 chars</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {optimization.about && <CopyButton text={optimization.about} />}
                {aboutOpen ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
            </button>
            {aboutOpen && (
              <div className="px-4 pb-4 border-t border-[#2e3347]">
                <p className="mt-3 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {optimization.about || <span className="text-slate-600 italic">No About section generated.</span>}
                </p>
                {optimization.about && (
                  <div className="flex items-center justify-between mt-2">
                    <CharCount text={optimization.about} max={2600} warn={2400} />
                    <span className="text-[10px] text-slate-600">first person · human voice</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Per-job descriptions */}
          {optimization.jobs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" />
                Experience Descriptions
                <span className="text-slate-700 font-normal normal-case tracking-normal">
                  · third person · tense matches role status
                </span>
              </h3>
              {optimization.jobs.map((job, i) => (
                <JobCard key={i} job={job} index={i} />
              ))}
            </div>
          )}

          {/* Usage tips */}
          <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">How to use this</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5 flex-shrink-0">1.</span>
                <span>Copy the headline and paste it into your LinkedIn profile's name/headline field.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5 flex-shrink-0">2.</span>
                <span>Copy the About section into your LinkedIn About field. Read it once and adjust anything that doesn't sound like you.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5 flex-shrink-0">3.</span>
                <span>For each job, copy its description into the LinkedIn experience entry's description field.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5 flex-shrink-0">4.</span>
                <span>These are starting points. Edit anything that doesn't feel accurate or natural — you know your own experience better than any AI does.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!optimization && !isLoading && (
        <div className="text-center py-12 text-slate-600">
          <Link2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Click Generate to create optimized LinkedIn content from your resume.</p>
          <p className="text-xs mt-1 opacity-70">
            Works from your resume data — no job description required.
          </p>
        </div>
      )}
    </div>
  )
}
