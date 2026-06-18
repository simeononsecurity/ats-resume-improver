import { CheckCircle2, XCircle, Link2, TrendingUp, Sparkles, Loader2, AlertCircle, Info } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import type { KeywordAnalysis as KeywordAnalysisType, AIKeywordMatch, AIKeywordMissing } from '@/types'

interface KeywordAnalysisProps {
  analysis: KeywordAnalysisType
  isAILoading?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const strengthConfig = {
  strong:   { label: 'Strong',   className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  moderate: { label: 'Moderate', className: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' },
  weak:     { label: 'Partial',  className: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30' },
}

const importanceConfig = {
  critical: { label: 'Critical', dotClass: 'bg-red-400',    badgeClass: 'bg-red-500/15 text-red-300 border border-red-500/30' },
  high:     { label: 'High',     dotClass: 'bg-orange-400', badgeClass: 'bg-orange-500/15 text-orange-300 border border-orange-500/30' },
  medium:   { label: 'Medium',   dotClass: 'bg-yellow-400', badgeClass: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30' },
  low:      { label: 'Low',      dotClass: 'bg-slate-500',  badgeClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/30' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KeywordAnalysis({ analysis, isAILoading = false }: KeywordAnalysisProps) {
  const { matching, missing, related, coveragePercent } = analysis

  const hasAIData = !!(analysis.aiMatching || analysis.aiMissing)
  const displayCoverage = analysis.aiCoveragePercent ?? coveragePercent
  const coverageColor = displayCoverage >= 80 ? 'emerald' : displayCoverage >= 50 ? 'amber' : 'red'

  // Use AI lists when available, else fall back to simple string lists
  const displayMatching: AIKeywordMatch[] = hasAIData && analysis.aiMatching
    ? analysis.aiMatching
    : matching.map(k => ({ keyword: k, context: '', strength: 'strong' as const }))

  const displayMissing: AIKeywordMissing[] = hasAIData && analysis.aiMissing
    ? analysis.aiMissing
    : missing.map(k => ({ keyword: k, importance: 'medium' as const, suggestion: '' }))

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Coverage score ─────────────────────────────────────────────────── */}
      <Card variant="bordered" className={`border-${coverageColor}-500/30`}>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-200">Keyword Coverage</p>
                {hasAIData && !isAILoading && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    <Sparkles className="w-2.5 h-2.5" />AI
                  </span>
                )}
                {isAILoading && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />Analyzing…
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {hasAIData ? 'Semantic AI match — goes beyond exact keyword strings' : 'How well your resume matches the job description'}
              </p>
            </div>
            <div className={`text-3xl font-bold text-${coverageColor === 'emerald' ? 'emerald' : coverageColor === 'amber' ? 'amber' : 'red'}-400`}>
              {displayCoverage}%
            </div>
          </div>
          <Progress value={displayCoverage} size="lg" />
          <p className="text-xs text-slate-500 mt-2">
            {displayMatching.length} matched · {displayMissing.length} missing
            {!hasAIData && !isAILoading && (
              <span className="ml-2 text-slate-600">(add an AI key for semantic analysis)</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* ── AI Summary ─────────────────────────────────────────────────────── */}
      {analysis.aiSummary && (
        <Card variant="bordered" className="border-indigo-500/30 bg-indigo-500/5">
          <CardContent>
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-300 leading-relaxed">{analysis.aiSummary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Loading skeleton ───────────────────────────────────────────────── */}
      {isAILoading && (
        <Card variant="bordered" className="border-slate-700">
          <CardContent>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
              <span>AI is performing semantic keyword analysis… results will appear shortly.</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* ── Matching ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <CardTitle className="text-emerald-300">
              {hasAIData ? 'AI-Detected Matches' : 'Matching Keywords'} ({displayMatching.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayMatching.length === 0 ? (
              <p className="text-sm text-slate-600 italic">No matching keywords found.</p>
            ) : hasAIData ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {displayMatching.map((m, i) => {
                  const cfg = strengthConfig[m.strength] ?? strengthConfig.strong
                  return (
                    <div key={`${m.keyword}-${i}`} className="flex items-start gap-2 group">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm text-slate-200 font-medium">{m.keyword}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.className}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {m.context && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{m.context}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {displayMatching.map(m => (
                  <Badge key={m.keyword} variant="success">
                    <CheckCircle2 className="w-3 h-3" />
                    {m.keyword}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Missing ──────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <XCircle className="w-4 h-4 text-red-400" />
            <CardTitle className="text-red-300">
              {hasAIData ? 'AI-Detected Gaps' : 'Missing Keywords'} ({displayMissing.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayMissing.length === 0 ? (
              <p className="text-sm text-emerald-400">🎉 All keywords found!</p>
            ) : hasAIData ? (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {displayMissing.map((m, i) => {
                  const cfg = importanceConfig[m.importance] ?? importanceConfig.medium
                  return (
                    <div key={`${m.keyword}-${i}`} className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dotClass}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm text-slate-200 font-medium">{m.keyword}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.badgeClass}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {m.suggestion && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{m.suggestion}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {displayMissing.map(m => (
                  <Badge key={m.keyword} variant="danger">
                    <XCircle className="w-3 h-3" />
                    {m.keyword}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Related skills (local) ─────────────────────────────────────────── */}
      {!hasAIData && related.length > 0 && (
        <Card>
          <CardHeader>
            <Link2 className="w-4 h-4 text-cyan-400" />
            <CardTitle className="text-cyan-300">Related Skills Found in Resume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-3">
              Your resume has these related skills that may compensate for missing keywords:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {related.map(kw => (
                <Badge key={kw} variant="info">
                  <Link2 className="w-3 h-3" />
                  {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Importance legend (AI mode) ────────────────────────────────────── */}
      {hasAIData && displayMissing.length > 0 && (
        <Card variant="bordered" className="border-slate-700">
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-500">Importance legend</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              {(Object.entries(importanceConfig) as [keyof typeof importanceConfig, typeof importanceConfig[keyof typeof importanceConfig]][]).map(([key, cfg]) => (
                <span key={key} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full inline-block ${cfg.dotClass}`} />
                  {cfg.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tips ──────────────────────────────────────────────────────────── */}
      {displayMissing.length > 0 && (
        <Card variant="bordered" className="border-indigo-500/30">
          <CardHeader>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <CardTitle>How to Fix Missing Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-300">
              {hasAIData && (
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">💡</span>
                  Focus on <strong className="text-white">Critical</strong> and <strong className="text-white">High</strong> importance gaps first — these are likely required skills.
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">1.</span>
                Add missing keywords to your Skills section if you genuinely have experience with them.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">2.</span>
                Naturally incorporate keywords into existing experience bullet points where relevant.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">3.</span>
                Use the AI Optimizer to automatically weave in keywords from your existing experience.
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                Never add keywords for skills you don't actually have — this will fail technical interviews.
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
