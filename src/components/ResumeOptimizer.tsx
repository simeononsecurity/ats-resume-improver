import { useState } from 'react'
import { Wand2, Zap, CheckCircle, ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { ResumeData, JobDescriptionData, OptimizedResume, KeywordAnalysis, OptimizationOptions } from '@/types'
import { DEFAULT_OPTIMIZATION_OPTIONS } from '@/types'
import type { AIConfig } from '@/lib/aiProvider'

interface ResumeOptimizerProps {
  aiConfig: AIConfig
  resumeData: ResumeData
  jobData: JobDescriptionData | null
  keywordAnalysis: KeywordAnalysis | null
  optimizedResume: OptimizedResume | null
  onOptimized: (result: OptimizedResume) => void
  onPendingChange?: (pending: boolean) => void
}

export function ResumeOptimizer({
  aiConfig,
  resumeData,
  jobData,
  keywordAnalysis,
  optimizedResume,
  onOptimized,
  onPendingChange,
}: ResumeOptimizerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showChanges, setShowChanges] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [options, setOptions] = useState<OptimizationOptions>({ ...DEFAULT_OPTIMIZATION_OPTIONS })

  const hasAI = aiConfig.provider === 'ollama' || !!aiConfig.apiKey

  const providerLabel =
    aiConfig.provider === 'ollama'
      ? '🦙 Ollama'
      : aiConfig.provider === 'anthropic'
      ? 'Claude'
      : 'GPT'

  const toggleOption = (key: keyof OptimizationOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleOptimize = async () => {
    setError('')
    setIsLoading(true)
    onPendingChange?.(true)
    try {
      const missingKeywords = keywordAnalysis?.missing ?? []
      if (hasAI) {
        const { optimizeResumeWithAI } = await import('@/lib/openaiService')
        const result = await optimizeResumeWithAI(aiConfig, resumeData, jobData, missingKeywords, options)
        onOptimized(result)
      } else {
        const { optimizeResumeLocal } = await import('@/lib/openaiService')
        const result = optimizeResumeLocal(resumeData, missingKeywords, options)
        onOptimized(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed.')
    } finally {
      setIsLoading(false)
      onPendingChange?.(false)
    }
  }

  const OPTION_LABELS: { key: keyof OptimizationOptions; label: string; description: string }[] = [
    { key: 'rewriteSummary', label: 'Rewrite Professional Summary', description: 'AI rewrites your summary to target the specific role' },
    { key: 'improveBullets', label: 'Improve Bullet Points', description: 'Strengthen action verbs and apply CAR method formatting' },
    { key: 'integrateKeywords', label: 'Integrate Missing Keywords', description: 'Naturally weave job description keywords into your experience' },
    { key: 'includeSkillsSection', label: 'Include Skills Section', description: 'Include a dedicated skills section in the output' },
    { key: 'includeProjectsSection', label: 'Include Projects Section', description: 'Preserve and include your projects section' },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      {/* CTA card */}
      {!optimizedResume && (
        <Card variant="bordered" className="border-indigo-500/30">
          <CardContent>
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
                {hasAI ? (
                  <Wand2 className="w-8 h-8 text-indigo-400" />
                ) : (
                  <Zap className="w-8 h-8 text-amber-400" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">
                  {hasAI ? `AI-Powered Resume Optimization (${providerLabel})` : 'Deterministic ATS Optimization'}
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  {hasAI
                    ? `${providerLabel} will analyze your resume, fix weak bullet points, incorporate missing keywords naturally, and generate both an ATS-friendly and tailored version.`
                    : "Without an AI provider configured, we'll apply deterministic rules: normalize formatting, strengthen action verbs, and structure your resume for ATS compatibility."}
                </p>
              </div>

              {keywordAnalysis && keywordAnalysis.missing.length > 0 && (
                <div className="bg-[#242736] rounded-xl px-4 py-3 inline-block">
                  <p className="text-xs text-slate-500 mb-2">Keywords to incorporate:</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {keywordAnalysis.missing.slice(0, 8).map(kw => (
                      <Badge key={kw} variant="warning">{kw}</Badge>
                    ))}
                    {keywordAnalysis.missing.length > 8 && (
                      <Badge variant="muted">+{keywordAnalysis.missing.length - 8} more</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Options Panel */}
              <div className="max-w-md mx-auto">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors mx-auto"
                >
                  <Settings2 className="w-4 h-4" />
                  {showOptions ? 'Hide' : 'Show'} Optimization Options
                  {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showOptions && (
                  <div className="mt-3 bg-[#1a1d27] border border-[#2e3347] rounded-xl p-4 text-left space-y-3">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">
                      Include in optimization:
                    </p>
                    {OPTION_LABELS.map(({ key, label, description }) => (
                      <label key={key} className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative mt-0.5 flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={options[key]}
                            onChange={() => toggleOption(key)}
                            className="sr-only"
                          />
                          <div
                            onClick={() => toggleOption(key)}
                            className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${
                              options[key] ? 'bg-indigo-600' : 'bg-[#2e3347]'
                            }`}
                          >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              options[key] ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                        <div>
                          <p className={`text-sm font-medium transition-colors ${options[key] ? 'text-slate-200' : 'text-slate-500'}`}>
                            {label}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">{description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-600/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                onClick={handleOptimize}
                loading={isLoading}
                size="lg"
                className="min-w-48"
              >
                {!isLoading && (hasAI ? <Wand2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />)}
                {isLoading
                  ? 'Optimizing...'
                  : hasAI
                  ? `Optimize with ${providerLabel}`
                  : 'Optimize Resume'}
              </Button>

              {!hasAI && (
                <p className="text-xs text-slate-600">
                  Configure an AI provider in the sidebar for AI-powered keyword integration
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {optimizedResume && (
        <>
          <Card variant="bordered" className="border-emerald-500/30 animate-fade-in">
            <CardHeader>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-emerald-300">Optimization Complete!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <StatItem label="Changes Made" value={optimizedResume.changes.length.toString()} color="indigo" />
                <StatItem label="ATS Version" value="Ready" color="emerald" />
                <StatItem label="Tailored Version" value={jobData ? 'Ready' : 'N/A'} color="cyan" />
              </div>

              {optimizedResume.changes.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowChanges(!showChanges)}
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {showChanges ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showChanges ? 'Hide' : 'Show'} {optimizedResume.changes.length} changes
                  </button>

                  {showChanges && (
                    <div className="mt-3 space-y-3">
                      {optimizedResume.changes.map((change, i) => (
                        <div key={i} className="bg-[#0f1117] rounded-xl border border-[#2e3347] p-4 text-sm space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="muted">{change.section}</Badge>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-red-400 mb-1">Before</p>
                              <p className="text-slate-400 bg-red-600/5 border border-red-500/10 rounded-lg px-3 py-2">
                                {change.original}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-emerald-400 mb-1">After</p>
                              <p className="text-slate-200 bg-emerald-600/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                                {change.updated}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 italic">{change.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Options panel for re-optimize */}
          <div className="max-w-full">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              {showOptions ? 'Hide' : 'Adjust'} options before re-optimizing
              {showOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showOptions && (
              <div className="mt-2 bg-[#1a1d27] border border-[#2e3347] rounded-xl p-4 space-y-3">
                {OPTION_LABELS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <div className="relative flex-shrink-0">
                      <div
                        onClick={() => toggleOption(key)}
                        className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${
                          options[key] ? 'bg-indigo-600' : 'bg-[#2e3347]'
                        }`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          options[key] ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                    <p className={`text-sm transition-colors ${options[key] ? 'text-slate-200' : 'text-slate-500'}`}>
                      {label}
                    </p>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleOptimize}
            variant="secondary"
            loading={isLoading}
            size="sm"
            className="w-full"
          >
            <Wand2 className="w-4 h-4" />
            Re-optimize
          </Button>
        </>
      )}
    </div>
  )
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
  }
  return (
    <div className="bg-[#242736] rounded-xl p-3 text-center">
      <p className={`text-xl font-bold ${colorMap[color]}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  )
}
