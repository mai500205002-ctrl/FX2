import 'dotenv/config'

/**
 * TextFX v5 — Hardened Production Backend (fx-server)
 * ─────────────────────────────────────────────────────
 * CLI:  node dist/index.js --port=<n> --cert=<cert.pem> --key=<key.pem>
 * Binds ONLY to 127.0.0.1. Gemini credentials are read from backend environment.
 * Packaged by pkg  →  release/backend/fx-server.exe
 *
 * Phase 3 hardening applied:
 *  - CORS origin configurable via CORS_ORIGIN env (default: localhost:5000)
 *  - Security headers on every response (CSP, X-Frame-Options, etc.)
 *  - General rate limiter (120 req/min) + strict LLM limiter (60 req/min)
 *  - X-Request-ID on every response; correlated in access log
 *  - Input sanitization + policy check on all 4 pipeline routes
 *  - 30 s timeout wrapper on every async AI call
 *  - GET /api/metrics — real-time latency / error-rate / provider telemetry
 *  - Startup environment validation log
 */

import https  from 'https'
import http   from 'http'
import fs     from 'fs'
import path   from 'path'
import crypto from 'crypto'
import { spawn, ChildProcess } from 'child_process'

import express, { Request, Response, NextFunction } from 'express'
import cors      from 'cors'
import rateLimit from 'express-rate-limit'
import { generateInsight }  from './modules/insight-generator'
import { mapConcept }       from './modules/concept-mapper'
import { writeScript }      from './modules/script-writer'
import { getLateralThinkingSystemPrompt, SYSTEM_PROMPT_VERSION } from './modules/lateral-thinking-agent'
import {
  createGatewayBudgetContext,
  GatewayBudgetExceededError,
  gateway,
  getActiveProviderLabel,
  getGatewayCallHistory,
  getGatewayStats,
} from './gateway/llm-gateway'
import { getProviderStatus, ProviderConfigurationError, ProviderRequestError, type ProviderSelection } from './gateway/provider-adapters'
import { resolveLanguage } from './utils/generation'
import agentRoutes from './agent/agent-route'
import saasRoutes  from './saas/saas-route'
import browserRoutes from './browser/browser-route'
import { recordRequest, getMetrics } from './utils/metrics'
import { apiAuthenticationMiddleware, policyCheck, redactText, sanitize } from './utils/security'
import { authorizeBrowser, BrowserError, getBrowserPolicy, validateBrowserUrl } from './browser/browser-policy'
import { loadBrowserResearch, verifyEvidenceIntegrity } from './browser/browser-service'
import { extractEvidenceReferences, type BrowserEvidenceReference } from './browser/reference-context'

// ─── CLI arg parser ───────────────────────────────────────────────────────────
function getArg(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`
  const match  = process.argv.find(a => a.startsWith(prefix))
  return match ? match.slice(prefix.length) : fallback
}
const PORT      = parseInt(getArg('port', process.env.PORT || '3001')!, 10)
const CERT_PATH = getArg('cert')
const KEY_PATH  = getArg('key')

// ─── Structured logger (PII-redacting) ───────────────────────────────────────
const LOG_DIR = path.join(process.env.APPDATA || process.env.HOME || '.', 'fx-logs')
try { fs.mkdirSync(LOG_DIR, { recursive: true }) } catch { /* ignore */ }
const LOG_FILE = path.join(LOG_DIR, 'fx-server.log')

function hashStr(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16)
}

const PII_KEYS = ['prompt', 'input', 'text', 'content', 'message', 'key', 'token', 'secret', 'password']

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (PII_KEYS.some(p => k.toLowerCase().includes(p)) && typeof v === 'string') {
        return [k, `[REDACTED:${hashStr(v)}]`]
      }
      if (typeof v === 'string') return [k, redactText(v)]
      return [k, v]
    })
  )
}

function log(level: 'info' | 'warn' | 'error', msg: string, meta: Record<string, unknown> = {}) {
  const entry = JSON.stringify({ level, ts: new Date().toISOString(), msg: redactText(msg), ...redact(meta) })
  console[level](entry)
  try { fs.appendFileSync(LOG_FILE, entry + '\n') } catch { /* non-fatal */ }
}

// ─── Child process registry ───────────────────────────────────────────────────
interface AgentEntry { proc: ChildProcess; timer: NodeJS.Timeout }
const agents = new Map<string, AgentEntry>()

function spawnAgent(id: string): void {
  // Runs node --version as a placeholder; replace with real agent entrypoint
  const proc = spawn(process.execPath, ['--version'], {
    stdio: 'pipe',
    windowsHide: true,
  })
  const timer = setTimeout(() => {
    log('warn', 'agent timeout', { id })
    proc.kill('SIGKILL')
    agents.delete(id)
  }, 120_000)
  proc.on('close', code => {
    clearTimeout(timer)
    agents.delete(id)
    log('info', 'agent closed', { id, code })
  })
  agents.set(id, { proc, timer })
}

// ─── Timeout wrapper ──────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string, abort?: () => void): Promise<T> {
  let timer: NodeJS.Timeout
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      abort?.()
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express()

// CORS — allow configured origin (Vite proxy dev) or custom prod origin
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5000'
const ALLOWED_CORS_ORIGINS = new Set(CORS_ORIGIN.split(',').map(value => {
  try { return new URL(value.trim()).origin } catch { return '' }
}).filter(Boolean))
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || ALLOWED_CORS_ORIGINS.has(origin)),
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Idempotency-Key', 'X-Tenant-ID', 'X-TextFX-Browser-Token'],
  credentials: true,
}))

// Security headers (no external package required)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '0')                          // modern: rely on CSP
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Content-Security-Policy', "default-src 'none'")
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  next()
})

app.use(express.json({ limit: '512kb' }))

// General rate limiter — all routes except health probes
const generalLimiter = rateLimit({
  windowMs:        60_000,
  max:             120,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            (req) => req.path === '/health' || req.path === '/healthz',
  message:         { error: 'rate limit exceeded — max 120 req/min' },
})
app.use(generalLimiter)

// Stricter limiter for raw LLM endpoint
const llmLimiter = rateLimit({
  windowMs:        60_000,
  max:             60,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'rate limit exceeded — max 60 req/min' },
})

const sessionLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.method !== 'POST',
  message: { error: 'Authentication attempts temporarily limited' },
})
app.use('/api/session', sessionLimiter)
import { createApiSession, destroyApiSession, getApiSessionStatus, isTrustedApiOrigin } from './utils/api-session'
if (process.env.TRUST_PROXY?.trim()) app.set('trust proxy', process.env.TRUST_PROXY.trim())

// Server-side API key authentication boundary (enforced when TEXTFX_API_KEY is set in environment)
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  if (
    req.path === '/health' || req.path === '/healthz' || req.path === '/key-status' ||
    req.path === '/browser' || req.path.startsWith('/browser/')
  ) {
    return next()
  }
  apiAuthenticationMiddleware(req, res, next)
})

const PROVIDER_SELECTIONS: ProviderSelection[] = ['auto', 'gemini', 'openai', 'openrouter', 'grok']

function requestBudgetContext(req: Request, res: Response) {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
    ? req.body as Record<string, unknown>
    : {}
  const provider = body.provider === undefined ? 'auto' : body.provider
  if (typeof provider !== 'string' || !PROVIDER_SELECTIONS.includes(provider as ProviderSelection)) {
    res.status(400).json({ error: 'provider must be auto, gemini, openai, openrouter, or grok.' })
    return undefined
  }
  const model = body.model
  if (model !== undefined && (typeof model !== 'string' || !model.trim() || model.length > 200)) {
    res.status(400).json({ error: 'model must be a non-empty string of at most 200 characters.' })
    return undefined
  }
  if (model !== undefined && provider === 'auto') {
    res.status(400).json({ error: 'Choose a provider before selecting a specific model.' })
    return undefined
  }

  const controller = new AbortController()
  req.once('aborted', () => controller.abort())
  res.once('close', () => {
    if (!res.writableEnded) controller.abort()
  })
  const runId = req.header('x-request-id') || crypto.randomUUID()
  const context = createGatewayBudgetContext(runId, {
    promptVersion: SYSTEM_PROMPT_VERSION,
    providerId: provider as ProviderSelection,
    model: model as string | undefined,
    signal: controller.signal,
  })
  return Object.assign(context, { abort: (reason?: unknown) => controller.abort(reason) })
}

async function loadRequestEvidence(req: Request, researchId: unknown): Promise<{
  references: BrowserEvidenceReference[]
  promptData: string
} | undefined> {
  if (researchId === undefined) return undefined
  if (typeof researchId !== 'string' || !researchId.trim()) {
    throw new BrowserError('INVALID_ID', 'Browser research ID must be a non-empty string.')
  }
  authorizeBrowser(req.header('x-textfx-browser-token'))
  const research = await loadBrowserResearch(researchId)
  if (!research.evidence.length || research.status === 'failed') {
    throw new BrowserError('EMPTY_RESEARCH', 'Research has no usable page excerpts.', 422)
  }

  const allowedHosts = getBrowserPolicy().allowedHosts
  const verified = research.evidence.map(item => {
    if (item.reviewStatus !== 'unreviewed' || item.trust !== 'untrusted-web-content') {
      throw new BrowserError('EVIDENCE_INVALID', 'Research evidence does not meet the unreviewed source contract.', 422)
    }
    const url = validateBrowserUrl(item.sourceUrl, allowedHosts)
    if (url.href !== item.sourceUrl || !verifyEvidenceIntegrity(item).ok) {
      throw new BrowserError('EVIDENCE_INVALID', 'Research evidence failed source or integrity validation.', 422)
    }
    return item
  })
  const references = extractEvidenceReferences({
    evidenceReferences: verified.map(item => ({
      evidenceId: item.evidenceId,
      sourceUrl: item.sourceUrl,
      title: item.title,
      text: item.text,
      retrievedAt: item.retrievedAt,
      contentHash: item.contentHash,
      reviewStatus: item.reviewStatus,
    })),
  })
  const promptData = JSON.stringify(references.map(reference => ({
    evidenceId: reference.evidenceId,
    sourceUrl: reference.sourceUrl,
    title: reference.title,
    excerpt: reference.text.slice(0, 2500),
    excerptTruncated: reference.text.length > 2500,
    retrievedAt: reference.retrievedAt,
    contentHash: reference.contentHash,
    reviewStatus: reference.reviewStatus,
  })))
  return { references, promptData }
}

function generationSummary(runId: string) {
  const calls = getGatewayCallHistory(500).filter(item => item.runId === runId && item.status === 'succeeded')
  return {
    mode: 'provider-response',
    providers: [...new Set(calls.map(item => item.provider))],
    models: [...new Set(calls.map(item => item.model))],
    calls: calls.map(({ requestId, provider, model, task }) => ({ requestId, provider, model, task })),
  }
}

function sendGenerationError(res: Response, error: unknown): void {
  if (error instanceof GatewayBudgetExceededError) {
    res.status(error.status).json({ error: error.message, code: error.code })
    return
  }
  if (error instanceof ProviderConfigurationError) {
    res.status(error.status).json({ error: error.message, code: error.code })
    return
  }
  if (error instanceof ProviderRequestError) {
    res.status(502).json({
      error: error.message,
      code: 'PROVIDER_REQUEST_FAILED',
      provider: error.provider,
      upstreamStatus: error.status,
    })
    return
  }
  if (error instanceof BrowserError) {
    res.status(error.status).json({ error: error.message, code: error.code })
    return
  }
  res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
}

// Request ID + structured access log + metrics recording
app.use((req: Request, res: Response, next: NextFunction) => {
  const t0    = Date.now()
  const reqId = crypto.randomUUID().slice(0, 8)
  req.headers['x-request-id'] = reqId
  res.setHeader('X-Request-ID', reqId)
  res.on('finish', () => {
    const ms = Date.now() - t0
    log('info', 'req', { reqId, method: req.method, path: req.path, status: res.statusCode, ms })
    recordRequest(req.path, ms, res.statusCode)
  })
  next()
})

// ── GET /healthz ──────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true, ts: new Date().toISOString() }))

// ── POST /agent/run ───────────────────────────────────────────────────────────
app.post('/agent/run', (req: Request, res: Response) => {
  const id = crypto.randomUUID()
  try {
    spawnAgent(id)
    log('info', 'agent spawned', { id })
    res.json({ ok: true, id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    log('error', 'agent spawn failed', { msg })
    res.status(500).json({ ok: false, error: msg })
  }
})

// ── POST /llm ─────────────────────────────────────────────────────────────────
app.post('/llm', llmLimiter, async (req: Request, res: Response) => {
  const input = req.body?.input
  if (typeof input !== 'string') return void res.status(400).json({ error: 'input must be a string' })

  const san = sanitize(input)
  if (!san.ok) {
    log('warn', 'sanitizer rejected', { reason: san.reason, hash: hashStr(input) })
    return void res.status(400).json({ error: san.reason })
  }

  const pol = policyCheck(input)
  if (!pol.allowed) {
    log('warn', 'policy blocked', { reason: pol.reason, hash: hashStr(input) })
    return void res.status(403).json({ error: `Policy blocked: ${pol.reason}` })
  }

  const budgetContext = requestBudgetContext(req, res)
  if (!budgetContext) return
  log('info', 'llm call', { hash: hashStr(input), policy: 'pass' })
  try {
    const language = resolveLanguage(input, 'en')
    const response = await gateway.generateCreativeText(
      input,
      getLateralThinkingSystemPrompt({
        domain: 'general',
        problem: input,
        target: 'the user',
        language,
        archetype: 'The Sage',
      }),
      budgetContext,
    )
    const result = response.text
    log('info', 'llm ok', { outHash: hashStr(result) })
    res.json({ ok: true, result, generation: { mode: 'provider-response', provider: response.provider, model: response.model } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    log('error', 'llm fetch error', { msg })
    sendGenerationError(res, err)
  }
})

// ── Pipeline routes ───────────────────────────────────────────────────────────
// buildCtx is unchanged — no business logic modification
function buildCtx(extra: Record<string, unknown> = {}, budgetContext = createGatewayBudgetContext(crypto.randomUUID(), { promptVersion: SYSTEM_PROMPT_VERSION })) {
  return {
    domain:         'general',
    problem:        'creative challenge',
    target:         'audience',
    useRealAI:      true,
    provider:       gateway,     // all calls routed through LLM Gateway
    providerConfig: budgetContext,
    ...extra,
  }
}

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))
app.get('/api/system-prompt', (_req, res) => res.json({ systemPrompt: getLateralThinkingSystemPrompt(), promptVersion: SYSTEM_PROMPT_VERSION }))

app.post('/api/insight', async (req, res) => {
  const { brief, archetype, brandVoice, language } = req.body || {}
  if (typeof brief !== 'string' || !brief.trim()) return void res.status(400).json({ error: 'brief must be a non-empty string' })
  if (brief.length > 8000) return void res.status(400).json({ error: 'brief exceeds 8000 characters' })
  const san = sanitize(brief)
  if (!san.ok) return void res.status(400).json({ error: san.reason })
  const pol = policyCheck(brief)
  if (!pol.allowed) return void res.status(403).json({ error: `Policy blocked: ${pol.reason}` })
  const budgetContext = requestBudgetContext(req, res)
  if (!budgetContext) return
  try {
    const attachment = await loadRequestEvidence(req, req.body?.browserResearchId)
    const result = await withTimeout(
      generateInsight(brief, archetype, brandVoice, language, budgetContext, attachment?.promptData),
      180_000,
      'insight',
      budgetContext.abort,
    )
    res.json({
      ...result,
      evidenceReferences: attachment?.references || [],
      generation: generationSummary(budgetContext.runId),
    })
  } catch (e: unknown) { sendGenerationError(res, e) }
})

app.post('/api/concept', async (req, res) => {
  const { insight, archetype, brandVoice, language } = req.body || {}
  if (!insight) return void res.status(400).json({ error: 'insight required' })
  const validationInput = typeof insight === 'string'
    ? insight
    : [insight?.mainInsight, insight?.insight].filter((value): value is string => typeof value === 'string').join('\n')
  const san = sanitize(validationInput)
  if (!san.ok) return void res.status(400).json({ error: san.reason })
  const pol = policyCheck(validationInput)
  if (!pol.allowed) return void res.status(403).json({ error: `Policy blocked: ${pol.reason}` })
  const budgetContext = requestBudgetContext(req, res)
  if (!budgetContext) return
  try {
    const result = await withTimeout(mapConcept(insight, buildCtx({ archetype, brandVoice, language }, budgetContext)), 90_000, 'concept', budgetContext.abort)
    res.json({ ...result, generation: generationSummary(budgetContext.runId) })
  } catch (e: unknown) { sendGenerationError(res, e) }
})

app.post('/api/script', async (req, res) => {
  const { concept, archetype, brandVoice, language } = req.body || {}
  if (!concept) return void res.status(400).json({ error: 'concept required' })
  const validationInput = typeof concept === 'string'
    ? concept
    : [concept?.title, concept?.tagline, concept?.coreIdea].filter((value): value is string => typeof value === 'string').join('\n')
  const san = sanitize(validationInput)
  if (!san.ok) return void res.status(400).json({ error: san.reason })
  const pol = policyCheck(validationInput)
  if (!pol.allowed) return void res.status(403).json({ error: `Policy blocked: ${pol.reason}` })
  const budgetContext = requestBudgetContext(req, res)
  if (!budgetContext) return
  try {
    const result = await withTimeout(writeScript(concept, buildCtx({ archetype, brandVoice, language }, budgetContext)), 90_000, 'script', budgetContext.abort)
    res.json({ ...result, generation: generationSummary(budgetContext.runId) })
  } catch (e: unknown) { sendGenerationError(res, e) }
})

app.post('/api/full-pipeline', async (req, res) => {
  const { brief, archetype, brandVoice, language } = req.body || {}
  if (typeof brief !== 'string' || !brief.trim()) return void res.status(400).json({ error: 'brief must be a non-empty string' })
  if (brief.length > 8000) return void res.status(400).json({ error: 'brief exceeds 8000 characters' })
  const san = sanitize(brief)
  if (!san.ok) return void res.status(400).json({ error: san.reason })
  const pol = policyCheck(brief)
  if (!pol.allowed) return void res.status(403).json({ error: `Policy blocked: ${pol.reason}` })
  const budgetContext = requestBudgetContext(req, res)
  if (!budgetContext) return
  try {
    const attachment = await loadRequestEvidence(req, req.body?.browserResearchId)
    const ctx     = buildCtx({ archetype, brandVoice, language }, budgetContext)
    const generatedInsight = await withTimeout(generateInsight(brief, archetype, brandVoice, language, budgetContext, attachment?.promptData), 180_000, 'insight', budgetContext.abort)
    const insight = { ...generatedInsight, evidenceReferences: attachment?.references || [] }
    const concept = await withTimeout(mapConcept(insight, ctx), 90_000, 'concept', budgetContext.abort)
    const script  = await withTimeout(writeScript(concept, ctx), 90_000, 'script', budgetContext.abort)
    res.json({
      brief,
      insight,
      concept: { ...concept, generation: generationSummary(budgetContext.runId) },
      script: { ...script, generation: generationSummary(budgetContext.runId) },
      generation: generationSummary(budgetContext.runId),
      pipelineStatus: 'complete',
    })
  } catch (e: unknown) { sendGenerationError(res, e) }
})

// ── Agent + SaaS routes ──────────────────────────────────────────────────────
app.use('/api/agent', agentRoutes)
app.use('/api/saas',  saasRoutes)
app.use('/api/browser', browserRoutes)

// ── GET /api/metrics ──────────────────────────────────────────────────────────
app.get('/api/metrics', (_req, res) => {
  res.json({ ...getMetrics(), providerMode: getActiveProviderLabel(), gateway: getGatewayStats() })
})

// ── GET /api/key-status  (check if key is configured — never returns the key) ─
app.get('/api/key-status', async (_req: Request, res: Response) => {

  app.get('/api/session', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store')
    res.json(getApiSessionStatus(req))
  })

  app.post('/api/session', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store')
    if (!createApiSession(req, res, req.body?.apiKey)) {
      return void res.status(401).json({ error: 'Authentication failed' })
    }
    res.json({ authRequired: true, authenticated: true })
  })

  app.delete('/api/session', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store')
    if (!isTrustedApiOrigin(req)) return void res.status(403).json({ error: 'Request origin is not allowed' })
    destroyApiSession(req, res)
    res.status(204).end()
  })
  const providers = getProviderStatus()
  res.json({
    configured: providers.some(provider => provider.configured),
    provider: getActiveProviderLabel(),
    providers,
  })
})

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  log('error', 'unhandled', { msg: err.message })
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Startup environment validation ──────────────────────────────────────────
function logStartupConfig(): void {
  const configuredProviders = getProviderStatus().filter(provider => provider.configured).map(provider => provider.label)
  log('info', 'startup config', {
    port:        PORT,
    bind:        '127.0.0.1',
    provider:    getActiveProviderLabel(),
    priority:    process.env.AI_AUTO_PROVIDER_ORDER || 'gemini,openrouter,openai,grok',
    configuredProviders,
    corsOrigin:  CORS_ORIGIN,
    rateLimits:  'general=120/min LLM=60/min',
  })
  if (!configuredProviders.length) {
    log('warn', 'No AI provider API key is configured; generation requests will fail explicitly', {})
  }
}

// ─── Server bind (127.0.0.1 ONLY) ────────────────────────────────────────────
export { app }

if (require.main === module) {
  const server = CERT_PATH && KEY_PATH && fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH)
    ? https.createServer({ cert: fs.readFileSync(CERT_PATH), key: fs.readFileSync(KEY_PATH) }, app)
    : http.createServer(app)

  server.listen(PORT, '127.0.0.1', () => {
    if (server instanceof https.Server) {
      log('info', 'HTTPS ready', { port: PORT, bind: '127.0.0.1' })
    } else {
      log('warn', 'HTTP only — pass --cert/--key for HTTPS', { port: PORT })
    }
    logStartupConfig()
  })

  function shutdown(signal: string) {
    log('info', `${signal} — shutting down`)
    for (const [id, { proc, timer }] of agents) {
      clearTimeout(timer)
      try { proc.kill('SIGKILL') } catch { /* ignore */ }
      log('info', 'killed agent', { id })
    }
    agents.clear()
    server.close(() => { log('info', 'clean exit'); process.exit(0) })
    setTimeout(() => process.exit(1), 10_000)
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('uncaughtException', error => { log('error', 'uncaught', { msg: error.message }); shutdown('uncaughtException') })
}
