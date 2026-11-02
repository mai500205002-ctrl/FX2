/**
 * TextFX v5 — Gemini-only LLM Gateway
 * ─────────────────────────────────────────────────────
 * Single entrypoint for ALL AI provider calls.
 *
 * Features:
 *  - Singleton Gemini client (initialized once, reused)
 *  - Gemini-only retries; errors are surfaced without provider fallback
 *  - Retry with exponential backoff (up to 2 retries per provider)
 *  - 30 s timeout per attempt
 *  - Provider health tracking (mark unhealthy after 3 consecutive failures; recover after 60 s)
 *  - Concurrency limiter (max 10 parallel LLM calls, queued)
 *  - Token accounting (provider usage with an estimate when unavailable)
 *  - Estimated cost per request (USD)
 *  - getGatewayStats() for integration with /api/metrics
 *
 * Drop-in compatible with existing `context.provider.generateCreativeText()` calls.
 */

import { createHash, randomUUID } from 'node:crypto'
import { GoogleGenAI } from '@google/genai'

// ─── Unified types ────────────────────────────────────────────────────────────

export interface GatewayResponse {
  text:              string
  provider:          'Gemini'
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
  provider: 'Gemini'
  model: string
  task: GatewayTask
  promptVersion?: string
  status: 'succeeded' | 'failed'
  usage?: GatewayResponse['usage']
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

// ─── Singleton clients ────────────────────────────────────────────────────────

let _geminiClient: GoogleGenAI | null = null
function getGeminiClient(): GoogleGenAI {
  if (!_geminiClient) {
    const apiKey = assertGeminiConfigured()
    _geminiClient = new GoogleGenAI({ apiKey })
  }
  return _geminiClient
}

export function assertGeminiConfigured(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey || /^(replace_me|your_|<)/i.test(apiKey)) {
    throw new Error('Live Gemini generation is unavailable: configure a valid GEMINI_API_KEY.')
  }
  return apiKey
}

// ─── Cost estimation ──────────────────────────────────────────────────────────
// Very rough USD/token estimates — updated for common models

const COST_PER_1K: Record<string, { input: number; output: number }> = {
  'gemini-3.1-flash-lite': { input: 0.00025, output: 0.0005 },
  'gemini-2.5-flash':    { input: 0.0003, output: 0.0025  },
  'gemini-2.5-pro':      { input: 0.00125, output: 0.01   },
  'default':             { input: 0.001,   output: 0.002   },
}

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const rates = COST_PER_1K[model] ?? COST_PER_1K['default']
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
const RETRY_DELAYS = [500, 1000]   // ms between retry attempts
const DEFAULT_RUN_BUDGET_USD = 10
const DEFAULT_CALL_BUDGET_USD = 0.5
const MAX_BUDGET_RUNS = 1000
const MAX_CALLS_PER_RUN = 1000
const BUDGET_RUN_IDLE_MS = 24 * 60 * 60 * 1000
const MAX_CALL_PROVENANCE = 500
const runBudgets = new Map<string, RunBudgetState>()
const budgetReservations = new Map<string, BudgetReservation>()
const callProvenance: GatewayCallProvenance[] = []

function readBudgetLimit(value: unknown, envName: string, fallback: number): number {
  const parsed = value === undefined ? Number(process.env[envName] || fallback) : Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${envName} must be a positive finite USD amount.`)
  return parsed
}

export function createGatewayBudgetContext(runId: string, overrides: { runBudgetUsd?: number; callBudgetUsd?: number; promptVersion?: string } = {}): GatewayBudgetContext {
  if (!runId.trim()) throw new Error('Gateway budget context requires a run ID.')
  return {
    runId,
    promptVersion: overrides.promptVersion,
    task: 'final-artifact',
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
    runBudgetUsd: readBudgetLimit(base?.runBudgetUsd, 'GEMINI_RUN_BUDGET_USD', DEFAULT_RUN_BUDGET_USD),
    callBudgetUsd: readBudgetLimit(base?.callBudgetUsd, 'GEMINI_CALL_BUDGET_USD', DEFAULT_CALL_BUDGET_USD),
  }
}

const MODEL_ENV_BY_TASK: Record<GatewayTask, string> = {
  'candidate-generation': 'GEMINI_MODEL_CANDIDATE_GENERATION',
  critique: 'GEMINI_MODEL_CRITIQUE',
  'final-artifact': 'GEMINI_MODEL_FINAL_ARTIFACT',
  utility: 'GEMINI_MODEL_UTILITY',
}

function resolveModel(task: GatewayTask): string {
  return process.env[MODEL_ENV_BY_TASK[task]]?.trim() || process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite'
}

export function getModelRoutingPolicy() {
  const tasks: Record<GatewayTask, { env: string; model: string; configured: boolean }> = {} as Record<GatewayTask, { env: string; model: string; configured: boolean }>
  for (const task of Object.keys(MODEL_ENV_BY_TASK) as GatewayTask[]) {
    const taskModel = process.env[MODEL_ENV_BY_TASK[task]]?.trim()
    const defaultModel = process.env.GEMINI_MODEL?.trim()
    tasks[task] = { env: MODEL_ENV_BY_TASK[task], model: taskModel || defaultModel || 'gemini-3.1-flash-lite', configured: !!taskModel || !!defaultModel }
  }
  return { version: 'gemini-task-routing-v1', provider: 'Gemini', tasks }
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

function reserveBudget(context: GatewayBudgetContext, prompt: string, systemPrompt: string, model: string, maxTokens: number): BudgetReservation {
  const requestId = context.requestId || randomUUID()
  const requestKey = `${context.runId}:${requestId}`
  const fingerprint = createHash('sha256').update(JSON.stringify([model, maxTokens, systemPrompt, prompt])).digest('hex')
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
  const estimate = estimateCost(model, estimateTokens(systemPrompt + prompt), maxTokens)
  const reservedUsd = estimate * (RETRY_DELAYS.length + 1)
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
  const reservation: BudgetReservation = { runId: context.runId, requestId, reservedUsd, fingerprint, settled: false }
  current.reservations.set(requestId, reservation)
  current.reservedUsd += reservedUsd
  budgetReservations.set(requestKey, reservation)
  return reservation
}

function settleBudget(reservation: BudgetReservation, chargedUsd: number): void {
  if (reservation.settled) return
  const state = runBudgets.get(reservation.runId)
  if (!state) return
  state.reservedUsd = Math.max(0, state.reservedUsd - reservation.reservedUsd)
  state.chargedUsd += Math.min(reservation.reservedUsd, Math.max(0, chargedUsd))
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

function makeRequestKey(prompt: string, systemPrompt: string, model: string, runId: string): string {
  const temperature = process.env.GEMINI_TEMPERATURE || '0.8'
  const maxTokens = process.env.GEMINI_MAX_OUTPUT_TOKENS || '8192'
  return createHash('sha256')
    .update(JSON.stringify([runId, model, temperature, maxTokens, systemPrompt, prompt]))
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

// ─── Timeout helper ───────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`LLM timeout after ${ms}ms`)), ms)
    promise.then(v => { clearTimeout(t); resolve(v) }, e => { clearTimeout(t); reject(e) })
  })
}

// ─── Individual provider calls (no retry logic here) ─────────────────────────

async function callGemini(prompt: string, systemPrompt: string, model: string): Promise<GatewayResponse> {
  const client    = getGeminiClient()
  const temp      = parseFloat(process.env.GEMINI_TEMPERATURE || '0.8')
  const maxTokens = parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '8192', 10)
  const t0        = Date.now()

  const resp = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: temp,
      maxOutputTokens: maxTokens,
      candidateCount: 1,
    },
  })

  const text = resp.text ?? ''
  const finishReason = resp.candidates?.[0]?.finishReason
  if (finishReason === 'MAX_TOKENS') {
    throw new Error(`Gemini response was truncated at ${maxTokens} output tokens; increase GEMINI_MAX_OUTPUT_TOKENS.`)
  }
  if (!text.trim()) throw new Error(`Gemini returned no text (finish reason: ${finishReason || 'unknown'}).`)
  const promptTokens = resp.usageMetadata?.promptTokenCount ?? estimateTokens(systemPrompt + prompt)
  const completionTokens = resp.usageMetadata?.candidatesTokenCount ?? estimateTokens(text)
  const totalTokens = resp.usageMetadata?.totalTokenCount ?? (promptTokens + completionTokens)
  const costUsd = estimateCost(model, promptTokens, completionTokens)

  return {
    text,
    provider: 'Gemini',
    model,
    latencyMs: Date.now() - t0,
    usage: { promptTokens, completionTokens, totalTokens },
    cacheHit: false,
    retries: 0,
    estimatedCostUsd: costUsd,
  }
}

type ProviderName = 'Gemini'

// ─── Core Gemini call (with retries) ──────────────────────────────────────────

const CALL_TIMEOUT = 30_000         // 30 s per attempt

async function executeWithRetry(
  name: ProviderName,
  prompt: string,
  systemPrompt: string,
  model: string,
): Promise<GatewayResponse> {
  const h = getHealth(name)
  let lastErr: Error | null = null
  let retriesUsed = 0

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_DELAYS[attempt - 1]
      await new Promise(r => setTimeout(r, delay))
      retriesUsed++
      h.totalRetries++
    }

    try {
      const resp = await withTimeout(callGemini(prompt, systemPrompt, model), CALL_TIMEOUT)

      resp.retries = retriesUsed
      markSuccess(name)
      return resp
    } catch (err) {
      const isTimeout = err instanceof Error && err.message.startsWith('LLM timeout')
      markFailure(name, isTimeout)
      lastErr = err instanceof Error ? err : new Error(String(err))

      if (!isHealthy(name)) break   // unhealthy — stop retrying this provider
    }
  }

  const failure = lastErr ?? new Error(`Provider ${name} failed`)
  Object.assign(failure, { retries: retriesUsed })
  throw failure
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
  assertGeminiConfigured()

  const maxTokens = Number.parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '8192', 10)
  if (!Number.isSafeInteger(maxTokens) || maxTokens <= 0) throw new Error('GEMINI_MAX_OUTPUT_TOKENS must be a positive safe integer.')
  const temperature = Number.parseFloat(process.env.GEMINI_TEMPERATURE || '0.8')
  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) throw new Error('GEMINI_TEMPERATURE must be between 0 and 2.')

  const context = budgetContext || createGatewayBudgetContext(`gateway-${randomUUID()}`)
  if (typeof context.runId !== 'string' || !context.runId.trim()) throw new Error('Gateway budget context requires a run ID.')
  if (context.requestId !== undefined && (typeof context.requestId !== 'string' || !context.requestId.trim())) throw new Error('Gateway request ID must be a non-empty string.')
  const runBudgetUsd = readBudgetLimit(context.runBudgetUsd, 'GEMINI_RUN_BUDGET_USD', DEFAULT_RUN_BUDGET_USD)
  const callBudgetUsd = readBudgetLimit(context.callBudgetUsd, 'GEMINI_CALL_BUDGET_USD', DEFAULT_CALL_BUDGET_USD)
  const task = context.task || 'final-artifact'
  if (!Object.prototype.hasOwnProperty.call(MODEL_ENV_BY_TASK, task)) throw new Error('Gateway task is not supported.')
  const model = resolveModel(task)
  const requestId = context.requestId || randomUUID()
  const callContext = { ...context, requestId }
  const requestKey = makeRequestKey(prompt, systemPrompt, model, context.runId)
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
  const reservation = reserveBudget(validatedContext, prompt, systemPrompt, model, maxTokens)

  const request = (async () => {
    if (activeCalls >= MAX_CONCURRENT) gatewayQueuedCalls++
    await acquireSlot()
    try {
      const providerHealth = getHealth('Gemini')
      providerHealth.totalCalls++
      const response = await executeWithRetry('Gemini', prompt, systemPrompt, model)
      response.requestId = requestId
      response.runId = context.runId
      response.promptVersion = context.promptVersion
      providerHealth.totalTokens += response.usage.totalTokens
      providerHealth.totalCostUsd += response.estimatedCostUsd
      const attemptReservationUsd = reservation.reservedUsd / (RETRY_DELAYS.length + 1)
      const chargedCostUsd = Math.min(reservation.reservedUsd, response.estimatedCostUsd + response.retries * attemptReservationUsd)
      settleBudget(reservation, chargedCostUsd)
      recordCallProvenance({ requestId, runId: context.runId, provider: 'Gemini', model: response.model, task, promptVersion: context.promptVersion, status: 'succeeded', usage: response.usage, estimatedCostUsd: response.estimatedCostUsd, chargedCostUsd, retries: response.retries, recordedAt: new Date().toISOString() })

      pruneExpiredCache()
      if (responseCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = responseCache.keys().next().value
        if (oldestKey) responseCache.delete(oldestKey)
      }
      responseCache.set(requestKey, { response, expiresAt: Date.now() + CACHE_TTL_MS })
      return response
    } catch (error) {
      settleBudget(reservation, reservation.reservedUsd)
      const retries = error && typeof error === 'object' && 'retries' in error && typeof error.retries === 'number' ? error.retries : 0
      recordCallProvenance({ requestId, runId: context.runId, provider: 'Gemini', model, task, promptVersion: context.promptVersion, status: 'failed', chargedCostUsd: reservation.reservedUsd, retries, recordedAt: new Date().toISOString() })
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Gemini generation failed: ${message}`)
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
  ): Promise<{ text: string; model: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> => {
    const resp = await callLLM(prompt, systemPrompt, config as GatewayBudgetContext | undefined)
    return { text: resp.text, model: resp.model, usage: resp.usage }
  },
}

// ─── Current active provider label (for startup logs / metrics) ───────────────
export function getActiveProviderLabel(): string {
  return process.env.GEMINI_API_KEY?.trim() ? 'Gemini' : 'Gemini (not configured)'
}
