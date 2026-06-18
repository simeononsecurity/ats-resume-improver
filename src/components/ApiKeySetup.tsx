import { useState } from 'react'
import { KeyRound, Eye, EyeOff, ShieldCheck, ExternalLink, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import type { AIConfig, AIProvider } from '@/lib/aiProvider'
import { PROVIDER_INFO, MODELS_BY_PROVIDER, getDefaultModel } from '@/lib/aiProvider'

interface ApiKeySetupProps {
  aiConfig: AIConfig
  onSave: (config: AIConfig) => void
}

export function ApiKeySetup({ aiConfig, onSave }: ApiKeySetupProps) {
  const [provider, setProvider] = useState<AIProvider>(aiConfig.provider)
  const [apiKey, setApiKey] = useState(aiConfig.apiKey)
  const [model, setModel] = useState(aiConfig.model)
  const [ollamaUrl, setOllamaUrl] = useState(aiConfig.ollamaUrl)
  const [customModel, setCustomModel] = useState('')
  const [show, setShow] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)

  const info = PROVIDER_INFO.find((p) => p.id === provider)!
  const models = MODELS_BY_PROVIDER[provider]
  const currentModel = models.find((m) => m.id === model) ?? models[0]

  const handleProviderChange = (p: AIProvider) => {
    setProvider(p)
    setModel(getDefaultModel(p))
    setApiKey('')
    setCustomModel('')
    setModelOpen(false)
    setShow(false)
  }

  const isValid = () => {
    if (provider === 'ollama') return true
    return apiKey.startsWith('sk-') && apiKey.length > 20
  }

  const handleSave = () => {
    const effectiveModel =
      provider === 'ollama' && customModel.trim() ? customModel.trim() : model
    onSave({
      provider,
      apiKey: provider === 'ollama' ? '' : apiKey.trim(),
      model: effectiveModel,
      ollamaUrl:
        provider === 'ollama'
          ? ollamaUrl.trim() || 'http://localhost:11434'
          : aiConfig.ollamaUrl,
    })
  }

  const savedIsActive =
    aiConfig.provider === 'ollama' || !!aiConfig.apiKey

  return (
    <Card variant="bordered" className="max-w-xl mx-auto">
      <CardHeader>
        <div className="p-2 rounded-lg bg-indigo-600/20">
          <KeyRound className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <CardTitle>AI Provider (Optional)</CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">OpenAI · Anthropic · Ollama (local)</p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Provider tabs */}
          <div className="flex gap-1 bg-[#0f1117] border border-[#2e3347] rounded-xl p-1">
            {PROVIDER_INFO.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProviderChange(p.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  provider === p.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {p.id === 'ollama' ? '🦙 Ollama' : p.label}
              </button>
            ))}
          </div>

          {/* Provider note */}
          <p className="text-xs text-slate-600">{info.note}</p>

          {/* Key / URL input */}
          {provider === 'ollama' ? (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Ollama Base URL</p>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full bg-[#0f1117] border border-[#2e3347] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 font-mono"
              />
              <p className="text-xs text-amber-500/70 mt-1.5">
                ⚠️ Set{' '}
                <code className="bg-[#0f1117] border border-[#2e3347] px-1 rounded text-amber-400">
                  OLLAMA_ORIGINS=*
                </code>{' '}
                on your Ollama server to allow browser access
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">{info.keyLabel}</p>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={info.keyPlaceholder}
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
            </div>
          )}

          {/* Model selector */}
          <div className="relative">
            <p className="text-xs text-slate-500 mb-1.5">Model</p>
            <button
              type="button"
              onClick={() => setModelOpen((o) => !o)}
              className="w-full flex items-center justify-between bg-[#0f1117] border border-[#2e3347] rounded-lg px-3 py-2 text-sm text-slate-200 hover:border-indigo-500/40 transition-colors"
            >
              <span className="flex flex-col items-start">
                <span className="font-medium">{currentModel.label}</span>
                <span className="text-xs text-slate-500">{currentModel.desc}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${modelOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {modelOpen && (
              <div className="absolute z-50 mt-1 w-full bg-[#1a1d27] border border-[#2e3347] rounded-lg shadow-xl overflow-hidden">
                {models.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setModel(m.id)
                      setModelOpen(false)
                    }}
                    className={`w-full flex flex-col items-start px-3 py-2.5 text-sm hover:bg-[#242736] transition-colors ${
                      m.id === model ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : ''
                    }`}
                  >
                    <span
                      className={`font-medium ${m.id === model ? 'text-indigo-300' : 'text-slate-200'}`}
                    >
                      {m.label}
                    </span>
                    <span className="text-xs text-slate-500">{m.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom model override for Ollama */}
          {provider === 'ollama' && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">
                Custom Model{' '}
                <span className="text-slate-600">(optional — overrides dropdown)</span>
              </p>
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. llama3.2:latest or qwen2.5:14b"
                className="w-full bg-[#0f1117] border border-[#2e3347] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 font-mono"
              />
            </div>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Stored in memory only — never logged
            </div>
            <a
              href={info.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
            >
              {provider === 'ollama' ? 'Get Ollama' : 'Get key'}{' '}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <Button
            onClick={handleSave}
            disabled={provider !== 'ollama' && !isValid()}
            size="sm"
            className="w-full"
          >
            {provider === 'ollama' ? 'Save Ollama Settings' : `Save ${info.label} Key`}
          </Button>

          {/* Active status */}
          {savedIsActive ? (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-600/10 border border-emerald-600/20 rounded-lg px-3 py-2">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {aiConfig.provider === 'ollama'
                  ? `Ollama active — ${aiConfig.model} @ ${aiConfig.ollamaUrl}`
                  : `${aiConfig.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} active — ${aiConfig.model}`}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-600 text-center">
              No AI configured. ATS analysis and formatting fixes still work without AI.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
