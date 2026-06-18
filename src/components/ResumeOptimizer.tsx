import { useState } from 'react'
import { Wand2, Zap, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { ResumeData, JobDescriptionData, OptimizedResume, KeywordAnalysis } from '@/types'
import type { AIConfig } from '@/lib/aiProvider'

interface ResumeOptimizerProps {
  aiConfig: AIConfig
  resumeData: ResumeData
  jobData: JobDescriptionData | null
  keywordAnalysis: KeywordAnalysis | null
  optimizedResume: OptimizedResume | null
  onOptimized: (result: OptimizedResume) => void
}

export function ResumeOptimizer({
  aiConfig,
  resumeData,
  jobData,
  keywordAnalysis,
  optimizedResume,
  onOptimized,
}: ResumeOptimizerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showChanges, setShowChanges] = useState(false)

  const hasAI = aiConfig.provider === 'ollama' || !!aiConfig.apiKey

  const providerLabel =
    aiConfig.provider === 'ollama'
      ? '🦙 Ollama'
      : aiConfig.provider === 'anthropic'
      ? 'Claude'
      : 'GPT'

  const handleOptimize = async () => {
    setError('')
    setIsLoading(true)
    try {
      const missingKeywords = keywordAnalysis?.missing ?? []
      if (hasAI) {
        const { optimizeResumeWithAI } = await import('@/lib/openaiService')
        const result = await optimizeResumeWithAI(aiConfig, resumeData, jobData, missingKeywords)
        onOptimized(result)
      } else {
        const { optimizeResumeLocal } = await import('@/lib/openaiService')
        const result = optimizeResumeLocal(resumeData, missingKeywords)
        onOptimized(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed.')
    } finally {
      setIsLoading(false)
    }
  }

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
