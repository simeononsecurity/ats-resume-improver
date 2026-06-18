// ─── Provider Definitions ─────────────────────────────────────────────────────

export type AIProvider = 'openai' | 'anthropic' | 'ollama'

export interface AIConfig {
  provider: AIProvider
  apiKey: string       // empty for Ollama
  model: string
  ollamaUrl: string    // default: http://localhost:11434
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4.1-mini',
  ollamaUrl: 'http://localhost:11434',
}

export const PROVIDER_INFO = [
  {
    id: 'openai' as AIProvider,
    label: 'OpenAI',
    keyLabel: 'API Key',
    keyPlaceholder: 'sk-proj-...',
    requiresKey: true,
    helpUrl: 'https://platform.openai.com/api-keys',
    note: 'Cost: ~$0.002–0.05 per resume',
  },
  {
    id: 'anthropic' as AIProvider,
    label: 'Anthropic',
    keyLabel: 'API Key',
    keyPlaceholder: 'sk-ant-api03-...',
    requiresKey: true,
    helpUrl: 'https://console.anthropic.com/settings/keys',
    note: 'Claude models — excellent at following instructions',
  },
  {
    id: 'ollama' as AIProvider,
    label: 'Ollama (Local)',
    keyLabel: 'Base URL',
    keyPlaceholder: 'http://localhost:11434',
    requiresKey: false,
    helpUrl: 'https://ollama.com',
    note: 'Run models locally — set OLLAMA_ORIGINS=* to allow browser access',
  },
]

export const MODELS_BY_PROVIDER: Record<AIProvider, { id: string; label: string; desc: string }[]> = {
  openai: [
    { id: 'gpt-4.1-mini',  label: 'GPT-4.1 mini',   desc: 'Recommended — smartest fast & affordable' },
    { id: 'gpt-4o-mini',   label: 'GPT-4o mini',     desc: 'Fast & affordable classic' },
    { id: 'gpt-4.1',       label: 'GPT-4.1',         desc: 'Latest GPT-4.1 — sharp instruction following' },
    { id: 'gpt-4o',        label: 'GPT-4o',          desc: 'High quality flagship' },
    { id: 'gpt-4-turbo',   label: 'GPT-4 Turbo',     desc: 'High quality, large context' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo',   desc: 'Fastest & cheapest' },
  ],
  anthropic: [
    { id: 'claude-opus-4-5',               label: 'Claude Opus 4.5',       desc: 'Most capable — best for complex tasks' },
    { id: 'claude-sonnet-4-5',             label: 'Claude Sonnet 4.5',     desc: 'Fast & intelligent — recommended' },
    { id: 'claude-haiku-4-5',              label: 'Claude Haiku 4.5',      desc: 'Fastest & cheapest Anthropic model' },
    { id: 'claude-3-5-sonnet-20241022',    label: 'Claude 3.5 Sonnet',     desc: 'Reliable and well-tested' },
    { id: 'claude-3-5-haiku-20241022',     label: 'Claude 3.5 Haiku',      desc: 'Fast and affordable v3.5' },
  ],
  ollama: [
    { id: 'llama3.3',     label: 'Llama 3.3',      desc: 'Latest Meta Llama — recommended' },
    { id: 'llama3.2',     label: 'Llama 3.2',      desc: 'Meta Llama 3.2' },
    { id: 'mistral',      label: 'Mistral 7B',     desc: 'Fast & capable' },
    { id: 'mixtral',      label: 'Mixtral 8x7B',   desc: 'Mixture of experts' },
    { id: 'qwen2.5',      label: 'Qwen 2.5',       desc: 'Alibaba Qwen 2.5' },
    { id: 'deepseek-r1',  label: 'DeepSeek R1',    desc: 'Strong reasoning' },
    { id: 'phi4',         label: 'Phi-4',           desc: 'Microsoft Phi-4' },
    { id: 'gemma3',       label: 'Gemma 3',         desc: 'Google Gemma 3' },
  ],
}

export function getDefaultModel(provider: AIProvider): string {
  return MODELS_BY_PROVIDER[provider][0].id
}

// ─── Unified AI Call ──────────────────────────────────────────────────────────

export async function callAI(
  config: AIConfig,
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.3,
): Promise<string> {
  switch (config.provider) {
    case 'openai':
      return _callOpenAI(config.apiKey, config.model, systemPrompt, userPrompt, temperature)
    case 'anthropic':
      return _callAnthropic(config.apiKey, config.model, systemPrompt, userPrompt, temperature)
    case 'ollama':
      return _callOllama(config.ollamaUrl, config.model, systemPrompt, userPrompt, temperature)
  }
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function _callOpenAI(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  temperature: number,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`OpenAI error: ${(err as { error?: { message?: string } })?.error?.message ?? res.statusText}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// ─── Anthropic ────────────────────────────────────────────────────────────────

async function _callAnthropic(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  temperature: number,
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Anthropic error: ${(err as { error?: { message?: string } })?.error?.message ?? res.statusText}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

// ─── Ollama ───────────────────────────────────────────────────────────────────
// Uses the OpenAI-compatible endpoint (/v1/chat/completions)

async function _callOllama(
  baseUrl: string,
  model: string,
  system: string,
  user: string,
  temperature: number,
): Promise<string> {
  const url = baseUrl.replace(/\/$/, '') + '/v1/chat/completions'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText)
    throw new Error(`Ollama error: ${txt}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}
