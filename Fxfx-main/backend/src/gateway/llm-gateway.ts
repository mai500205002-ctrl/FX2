/**
 * TextFX v5 — Multi-provider LLM Gateway
 * ─────────────────────────────────────────────────────
 * Single entrypoint for ALL AI provider calls.
 *
 * Features:
 *  - Gemini, OpenAI, OpenRouter, and xAI/Grok server-side adapters
 *  - No automatic retry after a provider request; safe Auto fallback only on
 *    explicit rejection responses that cannot have generated a completion
 *  - 30 s abortable timeout per provider request
 *  - Provider health tracking (mark unhealthy after 3 consecutive failures; recover after 60 s)
 *  - Concurrency limiter (max 10 parallel LLM calls, queued)
 *  - Token accounting (provider usage with an estimate when unavailable)
 *  - Estimated cost per request (USD)
 *  - getGatewayStats() for integration with /api/metrics
 *
 * Drop-in compatible with existing `context.provider.generateCreativeText()` calls.
 */

import { createHash, randomUUID } from 'node:crypto'
import {
  assertAnyProviderConfigured,
  callOpenAICompatible,
  getProviderCostRates,
  getProviderStatus,
  ProviderRequestError,
  resolveProviderCandidates,
  type ProviderCandidate,
  type ProviderId,
  type ProviderLabel,
  type ProviderSelection,
} from './provider-adapters'

// ─── Unified types ────────────────────────────────────────────────────────────

export interface GatewayResponse {
  text:              string
  provider:          ProviderLabel
  model:             string
  latencyMs:         number
  usage: {
    promptTokens:     number
    completionTokens: number
    totalTokens:      number
  }
  cacheHit:          boolean
  retries:           number
  estimatedCostUsd:  number
  usageEstimated?:   boolean
  requestId?:         string
  runId?:             string
  promptVersion?:     string
  deduplicated?:      boolean
}

export interface GatewayBudgetContext {
  runId: string
  requestId?: string
  promptVersion?: string
  task?: GatewayTask
  providerId?: ProviderSelection
  model?: string
  signal?: AbortSignal
  runBudgetUsd: number
  callBudgetUsd: number
}

export type GatewayTask = 'candidate-generation' | 'critique' | 'final-artifact' | 'utility'

export class GatewayBudgetExceededError extends Error {
  readonly code = 'BUDGET_EXCEEDED'
  readonly status = 429
}

interface BudgetReservation {
  runId: string
  requestId: string
  reservedUsd: number
  candidateReservedUsd: Record<string, number>
  fingerprint: string
  settled: boolean
}

interface RunBudgetState {
  limitUsd: number
  callLimitUsd: number
  chargedUsd: number
  reservedUsd: number
  lastActivityAt: number
  reservations: Map<string, BudgetReservation>
}

export interface GatewayCallProvenance {
  requestId: string
  runId: string
  provider: ProviderLabel
  model: string
  task: GatewayTask
  promptVersion?: string
  status: 'succeeded' | 'failed'
  usage?: GatewayResponse['usage']
  usageEstimated?: boolean
  estimatedCostUsd?: number
  chargedCostUsd: number
  retries: number
  recordedAt: string
}

// ─── Provider health tracker ──────────────────────────────────────────────────

interface ProviderHealth {
  consecutiveFailures: number
  unhealthyUntil:      number   // epoch ms; 0 = healthy
  totalCalls:          number
  totalFailures:       number
  totalRetries:        number
  totalTimeouts:       number
  totalTokens:         number
  totalCostUsd:        number
}

const HEALTH_FAILURE_THRESHOLD = 3         // consecutive failures before marking unhealthy
const HEALTH_RECOVERY_MS       = 60_000    // 1 minute cooldown

const health = new Map<string, ProviderHealth>()

function getHealth(name: string): ProviderHealth {
  if (!health.has(name)) {
    health.set(name, {
      consecutiveFailures: 0, unhealthyUntil: 0,
      totalCalls: 0, totalFailures: 0, totalRetries: 0,
      totalTimeouts: 0, totalTokens: 0, totalCostUsd: 0,
    })
  }
  return health.get(name)!
}

function markSuccess(name: string): void {
  const h = getHealth(name)
  h.consecutiveFailures = 0
  h.unhealthyUntil      = 0
}

function markFailure(name: string, isTimeout = false): void {
  const h = getHealth(name)
  h.totalFailures++
  if (isTimeout) h.totalTimeouts++
  h.consecutiveFailures++
  if (h.consecutiveFailures >= HEALTH_FAILURE_THRESHOLD) {
    h.unhealthyUntil = Date.now() + HEALTH_RECOVERY_MS
  }
}

function isHealthy(name: string): boolean {
  const h = getHealth(name)
  if (h.unhealthyUntil === 0) return true
  if (Date.now() >= h.unhealthyUntil) {
    // Recovery: reset and try again
    h.consecutiveFailures = 0
    h.unhealthyUntil      = 0
    return true
  }
  return false
}

export function assertGeminiConfigured(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey || /^(replace_me|your_|<)/i.test(apiKey)) {
    throw new Error('Live Gemini generation is unavailable: configure a valid GEMINI_API_KEY.')
  }
  return apiKey
}

export { assertAnyProviderConfigured, getProviderStatus }

// ─── Cost estimation ──────────────────────────────────────────────────────────
// Very rough USD/token estimates — updated for common models

const GEMINI_COST_PER_1K: Record<string, { input: number; output: number }> = {
  'gemini-3.1-flash-lite': { input: 0.00025, output: 0.0005 },
  'gemini-2.5-flash':    { input: 0.0003, output: 0.0025  },
  'gemini-2.5-pro':      { input: 0.00125, output: 0.01   },
  'default':             { input: 0.001,   output: 0.002   },
}

function estimateCost(provider: ProviderId, model: string, promptTokens: number, completionTokens: number): number {
  const rates = provider === 'gemini'
    ? GEMINI_COST_PER_1K[model] ?? GEMINI_COST_PER_1K['default']
    : getProviderCostRates(provider)
  return (promptTokens / 1000) * rates.input + (completionTokens / 1000) * rates.output
}

function estimateTokens(text: string): number {
  // ~4 chars per token; fast and allocation-free
  return Math.ceil(text.length / 4)
}

// ─── Concurrency limiter ──────────────────────────────────────────────────────

const MAX_CONCURRENT = 10
let   activeCalls    = 0
const queue: Array<() => void> = []
const DEFAULT_RUN_BUDGET_USD = 10
const DEFAULT_CALL_BUDGET_USD = 0.5
const MAX_BUDGET_RUNS = 1000
const MAX_CALLS_PER_RUN = 1000
const BUDGET_RUN_IDLE_MS = 24 * 60 * 60 * 1000
const MAX_CALL_PROVENANCE = 500
const COST_EPSILON_USD = 1e-9
const runBudgets = new Map<string, RunBudgetState>()
const budgetReservations = new Map<string, BudgetReservation>()
const callProvenance: GatewayCallProvenance[] = []

function readBudgetLimit(value: unknown, envName: string, fallback: number): number {
  const parsed = value === undefined ? Number(process.env[envName] || fallback) : Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${envName} must be a positive finite USD amount.`)
  return parsed
}

export function createGatewayBudgetContext(
  runId: string,
  overrides: {
    runBudgetUsd?: number
    callBudgetUsd?: number
    promptVersion?: string
    providerId?: ProviderSelection
    model?: string
    signal?: AbortSignal
  } = {},
): GatewayBudgetContext {
  if (!runId.trim()) throw new Error('Gateway budget context requires a run ID.')
  return {
    runId,
    promptVersion: overrides.promptVersion,
    task: 'final-artifact',
    providerId: overrides.providerId,
    model: overrides.model,
    signal: overrides.signal,
    runBudgetUsd: readBudgetLimit(overrides.runBudgetUsd, 'GEMINI_RUN_BUDGET_USD', DEFAULT_RUN_BUDGET_USD),
    callBudgetUsd: readBudgetLimit(overrides.callBudgetUsd, 'GEMINI_CALL_BUDGET_USD', DEFAULT_CALL_BUDGET_USD),
  }
}

export function withGatewayTask(context: unknown, task: GatewayTask, requestId = randomUUID()): GatewayBudgetContext {
  const base = context && typeof context === 'object' ? context as Partial<GatewayBudgetContext> : undefined
  return {
    runId: base?.runId || `gateway-${randomUUID()}`,
    requestId,
    promptVersion: base?.promptVersion,
    task,
    providerId: base?.providerId,
    model: base?.model,
    signal: base?.signal,
    runBudgetUsd: readBudgetLimit(base?.runBudgetUsd, 'GEMINI_RUN_BUDGET_USD', DEFAULT_RUN_BUDGET_USD),
    callBudgetUsd: readBudgetLimit(base?.callBudgetUsd, 'GEMINI_CALL_BUDGET_USD', DEFAULT_CALL_BUDGET_USD),
  }
}

export function getModelRoutingPolicy() {
  return {
    version: 'multi-provider-task-routing-v1',
    autoProviderOrder: process.env.AI_AUTO_PROVIDER_ORDER || 'gemini,openrouter,openai,grok',
    providers: getProviderStatus().map(({ id, label, configured, models }) => ({ id, label, configured, models })),
    tasks: ['candidate-generation', 'critique', 'final-artifact', 'utility'] as GatewayTask[],
  }
}

function pruneBudgetRuns(): void {
  while (runBudgets.size >= MAX_BUDGET_RUNS) {
    const now = Date.now()
    const oldest = [...runBudgets.entries()].find(([, state]) =>
      now - state.lastActivityAt >= BUDGET_RUN_IDLE_MS && [...state.reservations.values()].every(item => item.settled),
    )
    if (!oldest) throw new GatewayBudgetExceededError('Gateway budget tracker is at its active-run capacity.')
    runBudgets.delete(oldest[0])
    for (const [key, reservation] of budgetReservations) if (reservation.runId === oldest[0] && reservation.settled) budgetReservations.delete(key)
  }
}

function reserveBudget(context: GatewayBudgetContext, prompt: string, systemPrompt: string, candidates: ProviderCandidate[], maxTokens: number): BudgetReservation {
  const requestId = context.requestId || randomUUID()
  const requestKey = `${context.runId}:${requestId}`
  const fingerprint = createHash('sha256').update(JSON.stringify([candidates.map(item => [item.id, item.model]), maxTokens, systemPrompt, prompt])).digest('hex')
  const existing = budgetReservations.get(requestKey)
  if (existing) {
    if (existing.fingerprint !== fingerprint) throw new GatewayBudgetExceededError('Idempotency key was already reserved for different model input.')
    if (existing.settled) throw new GatewayBudgetExceededError('Idempotency key has already completed; create a new request ID.')
    return existing
  }

  const state = runBudgets.get(context.runId)
  if (state && (state.limitUsd !== context.runBudgetUsd || state.callLimitUsd !== context.callBudgetUsd)) {
    throw new GatewayBudgetExceededError('Budget limits cannot change during a run.')
  }
  const inputTokens = Buffer.byteLength(systemPrompt + prompt, 'utf8') + 64
  const candidateReservedUsd = Object.fromEntries(candidates.map(candidate => [
    candidate.id,
    estimateCost(candidate.id, candidate.model, inputTokens, maxTokens),
  ]))
  const reservedUsd = Object.values(candidateReservedUsd).reduce((sum, amount) => sum + amount, 0)
  if (reservedUsd > context.callBudgetUsd) throw new GatewayBudgetExceededError(`Estimated call reservation $${reservedUsd.toFixed(6)} exceeds the $${context.callBudgetUsd.toFixed(6)} call budget.`)
  const current = state ?? { limitUsd: context.runBudgetUsd, callLimitUsd: context.callBudgetUsd, chargedUsd: 0, reservedUsd: 0, lastActivityAt: Date.now(), reservations: new Map<string, BudgetReservation>() }
  if (current.reservations.size >= MAX_CALLS_PER_RUN) throw new GatewayBudgetExceededError(`Run exceeded the ${MAX_CALLS_PER_RUN}-call budget reservation limit.`)
  if (current.chargedUsd + current.reservedUsd + reservedUsd > current.limitUsd) {
    throw new GatewayBudgetExceededError(`Estimated reservation would exceed the $${current.limitUsd.toFixed(6)} run budget.`)
  }
  if (!state) {
    pruneBudgetRuns()
    runBudgets.set(context.runId, current)
  }
  current.lastActivityAt = Date.now()
  const reservation: BudgetReservation = { runId: context.runId, requestId, reservedUsd, candidateReservedUsd, fingerprint, settled: false }
  current.reservations.set(requestId, reservation)
  current.reservedUsd += reservedUsd
  budgetReservations.set(requestKey, reservation)
  return reservation
}

function settleBudget(reservation: BudgetReservation, chargedUsd: number): void {
  if (reservation.settled) return
  const state = runBudgets.get(reservation.runId)
  if (!state) throw new Error('Gateway budget reservation state is missing.')
  if (!Number.isFinite(chargedUsd) || chargedUsd < 0 || chargedUsd > reservation.reservedUsd + COST_EPSILON_USD) {
    throw new Error('Gateway charge exceeds its reserved estimate.')
  }
  state.reservedUsd = Math.max(0, state.reservedUsd - reservation.reservedUsd)
  state.chargedUsd += Math.min(chargedUsd, reservation.reservedUsd)
  state.lastActivityAt = Date.now()
  reservation.settled = true
}

function recordCallProvenance(item: GatewayCallProvenance): void {
  callProvenance.push(item)
  if (callProvenance.length > MAX_CALL_PROVENANCE) callProvenance.shift()
}

export function getGatewayCallHistory(limit = 100): GatewayCallProvenance[] {
  return callProvenance.slice(-Math.max(1, Math.min(MAX_CALL_PROVENANCE, Math.floor(limit)))).map(item => ({ ...item, usage: item.usage ? { ...item.usage } : undefined }))
}

function getBudgetStats() {
  const states = [...runBudgets.values()]
  return {
    storage: 'process-local; not atomic across backend processes',
    runCount: states.length,
    activeReservations: states.reduce((sum, state) => sum + [...state.reservations.values()].filter(item => !item.settled).length, 0),
    chargedUsd: +states.reduce((sum, state) => sum + state.chargedUsd, 0).toFixed(6),
    reservedUsd: +states.reduce((sum, state) => sum + state.reservedUsd, 0).toFixed(6),
  }
}

function acquireSlot(): Promise<void> {
  return new Promise(resolve => {
    if (activeCalls < MAX_CONCURRENT) {
      activeCalls++
      resolve()
    } else {
      queue.push(resolve)
    }
  })
}

function releaseSlot(): void {
  activeCalls--
  const next = queue.shift()
  if (next) { activeCalls++; next() }
}

// ─── Gateway stats (for /api/metrics) ────────────────────────────────────────

let gatewayTotalCalls   = 0
let gatewayQueuedCalls  = 0
let gatewayCacheHits    = 0
let gatewayDedupHits    = 0
const CACHE_TTL_MS       = 60_000
const MAX_CACHE_ENTRIES  = 100

interface CachedResponse {
  response: GatewayResponse
  expiresAt: number
}

const responseCache = new Map<string, CachedResponse>()
const inflightRequests = new Map<string, Promise<GatewayResponse>>()

function makeRequestKey(prompt: string, systemPrompt: string, candidates: ProviderCandidate[], maxTokens: number, temperature: number, runId: string): string {
  return createHash('sha256')
    .update(JSON.stringify([runId, candidates.map(item => [item.id, item.model]), temperature, maxTokens, systemPrompt, prompt]))
    .digest('hex')
}

function pruneExpiredCache(now = Date.now()): void {
  for (const [key, entry] of responseCache) {
    if (entry.expiresAt <= now) responseCache.delete(key)
  }
}

export function getGatewayStats(): object {
  pruneExpiredCache()
  const providers: Record<string, object> = {}
  for (const [name, h] of health) {
    providers[name] = {
      healthy:             h.unhealthyUntil === 0 || Date.now() >= h.unhealthyUntil,
      consecutiveFailures: h.consecutiveFailures,
      totalCalls:          h.totalCalls,
      totalFailures:       h.totalFailures,
      totalRetries:        h.totalRetries,
      totalTimeouts:       h.totalTimeouts,
      totalTokens:         h.totalTokens,
      estimatedCostUsd:    +h.totalCostUsd.toFixed(6),
    }
  }
  return {
    totalCalls:         gatewayTotalCalls,
    cacheHits:          gatewayCacheHits,
    cacheHitRate:       gatewayTotalCalls ? gatewayCacheHits / gatewayTotalCalls : 0,
    dedupHits:          gatewayDedupHits,
    queuedCalls:        gatewayQueuedCalls,
    activeConcurrent:   activeCalls,
    cacheSize:          responseCache.size,
    inflight:           inflightRequests.size,
    budgets:            getBudgetStats(),
    routing:            getModelRoutingPolicy(),
    providers,
  }
}

// ─── Individual provider calls ────────────────────────────────────────────────

const CALL_TIMEOUT = 30_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

async function callGemini(
  candidate: ProviderCandidate,
  prompt: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  signal: AbortSignal,
) {
  const startedAt = Date.now()
  let response: Response
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate.model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': candidate.apiKey },
      signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature, maxOutputTokens: maxTokens, candidateCount: 1 },
      }),
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new ProviderRequestError(candidate.label)
  }
  if (!response.ok) {
    const safeToFallback = [400, 401, 403, 404, 422].includes(response.status)
    await response.body?.cancel().catch(() => {})
    throw new ProviderRequestError(candidate.label, response.status, safeToFallback)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ProviderRequestError(candidate.label, response.status, false, 'Gemini returned invalid JSON.')
  }
  if (!isRecord(payload)) throw new ProviderRequestError(candidate.label, response.status, false, 'Gemini returned an invalid response.')
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : []
  const first = isRecord(candidates[0]) ? candidates[0] : undefined
  const content = first && isRecord(first.content) ? first.content : undefined
  const parts = content && Array.isArray(content.parts) ? content.parts : []
  const text = parts.map(part => isRecord(part) && typeof part.text === 'string' ? part.text : '').join('')
  const finishReason = first?.finishReason
  if (finishReason !== 'STOP') {
    if (finishReason === 'MAX_TOKENS') {
      throw new ProviderRequestError(candidate.label, response.status, false, `Gemini response was truncated at ${maxTokens} output tokens.`)
    }
    const reason = typeof finishReason === 'string' && finishReason ? finishReason : 'unknown'
    throw new ProviderRequestError(candidate.label, response.status, false, `Gemini response was incomplete (finish reason: ${reason}).`)
  }
  if (!text.trim()) throw new ProviderRequestError(candidate.label, response.status, false, 'Gemini returned no text.')

  const usage = isRecord(payload.usageMetadata) ? payload.usageMetadata : {}
  const promptTokens = typeof usage.promptTokenCount === 'number' && Number.isSafeInteger(usage.promptTokenCount) && usage.promptTokenCount >= 0
    ? usage.promptTokenCount
    : undefined
  const completionTokens = typeof usage.candidatesTokenCount === 'number' && Number.isSafeInteger(usage.candidatesTokenCount) && usage.candidatesTokenCount >= 0
    ? usage.candidatesTokenCount
    : undefined
  return {
    text,
    model: candidate.model,
    latencyMs: Date.now() - startedAt,
    promptTokens: promptTokens ?? 0,
    completionTokens: completionTokens ?? 0,
    usageAvailable: promptTokens !== undefined && completionTokens !== undefined && completionTokens > 0,
  }
}

async function callProvider(
  candidate: ProviderCandidate,
  prompt: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  parentSignal?: AbortSignal,
): Promise<GatewayResponse> {
  if (parentSignal?.aborted) throw new Error('Provider request cancelled before it started.')
  const controller = new AbortController()
  const abortFromParent = () => controller.abort(parentSignal?.reason)
  parentSignal?.addEventListener('abort', abortFromParent, { once: true })
  const timer = setTimeout(() => controller.abort(new Error('Provider request timed out.')), CALL_TIMEOUT)
  try {
    const result = candidate.id === 'gemini'
      ? await callGemini(candidate, prompt, systemPrompt, temperature, maxTokens, controller.signal)
      : await callOpenAICompatible(candidate, prompt, systemPrompt, temperature, maxTokens, controller.signal)
    const maxPromptTokens = Buffer.byteLength(systemPrompt + prompt, 'utf8') + 64
    if (result.usageAvailable && (result.promptTokens > maxPromptTokens || result.completionTokens > maxTokens)) {
      throw new ProviderRequestError(candidate.label, undefined, false, `${candidate.label} reported token usage outside the request limits.`)
    }
    const usageAvailable = result.usageAvailable
      && result.promptTokens > 0
    const promptTokens = usageAvailable ? result.promptTokens : estimateTokens(systemPrompt + prompt)
    const completionTokens = usageAvailable ? result.completionTokens : estimateTokens(result.text)
    return {
      text: result.text,
      provider: candidate.label,
      model: result.model,
      latencyMs: result.latencyMs,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      cacheHit: false,
      retries: 0,
      estimatedCostUsd: estimateCost(candidate.id, result.model, promptTokens, completionTokens),
      usageEstimated: !usageAvailable,
    }
  } catch (error) {
    if (parentSignal?.aborted) throw new Error('Provider request cancelled.')
    if (controller.signal.aborted) {
      throw new ProviderRequestError(candidate.label, undefined, false, `${candidate.label} request timed out after ${CALL_TIMEOUT}ms.`)
    }
    throw error
  } finally {
    clearTimeout(timer)
    parentSignal?.removeEventListener('abort', abortFromParent)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Primary gateway call. Returns a full GatewayResponse with observability data.
 */
export async function callLLM(
  prompt:       string,
  systemPrompt: string,
  budgetContext?: GatewayBudgetContext,
): Promise<GatewayResponse> {
  gatewayTotalCalls++

  const context = budgetContext || createGatewayBudgetContext(`gateway-${randomUUID()}`)
  if (typeof context.runId !== 'string' || !context.runId.trim()) throw new Error('Gateway budget context requires a run ID.')
  if (context.requestId !== undefined && (typeof context.requestId !== 'string' || !context.requestId.trim())) throw new Error('Gateway request ID must be a non-empty string.')
  const runBudgetUsd = readBudgetLimit(context.runBudgetUsd, 'GEMINI_RUN_BUDGET_USD', DEFAULT_RUN_BUDGET_USD)
  const callBudgetUsd = readBudgetLimit(context.callBudgetUsd, 'GEMINI_CALL_BUDGET_USD', DEFAULT_CALL_BUDGET_USD)
  const task = context.task || 'final-artifact'
  if (!['candidate-generation', 'critique', 'final-artifact', 'utility'].includes(task)) throw new Error('Gateway task is not supported.')
  const outputTokenSetting = process.env.AI_MAX_OUTPUT_TOKENS || process.env.GEMINI_MAX_OUTPUT_TOKENS || '512'
  if (!/^[1-9]\d*$/.test(outputTokenSetting)) throw new Error('AI_MAX_OUTPUT_TOKENS must be an integer between 1 and 512.')
  const maxTokens = Number(outputTokenSetting)
  if (!Number.isSafeInteger(maxTokens) || maxTokens > 512) throw new Error('AI_MAX_OUTPUT_TOKENS must be an integer between 1 and 512.')
  const temperature = Number(process.env.AI_TEMPERATURE || process.env.GEMINI_TEMPERATURE || '0.8')
  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) throw new Error('AI_TEMPERATURE must be between 0 and 2.')
  const candidates = resolveProviderCandidates(context.providerId, context.model, task)
  const autoMode = (context.providerId || 'auto') === 'auto'
  const requestId = context.requestId || randomUUID()
  const callContext = { ...context, requestId }
  const requestKey = makeRequestKey(prompt, systemPrompt, candidates, maxTokens, temperature, context.runId)
  pruneExpiredCache()
  const cached = responseCache.get(requestKey)
  if (cached) {
    gatewayCacheHits++
    return { ...cached.response, requestId, runId: context.runId, promptVersion: context.promptVersion, cacheHit: true, latencyMs: 0 }
  }

  const inflight = inflightRequests.get(requestKey)
  if (inflight) {
    gatewayDedupHits++
    return inflight.then(response => ({ ...response, requestId, runId: context.runId, promptVersion: context.promptVersion, deduplicated: true }))
  }

  const validatedContext = { ...callContext, runBudgetUsd, callBudgetUsd }
  const reservation = reserveBudget(validatedContext, prompt, systemPrompt, candidates, maxTokens)

  const request = (async () => {
    if (activeCalls >= MAX_CONCURRENT) gatewayQueuedCalls++
    await acquireSlot()
    const failedAttempts: Array<{ candidate: ProviderCandidate; error: Error }> = []
    const attemptedCandidates = new Set<string>()
    let response: GatewayResponse | undefined
    let selectedCandidate: ProviderCandidate | undefined
    let lastError: Error = new Error('No configured provider could complete the request.')
    try {
      for (const candidate of candidates) {
        if (context.signal?.aborted) throw new Error('Provider request cancelled.')
        const providerHealth = getHealth(candidate.label)
        if (!isHealthy(candidate.label)) {
          lastError = new ProviderRequestError(candidate.label, undefined, autoMode, `${candidate.label} is temporarily unavailable.`)
          if (autoMode) continue
          throw lastError
        }

        providerHealth.totalCalls++
        attemptedCandidates.add(candidate.id)
        try {
          response = await callProvider(candidate, prompt, systemPrompt, temperature, maxTokens, context.signal)
          selectedCandidate = candidate
          const candidateReservation = reservation.candidateReservedUsd[candidate.id]
          if (response.usageEstimated) {
            response.estimatedCostUsd = candidateReservation
          } else if (response.estimatedCostUsd > candidateReservation + COST_EPSILON_USD) {
            throw new GatewayBudgetExceededError('Provider usage estimate exceeded its reservation; the result was withheld.')
          }
          markSuccess(candidate.label)
          providerHealth.totalTokens += response.usage.totalTokens
          providerHealth.totalCostUsd += response.estimatedCostUsd
          break
        } catch (error) {
          const failure = error instanceof Error ? error : new Error('Provider request failed.')
          markFailure(candidate.label, failure.message.includes('timed out'))
          failedAttempts.push({ candidate, error: failure })
          lastError = failure
          if (autoMode && failure instanceof ProviderRequestError && failure.safeToFallback) continue
          throw failure
        }
      }

      if (!response || !selectedCandidate) throw lastError
      response.requestId = requestId
      response.runId = context.runId
      response.promptVersion = context.promptVersion
      for (const failed of failedAttempts) {
        const chargedCostUsd = reservation.candidateReservedUsd[failed.candidate.id]
        recordCallProvenance({
          requestId, runId: context.runId, provider: failed.candidate.label, model: failed.candidate.model,
          task, promptVersion: context.promptVersion, status: 'failed', usageEstimated: true,
          chargedCostUsd, retries: 0,
          recordedAt: new Date().toISOString(),
        })
      }
      const failedCostUsd = failedAttempts.reduce((sum, item) => sum + reservation.candidateReservedUsd[item.candidate.id], 0)
      const successfulCostUsd = response.usageEstimated
        ? reservation.candidateReservedUsd[selectedCandidate.id]
        : response.estimatedCostUsd
      settleBudget(reservation, failedCostUsd + successfulCostUsd)
      recordCallProvenance({
        requestId, runId: context.runId, provider: selectedCandidate.label, model: response.model, task,
        promptVersion: context.promptVersion, status: 'succeeded', usage: response.usage,
        usageEstimated: response.usageEstimated,
        estimatedCostUsd: response.estimatedCostUsd, chargedCostUsd: successfulCostUsd, retries: 0,
        recordedAt: new Date().toISOString(),
      })

      pruneExpiredCache()
      if (responseCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = responseCache.keys().next().value
        if (oldestKey) responseCache.delete(oldestKey)
      }
      responseCache.set(requestKey, { response, expiresAt: Date.now() + CACHE_TTL_MS })
      return response
    } catch (error) {
      const finalError = error instanceof Error ? error : new Error('Provider request failed.')
      const chargedCostUsd = [...attemptedCandidates].reduce(
        (sum, candidateId) => sum + reservation.candidateReservedUsd[candidateId],
        0,
      )
      settleBudget(reservation, chargedCostUsd)
      for (const failed of failedAttempts) {
        const failedCostUsd = reservation.candidateReservedUsd[failed.candidate.id]
        recordCallProvenance({
          requestId, runId: context.runId, provider: failed.candidate.label, model: failed.candidate.model,
          task, promptVersion: context.promptVersion, status: 'failed',
          usageEstimated: true, chargedCostUsd: failedCostUsd, retries: 0,
          recordedAt: new Date().toISOString(),
        })
      }
      if (selectedCandidate && !failedAttempts.some(item => item.candidate.id === selectedCandidate?.id)) {
        recordCallProvenance({
          requestId, runId: context.runId, provider: selectedCandidate.label, model: selectedCandidate.model,
          task, promptVersion: context.promptVersion, status: 'failed',
          usageEstimated: true,
          chargedCostUsd: reservation.candidateReservedUsd[selectedCandidate.id],
          retries: 0,
          recordedAt: new Date().toISOString(),
        })
      }
      throw finalError
    } finally {
      releaseSlot()
    }
  })()

  inflightRequests.set(requestKey, request)
  try {
    return await request
  } finally {
    if (inflightRequests.get(requestKey) === request) inflightRequests.delete(requestKey)
  }
}

// ─── Drop-in provider-compatible interface ────────────────────────────────────
/**
 * Compatible with the existing `context.provider.generateCreativeText(prompt, systemPrompt, _config)`
 * signature used throughout the codebase.  Pass `gateway` as `context.provider`.
 */
export const gateway = {
  generateCreativeText: async (
    prompt:       string,
    systemPrompt: string,
    config?:      unknown,
  ): Promise<{ text: string; provider: ProviderLabel; model: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> => {
    const resp = await callLLM(prompt, systemPrompt, config as GatewayBudgetContext | undefined)
    return { text: resp.text, provider: resp.provider, model: resp.model, usage: resp.usage }
  },
}

// ─── Current active provider label (for startup logs / metrics) ───────────────
export function getActiveProviderLabel(): string {
  const selected = process.env.AI_PROVIDER?.trim().toLowerCase()
  const statuses = getProviderStatus()
  if (selected && selected !== 'auto') {
    const provider = statuses.find(item => item.id === selected)
    if (provider) return provider.configured ? provider.label : `${provider.label} (not configured)`
  }
  const configured = statuses.filter(item => item.configured).map(item => item.label)
  return configured.length ? `Auto (${configured.join(', ')})` : 'Auto (no provider configured)'
}
