import { useReducer, useCallback, useState } from 'react'
import {
  Upload, Eye, Briefcase, Hash, Target, Wand2,
  GitCompare, Download, Mail, KeyRound, RotateCcw,
  ChevronRight, Check, Sparkles, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ApiKeySetup } from '@/components/ApiKeySetup'
import { ResumeUpload } from '@/components/ResumeUpload'
import { AtsView } from '@/components/AtsView'
import { JobDescriptionInput } from '@/components/JobDescriptionInput'
import { KeywordAnalysis } from '@/components/KeywordAnalysis'
import { AtsScore } from '@/components/AtsScore'
import { ResumeOptimizer } from '@/components/ResumeOptimizer'
import { DiffViewer } from '@/components/DiffViewer'
import { ExportOptions } from '@/components/ExportOptions'
import { CoverLetterGenerator } from '@/components/CoverLetterGenerator'
import type { AppState, AppStep, ResumeData, JobDescriptionData, OptimizedResume, KeywordAnalysis as KeywordAnalysisType } from '@/types'
import { scoreResume } from '@/lib/atsAnalyzer'
import { analyzeKeywords } from '@/lib/keywordMatcher'
import { parseResumeLocal } from '@/lib/openaiService'
import { DEFAULT_AI_CONFIG } from '@/lib/aiProvider'
import type { AIConfig } from '@/lib/aiProvider'

// ─── State ────────────────────────────────────────────────────────────────────

const initialState: AppState = {
  step: 'upload',
  aiConfig: DEFAULT_AI_CONFIG,
  resumeRawText: '',
  resumeData: null,
  jobDescription: '',
  jobData: null,
  keywordAnalysis: null,
  atsScore: null,
  optimizedResume: null,
  coverLetter: '',
  isLoading: false,
  loadingMessage: '',
  error: null,
}

type Action =
  | { type: 'SET_AI_CONFIG'; payload: AIConfig }
  | { type: 'SET_RESUME'; payload: { rawText: string; fileName: string } }
  | { type: 'SET_RESUME_DATA'; payload: ResumeData }
  | { type: 'SET_JOB_DATA'; payload: JobDescriptionData }
  | { type: 'MERGE_KEYWORD_AI'; payload: Partial<KeywordAnalysisType> }
  | { type: 'SET_OPTIMIZED'; payload: OptimizedResume }
  | { type: 'SET_COVER_LETTER'; payload: string }
  | { type: 'SET_STEP'; payload: AppStep }
  | { type: 'SET_LOADING'; payload: { loading: boolean; message?: string } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_AI_CONFIG':
      return { ...state, aiConfig: action.payload }

    case 'SET_RESUME': {
      const resumeData: ResumeData = parseResumeLocal(action.payload.rawText)
      const atsScore = scoreResume(action.payload.rawText, resumeData, null)
      return {
        ...state,
        resumeRawText: action.payload.rawText,
        resumeData,
        atsScore,
        step: 'ats-view',
        isLoading: false,
        error: null,
      }
    }

    case 'SET_RESUME_DATA':
      return { ...state, resumeData: action.payload }

    case 'SET_JOB_DATA': {
      const keywordAnalysis = analyzeKeywords(state.resumeRawText, action.payload)
      const atsScore = scoreResume(state.resumeRawText, state.resumeData, action.payload)
      return {
        ...state,
        jobData: action.payload,
        jobDescription: action.payload.rawText,
        keywordAnalysis,
        atsScore,
      }
    }

    case 'MERGE_KEYWORD_AI':
      return state.keywordAnalysis
        ? { ...state, keywordAnalysis: { ...state.keywordAnalysis, ...action.payload } }
        : state

    case 'SET_OPTIMIZED':
      return {
        ...state,
        optimizedResume: action.payload,
        resumeData: action.payload.structuredData ?? state.resumeData,
      }

    case 'SET_COVER_LETTER':
      return { ...state, coverLetter: action.payload }

    case 'SET_STEP':
      return { ...state, step: action.payload }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload.loading, loadingMessage: action.payload.message ?? '' }

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }

    case 'RESET':
      return { ...initialState }

    default:
      return state
  }
}

const STEPS: { id: AppStep; label: string; icon: React.ReactNode; requiresResume?: boolean }[] = [
  { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
  { id: 'ats-view', label: 'ATS View', icon: <Eye className="w-4 h-4" />, requiresResume: true },
  { id: 'job-description', label: 'Job', icon: <Briefcase className="w-4 h-4" />, requiresResume: true },
  { id: 'analysis', label: 'Analysis', icon: <Hash className="w-4 h-4" />, requiresResume: true },
  { id: 'optimize', label: 'Optimize', icon: <Wand2 className="w-4 h-4" />, requiresResume: true },
  { id: 'diff', label: 'Diff', icon: <GitCompare className="w-4 h-4" />, requiresResume: true },
  { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" />, requiresResume: true },
]

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [aiKeywordLoading, setAiKeywordLoading] = useState(false)

  const setStep = useCallback((step: AppStep) => {
    dispatch({ type: 'SET_STEP', payload: step })
  }, [])

  // Derived: AI is active if using Ollama (no key needed) or a key is set
  const hasAI = state.aiConfig.provider === 'ollama' || !!state.aiConfig.apiKey

  const handleResumeParsed = useCallback((rawText: string, _fileName: string) => {
    dispatch({ type: 'SET_RESUME', payload: { rawText, fileName: _fileName } })
    if (hasAI) {
      ;(async () => {
        try {
          const { parseResumeWithAI } = await import('@/lib/openaiService')
          const data = await parseResumeWithAI(state.aiConfig, rawText)
          dispatch({ type: 'SET_RESUME_DATA', payload: data })
        } catch { /* silently fail — local parse already ran */ }
      })()
    }
  }, [state.aiConfig, hasAI])

  // Fires after job description is parsed — runs local analysis instantly,
  // then asynchronously enriches it with AI semantic matching when available.
  const handleJobDataAnalyzed = useCallback(async (jd: JobDescriptionData) => {
    dispatch({ type: 'SET_JOB_DATA', payload: jd })
    if (!hasAI) return
    setAiKeywordLoading(true)
    try {
      const { analyzeKeywordsWithAI } = await import('@/lib/keywordMatcher')
      const insights = await analyzeKeywordsWithAI(state.resumeRawText, jd, state.aiConfig)
      dispatch({ type: 'MERGE_KEYWORD_AI', payload: insights })
    } catch {
      // silently fall back to local analysis — user still sees results
    } finally {
      setAiKeywordLoading(false)
    }
  }, [state.resumeRawText, state.aiConfig, hasAI])

  const currentStepIndex = STEPS.findIndex(s => s.id === state.step)
  const hasResume = !!state.resumeRawText

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200 flex flex-col">
      <header className="sticky top-0 z-50 border-b border-[#2e3347] bg-[#0f1117]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
                <Target className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <span className="font-bold text-slate-100">ATS Resume</span>
                <Badge variant="default" className="ml-2 text-[10px]">Match</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasAI ? (
                <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  AI Active
                  <span className="text-emerald-600">
                    ({state.aiConfig.provider === 'ollama' ? '🦙' : state.aiConfig.provider === 'anthropic' ? 'Claude' : 'GPT'})
                  </span>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
                  <KeyRound className="w-3.5 h-3.5" />No AI key
                </div>
              )}
              {hasResume && (
                <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'RESET' })} className="text-xs gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />Start Over
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-1 w-48 shrink-0 sticky top-20 self-start">
            {STEPS.map((step, idx) => {
              const isActive = state.step === step.id
              const isCompleted = idx < currentStepIndex && hasResume
              const isDisabled = step.requiresResume && !hasResume
              return (
                <button
                  key={step.id}
                  onClick={() => !isDisabled && setStep(step.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    isActive ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : isDisabled ? 'text-slate-700 cursor-not-allowed'
                    : isCompleted ? 'text-slate-400 hover:bg-[#1a1d27] hover:text-slate-200'
                    : 'text-slate-500 hover:bg-[#1a1d27] hover:text-slate-300'
                  }`}
                >
                  <div className={`flex-shrink-0 ${isActive ? 'text-indigo-400' : isCompleted ? 'text-emerald-500' : 'text-slate-600'}`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : step.icon}
                  </div>
                  {step.label}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-400" />}
                </button>
              )
            })}
            <div className="mt-4 pt-4 border-t border-[#2e3347]">
              <ApiKeySetup
                aiConfig={state.aiConfig}
                onSave={(config) => dispatch({ type: 'SET_AI_CONFIG', payload: config })}
              />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {/* Mobile tabs */}
            <div className="lg:hidden flex overflow-x-auto gap-1 pb-3 mb-4 scrollbar-none">
              {STEPS.map((step, idx) => {
                const isActive = state.step === step.id
                const isCompleted = idx < currentStepIndex && hasResume
                const isDisabled = step.requiresResume && !hasResume
                return (
                  <button
                    key={step.id}
                    onClick={() => !isDisabled && setStep(step.id)}
                    disabled={isDisabled}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive ? 'bg-indigo-600 text-white'
                      : isDisabled ? 'text-slate-700 bg-[#1a1d27]'
                      : 'text-slate-400 bg-[#1a1d27] hover:text-slate-200'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 text-emerald-400" /> : step.icon}
                    {step.label}
                  </button>
                )
              })}
            </div>

            {/* Upload */}
            {state.step === 'upload' && (
              <StepWrapper title="Upload Your Resume" subtitle="Start by uploading your resume. We'll extract and analyze the text instantly." icon={<Upload className="w-5 h-5 text-indigo-400" />}>
                <div className="lg:hidden mb-6">
                  <ApiKeySetup
                    aiConfig={state.aiConfig}
                    onSave={(config) => dispatch({ type: 'SET_AI_CONFIG', payload: config })}
                  />
                </div>
                <ResumeUpload onParsed={handleResumeParsed} isLoading={state.isLoading} />
                <div className="mt-8 grid sm:grid-cols-3 gap-4">
                  {[
                    { icon: <Sparkles className="w-4 h-4 text-indigo-400" />, title: 'Keyword Gap Analysis', desc: 'See exactly which keywords are missing vs. the job posting' },
                    { icon: <Target className="w-4 h-4 text-amber-400" />, title: 'ATS Scoring', desc: 'Get a real score based on readability, formatting & completeness' },
                    { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, title: 'Privacy First', desc: 'Your resume never touches our servers — 100% client-side' },
                  ].map(f => (
                    <div key={f.title} className="bg-[#1a1d27] border border-[#2e3347] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">{f.icon}<h4 className="text-sm font-medium text-slate-200">{f.title}</h4></div>
                      <p className="text-xs text-slate-500">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* ATS View */}
            {state.step === 'ats-view' && state.resumeRawText && (
              <StepWrapper title="ATS View — What the System Sees" subtitle="This is your resume as an ATS system will parse it. Review section detection and formatting issues." icon={<Eye className="w-5 h-5 text-indigo-400" />} nextStep={() => setStep('job-description')} nextLabel="Add Job Description →">
                <AtsView rawText={state.resumeRawText} resumeData={state.resumeData ?? undefined} />
              </StepWrapper>
            )}

            {/* Job Description */}
            {state.step === 'job-description' && hasResume && (
              <StepWrapper title="Job Description" subtitle="Paste the job posting to unlock keyword gap analysis and targeted optimization." icon={<Briefcase className="w-5 h-5 text-cyan-400" />} nextStep={() => setStep('analysis')} nextLabel="View Analysis →" skipStep={() => setStep('optimize')} skipLabel="Skip to Optimize">
                <JobDescriptionInput aiConfig={state.aiConfig} resumeRawText={state.resumeRawText} onAnalyzed={handleJobDataAnalyzed} jobData={state.jobData} />
              </StepWrapper>
            )}

            {/* Analysis */}
            {state.step === 'analysis' && hasResume && (
              <StepWrapper title="Analysis Dashboard" subtitle="ATS score, keyword gaps, and actionable insights." icon={<Hash className="w-5 h-5 text-amber-400" />} nextStep={() => setStep('optimize')} nextLabel="Optimize Resume →">
                <div className="space-y-6">
                  {state.atsScore && (
                    <section>
                      <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">ATS Score</h3>
                      <AtsScore score={state.atsScore} />
                    </section>
                  )}
                  {state.keywordAnalysis && (
                    <section>
                      <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Keyword Analysis</h3>
                      <KeywordAnalysis analysis={state.keywordAnalysis} isAILoading={aiKeywordLoading} />
                    </section>
                  )}
                  {!state.keywordAnalysis && !state.jobData && (
                    <div className="text-center py-8 text-slate-500">
                      <Hash className="w-8 h-8 mx-auto mb-3 opacity-40" />
                      <p>Add a job description to see keyword gap analysis.</p>
                      <Button variant="secondary" size="sm" className="mt-3" onClick={() => setStep('job-description')}>Add Job Description</Button>
                    </div>
                  )}
                </div>
              </StepWrapper>
            )}

            {/* Optimize */}
            {state.step === 'optimize' && hasResume && state.resumeData && (
              <StepWrapper
                title="Optimize Resume"
                subtitle={hasAI ? `AI-powered optimization (${state.aiConfig.provider === 'ollama' ? '🦙 Ollama' : state.aiConfig.provider === 'anthropic' ? 'Claude' : 'GPT'} · ${state.aiConfig.model})` : 'Deterministic ATS optimization (no AI configured)'}
                icon={<Wand2 className="w-5 h-5 text-indigo-400" />}
                nextStep={state.optimizedResume ? () => setStep('diff') : undefined}
                nextLabel="View Changes →"
              >
                <ResumeOptimizer aiConfig={state.aiConfig} resumeData={state.resumeData} jobData={state.jobData} keywordAnalysis={state.keywordAnalysis} optimizedResume={state.optimizedResume} onOptimized={result => dispatch({ type: 'SET_OPTIMIZED', payload: result })} />
              </StepWrapper>
            )}

            {/* Diff */}
            {state.step === 'diff' && state.optimizedResume && (
              <StepWrapper title="Before / After Comparison" subtitle="Review every change made to your resume." icon={<GitCompare className="w-5 h-5 text-indigo-400" />} nextStep={() => setStep('export')} nextLabel="Export Resume →">
                <DiffViewer
                  original={state.resumeRawText}
                  optimized={state.optimizedResume}
                  aiConfig={hasAI ? state.aiConfig : undefined}
                  resumeData={state.resumeData ?? undefined}
                />
              </StepWrapper>
            )}

            {/* Export */}
            {state.step === 'export' && state.optimizedResume && state.resumeData && (
              <StepWrapper title="Export" subtitle="Download your optimized resume in your preferred format." icon={<Download className="w-5 h-5 text-indigo-400" />}>
                <div className="space-y-8">
                  <ExportOptions
                    optimizedResume={state.optimizedResume}
                    resumeData={state.resumeData}
                    aiConfig={hasAI ? state.aiConfig : undefined}
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Mail className="w-4 h-4" />Cover Letter
                    </h3>
                    <CoverLetterGenerator aiConfig={state.aiConfig} resumeData={state.resumeData} jobData={state.jobData} coverLetter={state.coverLetter} onGenerated={letter => dispatch({ type: 'SET_COVER_LETTER', payload: letter })} />
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Guards */}
            {state.step !== 'upload' && !hasResume && (
              <div className="text-center py-16">
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                <p className="text-slate-500 mb-4">Please upload your resume first.</p>
                <Button onClick={() => setStep('upload')}>Upload Resume</Button>
              </div>
            )}
            {state.step === 'diff' && !state.optimizedResume && hasResume && (
              <div className="text-center py-16">
                <Wand2 className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                <p className="text-slate-500 mb-4">Optimize your resume first to see the diff.</p>
                <Button onClick={() => setStep('optimize')}>Go to Optimizer</Button>
              </div>
            )}
            {state.step === 'export' && (!state.optimizedResume || !state.resumeData) && hasResume && (
              <div className="text-center py-16">
                <Download className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                <p className="text-slate-500 mb-4">Optimize your resume first to export it.</p>
                <Button onClick={() => setStep('optimize')}>Go to Optimizer</Button>
              </div>
            )}
          </main>
        </div>
      </div>

      <footer className="border-t border-[#2e3347] py-4 px-6 text-center text-xs text-slate-700">
        ATS Resume Match — 100% client-side • Your data never leaves your browser •{' '}
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-400">
          Self-host on GitHub Pages
        </a>
      </footer>
    </div>
  )
}

interface StepWrapperProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  children: React.ReactNode
  nextStep?: () => void
  nextLabel?: string
  skipStep?: () => void
  skipLabel?: string
}

function StepWrapper({ title, subtitle, icon, children, nextStep, nextLabel, skipStep, skipLabel }: StepWrapperProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#1a1d27] border border-[#2e3347] mt-0.5">{icon}</div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        {(nextStep || skipStep) && (
          <div className="flex items-center gap-2 shrink-0">
            {skipStep && <Button variant="ghost" size="sm" onClick={skipStep}>{skipLabel ?? 'Skip'}</Button>}
            {nextStep && <Button size="sm" onClick={nextStep}>{nextLabel ?? 'Next →'}</Button>}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
