import https from 'node:https'
import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { chromium, type Browser } from 'playwright'
import * as browserPolicy from './browser-policy'
import { BrowserError, type BrowserPolicy, parseBrowserRequest, resolvePublicHost, validateBrowserUrl } from './browser-policy'
import { ClaimsGate, type ClaimRecord } from './claims-gate'
import { redactText } from './redact'

const hash = (text: string | Buffer) => createHash('sha256').update(text).digest('hex')

export const BROWSER_LIMITS = Object.freeze({
  pages: 3,
  concurrentRuns: 1,
  pageBytes: 1_000_000,
  textChars: 12_000,
  runMs: 45_000,
  requestMs: 8_000,
})

export interface BrowserEvidence {
  evidenceId: string
  requestedUrl: string
  sourceUrl: string
  title: string
  text: string
  retrievedAt: string
  contentHash: string
  responseBodyHash: string
  truncated: boolean
  trust: 'untrusted-web-content'
  reviewStatus: 'unreviewed'
}

/**
 * Increment22: the run snapshot now carries the claim ledger, so a stored run can
 * no longer assert "completed" without the evidence chain that produced it.
 * Schema stays 1.0.0: `claims` is additive and optional, so pre-Increment22
 * snapshots still load and verify.
 */
export interface BrowserResearch {
  schemaVersion: '1.0.0'
  runId: string
  goal: string
  status: 'completed' | 'partial' | 'failed'
  createdAt: string
  completedAt: string
  evidence: BrowserEvidence[]
  errors: Array<{ url: string; code: string; message: string }>
  events: Array<{ type: string; ts: string; evidenceId?: string; code?: string }>
  limitations: string[]
  claims?: ClaimRecord[]
}

export interface PageBody {
  body: Buffer
  contentType: string
}

/**
 * HTTPS connects only to the already validated IP; Host, SNI and TLS checks keep
 * the domain name. No proxy, no cookie jar, no redirects and no second DNS lookup.
 * Increment22 keeps this contract and makes the "no redirect" rule auditable by
 * naming it in the error instead of a generic rejection.
 */
export async function fetchPinnedDocument(
  url: URL,
  signal: AbortSignal,
  tlsOptions: https.RequestOptions = {},
): Promise<PageBody> {
  const destination = await resolvePublicHost(url.hostname)
  if (signal.aborted) throw new BrowserError('TIMEOUT', 'Research deadline exceeded.', 408)
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        // Test-only TLS trust (e.g. a loopback CA). Spread FIRST so it can never
        // override the pinning fields below.
        ...tlsOptions,
        method: 'GET',
        agent: false,
        signal,
        servername: url.hostname,
        lookup: ((_hostname: string, options: { all?: boolean }, callback: Function) => {
          // Pinned: the resolver result is reused, never re-consulted (DNS rebinding).
          if (options.all) callback(null, [destination])
          else callback(null, destination.address, destination.family)
        }) as any,
        headers: {
          'User-Agent': 'TextFX-ReadOnly-Research/1.0',
          Accept: 'text/html,text/plain',
          'Accept-Encoding': 'identity',
        },
      },
      response => {
        const status = response.statusCode || 0
        if (status < 200 || status >= 300) {
          response.destroy()
          // Increment20 contract keeps HTTP_REJECTED as the code; the message now
          // names a refused redirect explicitly so the refusal is auditable.
          const detail =
            status >= 300 && status < 400
              ? `Redirect (${status}) refused; the destination policy is not re-evaluated across hops.`
              : `Non-success response (${status}).`
          reject(new BrowserError('HTTP_REJECTED', detail))
          return
        }
        const contentType = String(response.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
        if (
          !['text/html', 'text/plain'].includes(contentType) ||
          (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity')
        ) {
          response.destroy()
          reject(new BrowserError('CONTENT_BLOCKED', 'Only uncompressed HTML/plain text is supported.'))
          return
        }
        if (Number(response.headers['content-length'] || 0) > BROWSER_LIMITS.pageBytes) {
          response.destroy()
          reject(new BrowserError('PAGE_TOO_LARGE', 'Page exceeds the byte budget.'))
          return
        }
        const chunks: Buffer[] = []
        let size = 0
        response.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > BROWSER_LIMITS.pageBytes) {
            response.destroy(new BrowserError('PAGE_TOO_LARGE', 'Page exceeds the byte budget.'))
            return
          }
          chunks.push(chunk)
        })
        response.on('end', () => resolve({ body: Buffer.concat(chunks), contentType }))
        response.on('error', reject)
      },
    )
    request.setTimeout(BROWSER_LIMITS.requestMs, () =>
      request.destroy(new BrowserError('TIMEOUT', 'Page request timed out.')),
    )
    request.on('error', (error: Error) => reject(error))
    request.end()
  })
}

export function makeEvidence(url: string, title: string, text: string, body: Buffer): BrowserEvidence {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  const excerpt = normalized.slice(0, BROWSER_LIMITS.textChars)
  return {
    evidenceId: randomUUID(),
    requestedUrl: url,
    sourceUrl: url,
    title: title.slice(0, 500),
    text: excerpt,
    retrievedAt: new Date().toISOString(),
    contentHash: hash(excerpt),
    responseBodyHash: hash(body),
    truncated: normalized.length > excerpt.length,
    trust: 'untrusted-web-content',
    reviewStatus: 'unreviewed',
  }
}

/**
 * Increment22 independent check: recomputes the evidence digest from the stored
 * artifact through a code path that never touches the transport. This proves the
 * artifact was not altered after retrieval and that the hash in the record belongs
 * to the text in the record. It does NOT prove the page's claims are true, and
 * nothing in this module claims otherwise.
 */
export function verifyEvidenceIntegrity(evidence: BrowserEvidence): { ok: boolean; detail: string } {
  const recomputedTextHash = hash(String(evidence.text).replace(/\r\n/g, '\n').trim().slice(0, BROWSER_LIMITS.textChars))
  if (recomputedTextHash !== evidence.contentHash) {
    return { ok: false, detail: `content hash mismatch for ${evidence.evidenceId}` }
  }
  if (!/^[0-9a-f]{64}$/.test(evidence.responseBodyHash || '')) {
    return { ok: false, detail: `response body hash missing for ${evidence.evidenceId}` }
  }
  if (!evidence.retrievedAt || Number.isNaN(Date.parse(evidence.retrievedAt))) {
    return { ok: false, detail: `retrieval timestamp invalid for ${evidence.evidenceId}` }
  }
  return { ok: true, detail: `evidence ${evidence.evidenceId} digest and timestamp verified` }
}

const rootDir = () =>
  process.env.TEXTFX_BROWSER_DATA_DIR || path.join(os.homedir(), '.textfx', 'browser-research')

function runPath(runId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId)) {
    throw new BrowserError('INVALID_ID', 'Invalid research ID.')
  }
  return path.join(rootDir(), `${runId}.json`)
}

export async function saveBrowserResearch(run: BrowserResearch): Promise<void> {
  const target = runPath(run.runId)
  await fs.mkdir(rootDir(), { recursive: true, mode: 0o700 })
  // Exclusive create: completed snapshots cannot silently be overwritten.
  const payload = JSON.stringify(run)
  const temp = `${target}.${randomUUID()}.tmp`
  try {
    await fs.writeFile(temp, JSON.stringify({ payload, sha256: hash(payload) }), { flag: 'wx', mode: 0o600 })
    await fs.link(temp, target)
  } finally {
    await fs.rm(temp, { force: true })
  }
}

export async function loadBrowserResearch(runId: string): Promise<BrowserResearch> {
  let raw: string
  try {
    raw = await fs.readFile(runPath(runId), 'utf8')
  } catch (error: any) {
    if (error.code === 'ENOENT') throw new BrowserError('NOT_FOUND', 'Research not found.', 404)
    throw error
  }
  try {
    const envelope = JSON.parse(raw)
    if (typeof envelope.payload !== 'string' || hash(envelope.payload) !== envelope.sha256) throw new Error('hash')
    const result = JSON.parse(envelope.payload) as BrowserResearch
    if (result.runId !== runId || result.schemaVersion !== '1.0.0') throw new Error('schema')
    return result
  } catch {
    throw new BrowserError('SNAPSHOT_INVALID', 'Research snapshot failed integrity validation.', 500)
  }
}

export async function deleteBrowserResearch(runId: string): Promise<void> {
  await fs.rm(runPath(runId), { force: true })
}

let active = 0
/** Synchronous reservation before the first await: one process-wide slot, no hidden waiting queue. */
export function reserveBrowserSlot(): () => void {
  if (active >= BROWSER_LIMITS.concurrentRuns) {
    throw new BrowserError('BROWSER_BUSY', 'Another browser run is active; retry later.', 429)
  }
  active++
  let released = false
  return () => {
    if (!released) {
      active--
      released = true
    }
  }
}

/**
 * Runs a read-only research pass. Each URL produces a claim that only becomes
 * `verified` after the stored artifact passes the independent integrity check;
 * a transport success on its own is capped at `succeeded`, and a run whose claims
 * are unverified cannot report `completed`.
 */
export async function runBrowserResearch(input: unknown, policy: BrowserPolicy): Promise<BrowserResearch> {
  const request = parseBrowserRequest(input, policy.allowedHosts)
  const release = reserveBrowserSlot()
  const controller = new AbortController()
  let browser: Browser | undefined
  const deadline = Date.now() + BROWSER_LIMITS.runMs
  const runId = randomUUID()
  const gate = new ClaimsGate()
  const timer = setTimeout(() => {
    controller.abort()
    void browser?.close().catch(() => {})
  }, BROWSER_LIMITS.runMs)

  const run: BrowserResearch = {
    schemaVersion: '1.0.0',
    runId,
    goal: request.goal,
    status: 'failed',
    createdAt: new Date().toISOString(),
    completedAt: '',
    evidence: [],
    errors: [],
    events: [{ type: 'browser.started', ts: new Date().toISOString() }],
    limitations: [
      'Read-only, supplied URLs only; no autonomous search, login, forms, clicks or publication.',
      'JavaScript, service workers, cookies from previous sessions, downloads and subresources are disabled.',
      'No redirects or query strings. Dynamic sites and protected pages may not work.',
      'Extracted text is untrusted and unreviewed; not proof of a marketing claim.',
      'Verified means the stored evidence matched its digest and timestamp, not that the page content is true.',
      'Local single-user snapshots; not a multi-tenant event store or model-cost ledger.',
    ],
    claims: [],
  }

  try {
    // Chromium sandbox stays enabled. Deployment must support it; no --no-sandbox fallback.
    browser = await chromium.launch({
      headless: true,
      chromiumSandbox: true,
      timeout: 10_000,
      args: ['--disable-background-networking'],
    })
    if (controller.signal.aborted) throw new BrowserError('TIMEOUT', 'Research deadline exceeded.', 408)
    const context = await browser.newContext({
      javaScriptEnabled: false,
      serviceWorkers: 'block',
      acceptDownloads: false,
    })
    await context.clearPermissions()

    for (const source of request.urls) {
      const claim = gate.register({ runId, action: `browser.fetch ${source}`, detail: 'read-only GET, single hop' })
      if (Date.now() >= deadline || controller.signal.aborted) {
        gate.fail(claim.claimId, 'research deadline exceeded before start')
        run.errors.push({ url: source, code: 'TIMEOUT', message: 'Research deadline exceeded.' })
        continue
      }
      gate.markAttempted(claim.claimId)
      const page = await context.newPage()
      let body: Buffer | undefined
      let networkError: unknown
      let fetched = false
      try {
        await page.route('**/*', async route => {
          if (
            !route.request().isNavigationRequest() ||
            route.request().frame() !== page.mainFrame() ||
            route.request().method() !== 'GET' ||
            route.request().url() !== source ||
            fetched
          ) {
            await route.abort().catch(() => {})
            return
          }
          fetched = true
          try {
            // Re-validate inside the browser: a JS or meta refresh cannot widen the allowlist.
            const url = validateBrowserUrl(route.request().url(), policy.allowedHosts)
            const result = await fetchPinnedDocument(url, controller.signal)
            body = result.body
            await route.fulfill({
              status: 200,
              body,
              contentType: result.contentType,
              headers: {
                'Content-Security-Policy':
                  "default-src 'none'; script-src 'none'; connect-src 'none'; form-action 'none'; frame-src 'none'; sandbox allow-same-origin",
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'no-store',
              },
            })
          } catch (error) {
            networkError = error
            await route.abort().catch(() => {})
          }
        })
        await page.goto(source, {
          waitUntil: 'domcontentloaded',
          timeout: Math.min(12_000, Math.max(1, deadline - Date.now())),
        })
        if (networkError) throw networkError
        if (!body) throw new BrowserError('NO_CONTENT', 'No allowed document was fetched.')
        const title = await page.title()
        const text = await page.locator('body').innerText({ timeout: 2000 })
        const evidence = makeEvidence(source, title, text, body)
        run.evidence.push(evidence)
        // Execution happened: this is transport success, nothing more yet.
        gate.recordExecution(claim.claimId, {
          source: `https-transport:${source}`,
          ok: true,
          detail: `status 200, ${body.length} bytes, response hash ${evidence.responseBodyHash}`,
          evidenceId: evidence.evidenceId,
        })
        gate.addEvidence(claim.claimId, {
          kind: 'observation',
          source: `extracted-text:${evidence.evidenceId}`,
          support: 'success',
          detail: `${evidence.text.length} chars captured, truncated=${evidence.truncated}`,
        })
        // Independent verification runs off the stored artifact, not the socket.
        const integrity = verifyEvidenceIntegrity(evidence)
        gate.addEvidence(claim.claimId, {
          kind: 'independent-verification',
          source: `digest-recheck:${evidence.evidenceId}`,
          support: integrity.ok ? 'success' : 'failure',
          detail: integrity.detail,
        })
        if (integrity.ok) {
          gate.verify(claim.claimId, {
            verificationRule: 'evidence.contentHash recomputed from stored text equals recorded hash, timestamp parses',
            detail: integrity.detail,
          })
        }
        const claimState = gate.getClaim(claim.claimId)?.state
        run.events.push({
          type: claimState === 'verified' ? 'browser.evidence-verified' : 'browser.evidence-captured',
          ts: evidence.retrievedAt,
          evidenceId: evidence.evidenceId,
        })
      } catch (error) {
        const actual = networkError || error
        const code = actual instanceof BrowserError ? actual.code : 'PAGE_FAILED'
        const message =
          actual instanceof BrowserError
            ? actual.message
            : 'Page could not be read within the permitted browser policy.'
        run.errors.push({ url: source, code, message })
        run.events.push({ type: 'browser.page-failed', ts: new Date().toISOString(), code })
        const current = gate.getClaim(claim.claimId)
        if (current && (current.state === 'requested' || current.state === 'attempted')) {
          gate.recordExecution(claim.claimId, { source: `https-transport:${source}`, ok: false, detail: `${code}: ${message}` })
        } else if (current && current.state === 'succeeded') {
          gate.addEvidence(claim.claimId, {
            kind: 'observation',
            source: `post-condition:${source}`,
            support: 'failure',
            detail: `${code}: ${message}`,
          })
        }
      } finally {
        await page.close().catch(() => {})
      }
    }

    const verifiedClaims = gate.list().filter(c => gate.evaluate(c.claimId).state === 'verified').length
    const totalClaims = gate.list().length
    if (run.errors.length) run.status = run.evidence.length ? 'partial' : 'failed'
    else if (verifiedClaims === totalClaims && totalClaims > 0) run.status = 'completed'
    else run.status = run.evidence.length ? 'partial' : 'failed'
  } catch (error) {
    run.errors.push({
      url: '',
      code: error instanceof BrowserError ? error.code : 'BROWSER_UNAVAILABLE',
      message:
        error instanceof BrowserError
          ? error.message
          : 'Chromium could not start. Install the browser and verify sandbox support.',
    })
    run.status = 'failed'
  } finally {
    clearTimeout(timer)
    try {
      await browser?.close()
      run.completedAt = new Date().toISOString()
      run.claims = gate.list()
      run.events.push({ type: `browser.${run.status}`, ts: run.completedAt })
      await saveBrowserResearch(run)
    } finally {
      release()
    }
  }
  return run
}

/** Exposed for tests and for callers that need the same redaction rule on errors. */
export const redactBrowserText = redactText
export const browserPolicySnapshot = () => browserPolicy.getBrowserPolicy()
