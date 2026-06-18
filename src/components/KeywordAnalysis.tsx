import { CheckCircle2, XCircle, Link2, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import type { KeywordAnalysis as KeywordAnalysisType } from '@/types'

interface KeywordAnalysisProps {
  analysis: KeywordAnalysisType
}

export function KeywordAnalysis({ analysis }: KeywordAnalysisProps) {
  const { matching, missing, related, coveragePercent } = analysis

  const coverageColor = coveragePercent >= 80 ? 'emerald' : coveragePercent >= 50 ? 'amber' : 'red'

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Coverage score */}
      <Card variant="bordered" className={`border-${coverageColor}-500/30`}>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-200">Keyword Coverage</p>
              <p className="text-xs text-slate-500">How well your resume matches the job description</p>
            </div>
            <div className={`text-3xl font-bold text-${coverageColor === 'emerald' ? 'emerald' : coverageColor === 'amber' ? 'amber' : 'red'}-400`}>
              {coveragePercent}%
            </div>
          </div>
          <Progress value={coveragePercent} size="lg" />
          <p className="text-xs text-slate-500 mt-2">
            {matching.length} of {matching.length + missing.length} keywords matched
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Matching */}
        <Card>
          <CardHeader>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <CardTitle className="text-emerald-300">Matching Keywords ({matching.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {matching.length === 0 ? (
              <p className="text-sm text-slate-600 italic">No matching keywords found.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {matching.map(kw => (
                  <Badge key={kw} variant="success">
                    <CheckCircle2 className="w-3 h-3" />
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Missing */}
        <Card>
          <CardHeader>
            <XCircle className="w-4 h-4 text-red-400" />
            <CardTitle className="text-red-300">Missing Keywords ({missing.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {missing.length === 0 ? (
              <p className="text-sm text-emerald-400">🎉 All keywords found!</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {missing.map(kw => (
                  <Badge key={kw} variant="danger">
                    <XCircle className="w-3 h-3" />
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Related skills */}
      {related.length > 0 && (
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

      {/* Tips */}
      {missing.length > 0 && (
        <Card variant="bordered" className="border-indigo-500/30">
          <CardHeader>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <CardTitle>How to Fix Missing Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-300">
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
                Use the AI Optimizer below to automatically weave in keywords from your existing experience.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">4.</span>
                Never add keywords for skills you don't actually have — this will fail technical interviews.
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
