import { useState } from 'react'
import {
  MessageSquare, Sparkles, ChevronDown, ChevronUp,
  Lightbulb, AlertTriangle, CheckCircle2, Copy, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { InterviewPrediction, InterviewQuestion, ResumeData, JobDescriptionData } from '@/types'
import type { AIConfig } from '@/lib/aiProvider'

interface Props {
  aiConfig: AIConfig
  resumeData: ResumeData
  jobData: JobDescriptionData | null
  prediction: InterviewPrediction | null
  onGenerated: (result: InterviewPrediction) => void
}

const CATEGORY_COLORS: Record<InterviewQuestion['category'], string> = {
  behavioral:    'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  technical:     'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'role-specific': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'culture-fit': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  situational:   'bg-amber-500/15 text-amber-300 border-amber-500/30',
}

const DIFFICULTY_COLORS: Record<InterviewQuestion['difficulty'], string> = {
  easy:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  hard:   'bg-red-500/15 text-red-400 border-red-500/30',
}

const CATEGORY_ORDER: InterviewQuestion['category'][] = [
  'role-specific', 'technical', 'behavioral', 'situational', 'culture-fit',
]

function fmt(s: string) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function QuestionCard({ q }: { q: InterviewQuestion }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(q.question)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl overflow-hidden transition-all">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#22263a] transition-colors"
      >
        <MessageSquare className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200 leading-snug">{q.question}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[q.category]}`}>
              {fmt(q.category)}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[q.difficulty]}`}>
              {q.difficulty}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); copy() }}
            title="Copy question"
            className="p-1 rounded text-slate-600 hover:text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 border-t border-[#2e3347]">
          <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/20 rounded-lg p-3">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80 leading-relaxed">{q.tip}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function InterviewPredictor({ aiConfig, resumeData, jobData, prediction, onGenerated }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<InterviewQuestion['category'] | 'all'>('all')

  const hasAI = aiConfig.provider === 'ollama' || !!aiConfig.apiKey

  const generate = async () => {
    if (!hasAI) return
    setLoading(true)
    setError(null)
    try {
      const { predictInterviewQuestionsWithAI } = await import('@/lib/openaiService')
      const result = await predictInterviewQuestionsWithAI(aiConfig, resumeData, jobData)
      onGenerated(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate interview questions')
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = prediction?.questions.filter(
    q => activeCategory === 'all' || q.category === activeCategory
  ) ?? []

  const categories = prediction
    ? CATEGORY_ORDER.filter(c => prediction.questions.some(q => q.category === c))
    : []

  if (!prediction) {
    return (
      <div className="space-y-4">
        {!hasAI && (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl text-sm text-amber-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Configure an AI provider (OpenAI, Anthropic, or Ollama) to generate predicted interview questions.</span>
          </div>
        )}
        {!jobData && hasAI && (
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 border border-[#2e3347] rounded-xl text-xs text-slate-400">
            <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
            <span>Add a job description for more targeted, role-specific questions. General questions based on your resume also work great.</span>
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="p-4 rounded-2xl bg-[#1a1d27] border border-[#2e3347]">
            <MessageSquare className="w-10 h-10 text-indigo-400" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-semibold text-slate-200 mb-1">Interview Question Predictor</h3>
            <p className="text-sm text-slate-500 max-w-md">
              AI analyzes your experience and the job requirements to predict the questions most likely to come up in your interview.
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
                Predicting questions...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Predict Interview Questions
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Key Strengths</span>
          </div>
          <ul className="space-y-1">
            {prediction.keyStrengths.map((s, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Focus Areas</span>
          </div>
          <ul className="space-y-1">
            {prediction.focusAreas.map((a, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-amber-500 mt-0.5">•</span>{a}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[#1a1d27] border border-[#2e3347] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Watch Out For</span>
          </div>
          <ul className="space-y-1">
            {prediction.warningAreas.map((w, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-red-400 mt-0.5">•</span>{w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-[#1a1d27] border-[#2e3347] text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({prediction.questions.length})
        </button>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              activeCategory === c
                ? `${CATEGORY_COLORS[c]} font-semibold`
                : 'bg-[#1a1d27] border-[#2e3347] text-slate-400 hover:text-slate-200'
            }`}
          >
            {fmt(c)} ({prediction.questions.filter(q => q.category === c).length})
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-2">
        {filteredQuestions.map((q, i) => (
          <QuestionCard key={i} q={q} />
        ))}
      </div>

      {/* Regenerate */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={generate} disabled={loading} className="gap-2 text-xs">
          {loading
            ? <><div className="w-3 h-3 rounded-full border-2 border-slate-400/30 border-t-slate-400 animate-spin" />Regenerating...</>
            : <><Sparkles className="w-3.5 h-3.5" />Regenerate</>
          }
        </Button>
      </div>
    </div>
  )
}
