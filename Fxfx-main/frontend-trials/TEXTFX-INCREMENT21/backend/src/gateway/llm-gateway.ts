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

import { createHash } from 'node:crypto'
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

function makeRequestKey(prompt: string, systemPrompt: string): string {
  const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'
  const temperature = process.env.GEMINI_TEMPERATURE || '0.8'
  const maxTokens = process.env.GEMINI_MAX_OUTPUT_TOKENS || '8192'
  return createHash('sha256')
    .update(JSON.stringify([model, temperature, maxTokens, systemPrompt, prompt]))
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

async function callGemini(prompt: string, systemPrompt: string): Promise<GatewayResponse> {
  const client    = getGeminiClient()
  const model     = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'
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

const RETRY_DELAYS = [500, 1000]   // ms between retry attempts
const CALL_TIMEOUT = 30_000         // 30 s per attempt

async function executeWithRetry(
  name: ProviderName,
  prompt: string,
  systemPrompt: string,
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
      const resp = await withTimeout(callGemini(prompt, systemPrompt), CALL_TIMEOUT)

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

  throw lastErr ?? new Error(`Provider ${name} failed`)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Primary gateway call. Returns a full GatewayResponse with observability data.
 */
export async function callLLM(
  prompt:       string,
  systemPrompt: string,
): Promise<GatewayResponse> {
  gatewayTotalCalls++
  assertGeminiConfigured()

  const requestKey = makeRequestKey(prompt, systemPrompt)
  pruneExpiredCache()
  const cached = responseCache.get(requestKey)
  if (cached) {
    gatewayCacheHits++
    return { ...cached.response, cacheHit: true, latencyMs: 0 }
  }

  const inflight = inflightRequests.get(requestKey)
  if (inflight) {
    gatewayDedupHits++
    return inflight
  }

  const request = (async () => {
    if (activeCalls >= MAX_CONCURRENT) gatewayQueuedCalls++
    await acquireSlot()
    try {
      const providerHealth = getHealth('Gemini')
      providerHealth.totalCalls++
      const response = await executeWithRetry('Gemini', prompt, systemPrompt)
      providerHealth.totalTokens += response.usage.totalTokens
      providerHealth.totalCostUsd += response.estimatedCostUsd

      pruneExpiredCache()
      if (responseCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = responseCache.keys().next().value
        if (oldestKey) responseCache.delete(oldestKey)
      }
      responseCache.set(requestKey, { response, expiresAt: Date.now() + CACHE_TTL_MS })
      return response
    } catch (error) {
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
    _config?:     unknown,
  ): Promise<{ text: string; model: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> => {
    const resp = await callLLM(prompt, systemPrompt)
    return { text: resp.text, model: resp.model, usage: resp.usage }
  },
}

// ─── Current active provider label (for startup logs / metrics) ───────────────
export function getActiveProviderLabel(): string {
  return process.env.GEMINI_API_KEY?.trim() ? 'Gemini' : 'Gemini (not configured)'
}
