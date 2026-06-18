import { useState } from 'react'
import { KeyRound, Eye, EyeOff, ShieldCheck, ExternalLink, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { AVAILABLE_MODELS, DEFAULT_MODEL } from '@/lib/openaiService'

interface ApiKeySetupProps {
  apiKey: string
  onSave: (key: string) => void
  selectedModel?: string
  onModelChange?: (model: string) => void
}

export function ApiKeySetup({ apiKey, onSave, selectedModel = DEFAULT_MODEL, onModelChange }: ApiKeySetupProps) {
  const [value, setValue] = useState(apiKey)
  const [show, setShow] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)

  const handleSave = () => {
    if (value.trim()) onSave(value.trim())
  }

  const isValid = value.startsWith('sk-') && value.length > 20
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) ?? AVAILABLE_MODELS[0]

  return (
    <Card variant="bordered" className="max-w-xl mx-auto">
      <CardHeader>
        <div className="p-2 rounded-lg bg-indigo-600/20">
          <KeyRound className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <CardTitle>OpenAI API Key (Optional)</CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">Required for AI-powered parsing &amp; optimization</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Key input */}
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full bg-[#0f1117] border border-[#2e3347] rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 font-mono"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Model selector — shown when a key is active */}
          {(apiKey || isValid) && onModelChange && (
            <div className="relative">
              <p className="text-xs text-slate-500 mb-1.5">AI Model</p>
              <button
                type="button"
                onClick={() => setModelOpen((o) => !o)}
                className="w-full flex items-center justify-between bg-[#0f1117] border border-[#2e3347] rounded-lg px-3 py-2 text-sm text-slate-200 hover:border-indigo-500/40 transition-colors"
              >
                <span className="flex flex-col items-start">
                  <span className="font-medium">{currentModel.label}</span>
                  <span className="text-xs text-slate-500">{currentModel.desc}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
              </button>

              {modelOpen && (
                <div className="absolute z-50 mt-1 w-full bg-[#1a1d27] border border-[#2e3347] rounded-lg shadow-xl overflow-hidden">
                  {AVAILABLE_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { onModelChange(m.id); setModelOpen(false) }}
                      className={`w-full flex flex-col items-start px-3 py-2.5 text-sm hover:bg-[#242736] transition-colors ${
                        m.id === selectedModel ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : ''
                      }`}
                    >
                      <span className={`font-medium ${m.id === selectedModel ? 'text-indigo-300' : 'text-slate-200'}`}>{m.label}</span>
                      <span className="text-xs text-slate-500">{m.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Stored in memory only — never sent to any server except OpenAI
            </div>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
            >
              Get key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <Button onClick={handleSave} disabled={!isValid} size="sm" className="w-full">
            Save API Key
          </Button>

          {apiKey && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-600/10 border border-emerald-600/20 rounded-lg px-3 py-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              API key active — AI features enabled ({currentModel.label})
            </div>
          )}

          <p className="text-xs text-slate-600 text-center">
            No API key? You can still get ATS analysis and formatting fixes without AI.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
