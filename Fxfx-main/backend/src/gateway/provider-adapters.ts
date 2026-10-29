export type ProviderId = 'gemini' | 'openai' | 'openrouter' | 'grok'
export type ProviderSelection = ProviderId | 'auto'
export type ProviderLabel = 'Gemini' | 'OpenAI' | 'OpenRouter' | 'Grok'

export interface ProviderCandidate {
  id: ProviderId
  label: ProviderLabel
  apiKey: string
  model: string
}

export class ProviderConfigurationError extends Error {
  readonly code = 'PROVIDER_NOT_CONFIGURED'
  readonly status = 503
}

export interface ProviderModelStatus {
  id: ProviderId
  label: ProviderLabel
  configured: boolean
  models: string[]
}

export interface AdapterResult {
  text: string
  model: string
  latencyMs: number
  promptTokens: number
  completionTokens: number
  usageAvailable: boolean
}

interface ProviderDefinition {
  id: ProviderId
  label: ProviderLabel
  keyEnv: string
  modelEnv: string
  modelsEnv: string
  defaultModel: string
  endpoint?: string
}

const DEFINITIONS: ProviderDefinition[] = [
  { id: 'gemini', label: 'Gemini', keyEnv: 'GEMINI_API_KEY', modelEnv: 'GEMINI_MODEL', modelsEnv: 'GEMINI_MODELS', defaultModel: 'gemini-3.1-flash-lite' },
  { id: 'openai', label: 'OpenAI', keyEnv: 'OPENAI_API_KEY', modelEnv: 'OPENAI_MODEL', modelsEnv: 'OPENAI_MODELS', defaultModel: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1/chat/completions' },
  { id: 'openrouter', label: 'OpenRouter', keyEnv: 'OPENROUTER_API_KEY', modelEnv: 'OPENROUTER_MODEL', modelsEnv: 'OPENROUTER_MODELS', defaultModel: 'openai/gpt-4o-mini', endpoint: 'https://openrouter.ai/api/v1/chat/completions' },
  { id: 'grok', label: 'Grok', keyEnv: 'XAI_API_KEY', modelEnv: 'XAI_MODEL', modelsEnv: 'XAI_MODELS', defaultModel: 'grok-3-mini', endpoint: 'https://api.x.ai/v1/chat/completions' },
]

const DEFINITION_BY_ID = new Map(DEFINITIONS.map(definition => [definition.id, definition]))
const TASK_SUFFIX: Record<string, string> = {
  'candidate-generation': 'CANDIDATE_GENERATION',
  critique: 'CRITIQUE',
  'final-artifact': 'FINAL_ARTIFACT',
  utility: 'UTILITY',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function usableSecret(value: string | undefined): value is string {
  const secret = value?.trim()
  return !!secret && !/^(replace_me|your_|<)/i.test(secret)
}

function modelList(definition: ProviderDefinition): string[] {
  const configured = (process.env[definition.modelsEnv] || '')
    .split(',')
    .map(model => model.trim())
    .filter(Boolean)
  const defaults = [process.env[definition.modelEnv]?.trim(), definition.defaultModel]
  for (const [task, suffix] of Object.entries(TASK_SUFFIX)) {
    defaults.push(process.env[`${definition.id === 'grok' ? 'XAI' : definition.id.toUpperCase()}_MODEL_${suffix}`]?.trim())
  }
  return [...new Set([...configured, ...defaults].filter((model): model is string => !!model))]
}

function modelForTask(definition: ProviderDefinition, task: string): string {
  const suffix = TASK_SUFFIX[task]
  const prefix = definition.id === 'grok' ? 'XAI' : definition.id.toUpperCase()
  return process.env[`${prefix}_MODEL_${suffix}`]?.trim()
    || process.env[definition.modelEnv]?.trim()
    || definition.defaultModel
}

export function getProviderStatus(): ProviderModelStatus[] {
  return DEFINITIONS.map(definition => ({
    id: definition.id,
    label: definition.label,
    configured: usableSecret(process.env[definition.keyEnv]),
    models: modelList(definition),
  }))
}

export function resolveProviderCandidates(
  selection: ProviderSelection | undefined,
  requestedModel: string | undefined,
  task: string,
): ProviderCandidate[] {
  const requested = selection || 'auto'
  if (requested !== 'auto' && !DEFINITION_BY_ID.has(requested)) {
    throw new ProviderConfigurationError(`Unsupported provider: ${String(requested)}.`)
  }
  if (requestedModel !== undefined && (typeof requestedModel !== 'string' || !requestedModel.trim() || requestedModel.length > 200)) {
    throw new Error('Model must be a non-empty string of at most 200 characters.')
  }
  if (requestedModel !== undefined && requested !== 'auto' && !requestedModel.trim()) {
    throw new Error('Model must be a non-empty string.')
  }
  if (requestedModel !== undefined && requested === 'auto') {
    throw new ProviderConfigurationError('Choose a provider before selecting a specific model.')
  }

  const configuredOrder = (process.env.AI_AUTO_PROVIDER_ORDER || 'gemini,openrouter,openai,grok')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
  if (configuredOrder.some(item => !DEFINITION_BY_ID.has(item as ProviderId))) {
    throw new ProviderConfigurationError('AI_AUTO_PROVIDER_ORDER contains an unsupported provider.')
  }
  const order = requested === 'auto'
    ? configuredOrder as ProviderId[]
    : [requested]
  const candidates: ProviderCandidate[] = []

  for (const id of [...new Set(order)]) {
    const definition = DEFINITION_BY_ID.get(id)
    if (!definition) throw new Error(`Unsupported provider: ${String(id)}.`)
    const apiKey = process.env[definition.keyEnv]?.trim()
    if (!usableSecret(apiKey)) {
      if (requested !== 'auto') {
        throw new ProviderConfigurationError(`${definition.label} is not configured. Set ${definition.keyEnv} in the server environment.`)
      }
      continue
    }

    const model = requestedModel || modelForTask(definition, task)
    if (!modelList(definition).includes(model)) {
      throw new ProviderConfigurationError(`Model "${model}" is not enabled for ${definition.label}. Add it to ${definition.modelsEnv} or select a configured model.`)
    }
    candidates.push({ id, label: definition.label, apiKey, model })
  }

  if (!candidates.length) {
    throw new ProviderConfigurationError('No AI provider is configured. Set a server-side provider API key.')
  }
  return candidates
}

export function assertAnyProviderConfigured(): void {
  if (!getProviderStatus().some(provider => provider.configured)) {
    throw new ProviderConfigurationError('No AI provider is configured. Set a server-side provider API key.')
  }
}

export function getProviderCostRates(id: ProviderId): { input: number; output: number } {
  const prefix = id === 'grok' ? 'XAI' : id.toUpperCase()
  const input = Number(process.env[`${prefix}_INPUT_COST_USD_PER_1K`] || (id === 'gemini' ? '0.001' : '0.01'))
  const output = Number(process.env[`${prefix}_OUTPUT_COST_USD_PER_1K`] || (id === 'gemini' ? '0.002' : '0.04'))
  if (!Number.isFinite(input) || input <= 0 || !Number.isFinite(output) || output <= 0) {
    throw new Error(`${prefix} input/output cost estimates must be positive finite USD amounts.`)
  }
  return { input, output }
}

export class ProviderRequestError extends Error {
  constructor(
    readonly provider: ProviderLabel,
    readonly status?: number,
    readonly safeToFallback = false,
    message = `${provider} request failed${status ? ` (HTTP ${status})` : ''}.`,
  ) {
    super(message)
    this.name = 'ProviderRequestError'
  }
}

function validTokenCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined
}

function makeError(provider: ProviderLabel, status: number): ProviderRequestError {
  const safeToFallback = [400, 401, 403, 404, 422].includes(status)
  return new ProviderRequestError(provider, status, safeToFallback)
}

export async function callOpenAICompatible(
  candidate: ProviderCandidate,
  prompt: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  signal: AbortSignal,
): Promise<AdapterResult> {
  const definition = DEFINITION_BY_ID.get(candidate.id)
  if (!definition?.endpoint) throw new ProviderRequestError(candidate.label)
  const headers: Record<string, string> = {
    Authorization: `Bearer ${candidate.apiKey}`,
    'Content-Type': 'application/json',
  }
  if (candidate.id === 'openrouter') {
    headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL || 'https://textfx.local'
    headers['X-Title'] = 'TextFX'
  }

  const startedAt = Date.now()
  let response: Response
  try {
    response = await fetch(definition.endpoint, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        model: candidate.model,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new ProviderRequestError(candidate.label)
  }

  if (!response.ok) {
    await response.body?.cancel().catch(() => {})
    throw makeError(candidate.label, response.status)
  }
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ProviderRequestError(candidate.label, response.status, false, `${candidate.label} returned invalid JSON.`)
  }
  if (!isRecord(payload)) throw new ProviderRequestError(candidate.label, response.status, false, `${candidate.label} returned an invalid response.`)
  const choices = Array.isArray(payload.choices) ? payload.choices : []
  const choice = isRecord(choices[0]) ? choices[0] : undefined
  const message = choice && isRecord(choice.message) ? choice.message : undefined
  const text = message?.content
  const finishReason = choice?.finish_reason
  if (finishReason !== 'stop') {
    if (finishReason === 'length') {
      throw new ProviderRequestError(candidate.label, response.status, false, `${candidate.label} response was truncated at ${maxTokens} output tokens.`)
    }
    const reason = typeof finishReason === 'string' && finishReason ? finishReason : 'unknown'
    throw new ProviderRequestError(candidate.label, response.status, false, `${candidate.label} response was incomplete (finish reason: ${reason}).`)
  }
  if (typeof text !== 'string' || !text.trim()) {
    throw new ProviderRequestError(candidate.label, response.status, false, `${candidate.label} returned no text.`)
  }

  const usage = isRecord(payload.usage) ? payload.usage : {}
  const promptTokens = validTokenCount(usage.prompt_tokens)
  const completionTokens = validTokenCount(usage.completion_tokens)
  return {
    text,
    model: typeof payload.model === 'string' && payload.model.trim() ? payload.model : candidate.model,
    latencyMs: Date.now() - startedAt,
    promptTokens: promptTokens ?? 0,
    completionTokens: completionTokens ?? 0,
    usageAvailable: promptTokens !== undefined && completionTokens !== undefined && completionTokens > 0,
  }
}

export const DEFAULT_PROVIDER_ORDER = 'gemini,openrouter,openai,grok'
