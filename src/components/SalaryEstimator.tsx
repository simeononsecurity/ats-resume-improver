import { useState } from 'react'
import { DollarSign, Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { SalaryEstimate, ResumeData, JobDescriptionData } from '@/types'
import type { AIConfig } from '@/lib/aiProvider'

interface Props {
  aiConfig: AIConfig
  resumeData: ResumeData
  jobData: JobDescriptionData | null
  estimate: SalaryEstimate | null
  onGenerated: (result: SalaryEstimate) => void
  onPendingChange?: (pending: boolean) => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function RangeBar({ low, median, high }: { low: number; median: number; high: number }) {
  const total = high - low
  const medianPct = total > 0 ? ((median - low) / total) * 100 : 50

  return (
    <div className="relative">
      {/* Track */}
      <div className="h-2 rounded-full bg-gradient-to-r from-slate-700 via-indigo-500 to-emerald-500 relative">
        {/* Median marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-indigo-400 shadow"
          style={{ left: `${medianPct}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-slate-500">{fmt(low)}</span>
        <span className="text-xs text-indigo-300 font-medium">{fmt(median)} median</span>
        <span className="text-xs text-slate-500">{fmt(high)}</span>
      </div>
    </div>
  )
}

export function SalaryEstimator({ aiConfig, resumeData, jobData, estimate, onGenerated, onPendingChange }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasAI = aiConfig.provider === 'ollama' || !!aiConfig.apiKey

  const generate = async () => {
    if (!hasAI) return
    setLoading(true)
    onPendingChange?.(true)
    setError(null)
    try {
      const { estimateSalaryWithAI } = await import('@/lib/openaiService')
      const result = await estimateSalaryWithAI(aiConfig, resumeData, jobData)
      onGenerated(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to estimate salary')
    } finally {
      setLoading(false)
      onPendingChange?.(false)
    }
  }

  if (!estimate) {
    return (
      <div className="space-y-4">
        {!hasAI && (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl text-sm text-amber-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Configure an AI provider (OpenAI, Anthropic, or Ollama) to estimate salary ranges.</span>
          </div>
        )}
        {!jobData && hasAI && (
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 border border-[#2e3347] rounded-xl text-xs text-slate-400">
            <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
            <span>Add a job description for a more accurate, role-specific salary estimate. General estimates based on your experience level also work.</span>
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="p-4 rounded-2xl bg-[#1a1d27] border border-[#2e3347]">
            <DollarSign className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-semibold text-slate-200 mb-1">Salary Range Estimator</h3>
            <p className="text-sm text-slate-500 max-w-md">
              AI estimates realistic market salary ranges based on your experience, skills, and the target role — with negotiation tips.
            </p>
          </div>
          {error && <p className="text-sm text-red-400 text-center max-w-md">{error}</p>}
          <Button
            onClick={generate}
            disabled={!hasAI || loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Estimating salary...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Estimate Salary Range
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header meta */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-medium">
          {estimate.experienceLevel}
        </span>
        <span className="text-xs text-slate-500">{estimate.location}</span>
      </div>

      {/* Salary ranges */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Base salary */}
        <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-slate-200">Base Salary</span>
          </div>
          <div className="text-3xl font-bold text-emerald-300 mb-1">
            {fmt(estimate.base.median)}
          </div>
          <div className="text-xs text-slate-500 mb-4">estimated median</div>
          <RangeBar low={estimate.base.low} median={estimate.base.median} high={estimate.base.high} />
        </div>

        {/* Total compensation */}
        <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-200">Total Compensation</span>
          </div>
          <div className="text-3xl font-bold text-indigo-300 mb-1">
            {fmt(estimate.totalComp.median)}
          </div>
          <div className="text-xs text-slate-500 mb-4">base + bonus + equity</div>
          <RangeBar low={estimate.totalComp.low} median={estimate.totalComp.median} high={estimate.totalComp.high} />
        </div>
      </div>

      {/* Compensaiton factors */}
      {estimate.factors.length > 0 && (
        <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl p-5">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Compensation Factors</h4>
          <div className="space-y-3">
            {estimate.factors.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`flex-shrink-0 mt-0.5 ${
                  f.impact === 'positive' ? 'text-emerald-400'
                  : f.impact === 'negative' ? 'text-red-400'
                  : 'text-slate-500'
                }`}>
                  {f.impact === 'positive' ? <TrendingUp className="w-4 h-4" />
                  : f.impact === 'negative' ? <TrendingDown className="w-4 h-4" />
                  : <Minus className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{f.factor}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                      f.impact === 'positive' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : f.impact === 'negative' ? 'bg-red-500/15 text-red-400 border-red-500/30'
                      : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                    }`}>
                      {f.impact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{f.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Negotiation tips */}
      {estimate.negotiationTips.length > 0 && (
        <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Negotiation Tips</h4>
          </div>
          <ul className="space-y-2">
            {estimate.negotiationTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="text-amber-500 font-bold text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-[#2e3347]">
        <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">{estimate.disclaimer}</p>
      </div>

      {/* Regenerate */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={generate} disabled={loading} className="gap-2 text-xs">
          {loading
            ? <><div className="w-3 h-3 rounded-full border-2 border-slate-400/30 border-t-slate-400 animate-spin" />Regenerating...</>
            : <><Sparkles className="w-3.5 h-3.5" />Recalculate</>
          }
        </Button>
      </div>
    </div>
  )
}
