import { ShieldCheck, AlertTriangle, Info, Target, Eye, Hash, BookOpen, Layout } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import type { AtsScore as AtsScoreType } from '@/types'

interface AtsScoreProps {
  score: AtsScoreType
}

const getScoreColor = (val: number) => {
  if (val >= 80) return 'text-emerald-400'
  if (val >= 60) return 'text-indigo-400'
  if (val >= 40) return 'text-amber-400'
  return 'text-red-400'
}

const getScoreLabel = (val: number) => {
  if (val >= 85) return 'Excellent'
  if (val >= 70) return 'Good'
  if (val >= 55) return 'Fair'
  if (val >= 40) return 'Needs Work'
  return 'Poor'
}

export function AtsScore({ score }: AtsScoreProps) {
  const dimensions = [
    { key: 'readability', label: 'ATS Readability', icon: Eye, weight: '30%' },
    { key: 'keywordMatch', label: 'Keyword Match', icon: Hash, weight: '30%' },
    { key: 'skillsMatch', label: 'Skills Match', icon: Target, weight: '20%' },
    { key: 'completeness', label: 'Completeness', icon: BookOpen, weight: '10%' },
    { key: 'formatting', label: 'Formatting', icon: Layout, weight: '10%' },
  ] as const

  const errorCount = score.issues.filter(i => i.type === 'error').length
  const warnCount = score.issues.filter(i => i.type === 'warning').length
  const infoCount = score.issues.filter(i => i.type === 'info').length

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Overall score */}
      <Card variant="bordered" className={score.overall >= 70 ? 'border-emerald-500/30' : 'border-amber-500/30'}>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="#1a1d27"
                  strokeWidth="10"
                />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={score.overall >= 80 ? '#10b981' : score.overall >= 60 ? '#6366f1' : score.overall >= 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${(score.overall / 100) * 264} 264`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(score.overall)}`}>{score.overall}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-xl font-bold ${getScoreColor(score.overall)}`}>
                  {getScoreLabel(score.overall)}
                </h3>
                <Badge variant={score.overall >= 70 ? 'success' : score.overall >= 50 ? 'warning' : 'danger'}>
                  ATS Score
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                {score.overall >= 80
                  ? 'Your resume is well-optimized for ATS systems.'
                  : score.overall >= 60
                  ? 'Your resume passes most ATS checks with room to improve.'
                  : 'Your resume needs optimization to pass ATS screening.'}
              </p>
              <div className="flex gap-3">
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errorCount} error{errorCount > 1 ? 's' : ''}
                  </span>
                )}
                {warnCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" /> {warnCount} warning{warnCount > 1 ? 's' : ''}
                  </span>
                )}
                {infoCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-cyan-400">
                    <Info className="w-3.5 h-3.5" /> {infoCount} suggestion{infoCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dimensions.map(({ key, label, icon: Icon, weight }) => {
              const val = score[key]
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm text-slate-300">{label}</span>
                      <Badge variant="muted" className="text-[10px] py-0">{weight}</Badge>
                    </div>
                    <span className={`text-sm font-semibold ${getScoreColor(val)}`}>{val}%</span>
                  </div>
                  <Progress value={val} size="sm" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      {score.issues.length > 0 && (
        <Card>
          <CardHeader>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <CardTitle>Issues Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {score.issues.map((issue, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm ${
                    issue.type === 'error'
                      ? 'bg-red-600/10 border border-red-500/20 text-red-300'
                      : issue.type === 'warning'
                      ? 'bg-amber-600/10 border border-amber-500/20 text-amber-300'
                      : 'bg-cyan-600/10 border border-cyan-500/20 text-cyan-300'
                  }`}
                >
                  {issue.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : issue.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <span className="font-medium">{issue.category}: </span>
                    {issue.message}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
