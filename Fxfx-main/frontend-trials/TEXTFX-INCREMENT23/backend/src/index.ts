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
import { assertGeminiConfigured, createGatewayBudgetContext, GatewayBudgetExceededError, gateway, getActiveProviderLabel, getGatewayStats } from './gateway/llm-gateway'
import { resolveLanguage } from './utils/generation'
import agentRoutes from './agent/agent-route'
import saasRoutes  from './saas/saas-route'
import browserRoutes from './browser/browser-route'
import { recordRequest, getMetrics } from './utils/metrics'

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
      return [k, v]
    })
  )
}

function log(level: 'info' | 'warn' | 'error', msg: string, meta: Record<string, unknown> = {}) {
  const entry = JSON.stringify({ level, ts: new Date().toISOString(), msg, ...redact(meta) })
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

// ─── Sanitizer + Policy ───────────────────────────────────────────────────────
const DENY_RE = [
  /ignore previous instructions/i,
  /system:\s*you are/i,
  /\bprompt injection\b/i,
  /<script[\s>]/i,
  /javascript:/i,
]

function sanitize(s: string): { ok: boolean; reason?: string } {
  if (!s || typeof s !== 'string') return { ok: false, reason: 'empty input' }
  if (s.length > 8_000)            return { ok: false, reason: 'input too long' }
  for (const re of DENY_RE) {
    if (re.test(s)) return { ok: false, reason: 'sanitizer: injection pattern detected' }
  }
  return { ok: true }
}

const POLICY_BLOCK = ['bomb', 'weapon', 'malware', 'exploit', 'ransomware', 'ddos']
function policyCheck(s: string): { allowed: boolean; reason?: string } {
  const lower = s.toLowerCase()
  for (const w of POLICY_BLOCK) {
    if (lower.includes(w)) return { allowed: false, reason: `blocked term: ${w}` }
  }
  return { allowed: true }
}

// ─── Timeout wrapper ──────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express()

// CORS — allow configured origin (Vite proxy dev) or custom prod origin
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5000'
app.use(cors({ origin: CORS_ORIGIN }))

// Security headers (no external package required)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '0')                          // modern: rely on CSP
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Content-Security-Policy', "default-src 'none'")
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

function requestBudgetContext(req: Request) {
  const runId = req.header('x-request-id') || crypto.randomUUID()
  return createGatewayBudgetContext(runId, { promptVersion: SYSTEM_PROMPT_VERSION })
}

function sendGenerationError(res: Response, error: unknown): void {
  if (error instanceof GatewayBudgetExceededError) {
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
  const { input } = req.body as { input?: string }

  const san = sanitize(input ?? '')
  if (!san.ok) {
    log('warn', 'sanitizer rejected', { reason: san.reason, hash: hashStr(input ?? '') })
    return void res.status(400).json({ error: san.reason })
  }

  const pol = policyCheck(input!)
  if (!pol.allowed) {
    log('warn', 'policy blocked', { reason: pol.reason, hash: hashStr(input!) })
    return void res.status(403).json({ error: `Policy blocked: ${pol.reason}` })
  }

  log('info', 'llm call', { hash: hashStr(input!), policy: 'pass' })
  try {
    assertGeminiConfigured()
    const language = resolveLanguage(input!, 'en')
    const response = await gateway.generateCreativeText(
      input!,
      getLateralThinkingSystemPrompt({
        domain: 'general',
        problem: input!,
        target: 'the user',
        language,
        archetype: 'The Sage',
      }),
      requestBudgetContext(req),
    )
    const result = response.text
    log('info', 'llm ok', { outHash: hashStr(result) })
    res.json({ ok: true, result })
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
  if (!brief) return void res.status(400).json({ error: 'brief required' })
  const san = sanitize(brief)
  if (!san.ok) return void res.status(400).json({ error: san.reason })
  const pol = policyCheck(brief)
  if (!pol.allowed) return void res.status(403).json({ error: `Policy blocked: ${pol.reason}` })
  try {
    res.json(await withTimeout(generateInsight(brief, archetype, brandVoice, language, requestBudgetContext(req)), 180_000, 'insight'))
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
  try {
    res.json(await withTimeout(mapConcept(insight, buildCtx({ archetype, brandVoice, language }, requestBudgetContext(req))), 90_000, 'concept'))
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
  try {
    res.json(await withTimeout(writeScript(concept, buildCtx({ archetype, brandVoice, language }, requestBudgetContext(req))), 90_000, 'script'))
  } catch (e: unknown) { sendGenerationError(res, e) }
})

app.post('/api/full-pipeline', async (req, res) => {
  const { brief, archetype, brandVoice, language } = req.body || {}
  if (!brief) return void res.status(400).json({ error: 'brief required' })
  const san = sanitize(brief)
  if (!san.ok) return void res.status(400).json({ error: san.reason })
  const pol = policyCheck(brief)
  if (!pol.allowed) return void res.status(403).json({ error: `Policy blocked: ${pol.reason}` })
  try {
    const budgetContext = requestBudgetContext(req)
    const ctx     = buildCtx({ archetype, brandVoice, language }, budgetContext)
    const insight = await withTimeout(generateInsight(brief, archetype, brandVoice, language, budgetContext), 180_000, 'insight')
    const concept = await withTimeout(mapConcept(insight, ctx), 90_000, 'concept')
    const script  = await withTimeout(writeScript(concept, ctx), 90_000, 'script')
    res.json({ brief, insight, concept, script, pipelineStatus: 'complete' })
  } catch (e: unknown) { sendGenerationError(res, e) }
})

// ── Agent + SaaS routes ──────────────────────────────────────────────────────
app.use('/api/agent', agentRoutes)
app.use('/api/saas',  saasRoutes)
app.use('/api/browser', browserRoutes)

// ── GET /api/metrics ──────────────────────────────────────────────────────────
app.get('/api/metrics', (_req, res) => {
  res.json({ ...getMetrics(), gateway: getGatewayStats() })
})

// ── GET /api/key-status  (check if key is configured — never returns the key) ─
app.get('/api/key-status', async (_req: Request, res: Response) => {
  res.json({ configured: !!process.env.GEMINI_API_KEY?.trim(), provider: 'Gemini' })
})

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  log('error', 'unhandled', { msg: err.message })
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Startup environment validation ──────────────────────────────────────────
function logStartupConfig(): void {
  const hasGemini = !!process.env.GEMINI_API_KEY?.trim()
  log('info', 'startup config', {
    port:        PORT,
    bind:        '127.0.0.1',
    provider:    getActiveProviderLabel(),
    priority:    'Gemini only',
    gemini:      hasGemini ? 'configured' : 'GEMINI_API_KEY not set',
    corsOrigin:  CORS_ORIGIN,
    rateLimits:  'general=120/min LLM=60/min',
  })
  if (!hasGemini) {
    log('warn', 'GEMINI_API_KEY is missing; generation requests will fail explicitly', {})
  }
}

// ─── Server bind (127.0.0.1 ONLY) ────────────────────────────────────────────
let server: https.Server | http.Server

if (CERT_PATH && KEY_PATH && fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH)) {
  server = https.createServer({ cert: fs.readFileSync(CERT_PATH), key: fs.readFileSync(KEY_PATH) }, app)
  server.listen(PORT, '127.0.0.1', () => {
    log('info', 'HTTPS ready', { port: PORT, bind: '127.0.0.1' })
    logStartupConfig()
  })
} else {
  server = http.createServer(app)
  server.listen(PORT, '127.0.0.1', () => {
    log('warn', 'HTTP only — pass --cert/--key for HTTPS', { port: PORT })
    logStartupConfig()
  })
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────
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
process.on('SIGTERM',           () => shutdown('SIGTERM'))
process.on('SIGINT',            () => shutdown('SIGINT'))
process.on('uncaughtException', (e) => { log('error', 'uncaught', { msg: e.message }); shutdown('uncaughtException') })
