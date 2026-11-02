import https from 'node:https'
import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { chromium, type Browser } from 'playwright'
import { BrowserError, type BrowserPolicy, parseBrowserRequest, resolvePublicHost, validateBrowserUrl } from './browser-policy'

const hash = (text: string | Buffer) => createHash('sha256').update(text).digest('hex')
export const BROWSER_LIMITS = Object.freeze({ pages: 3, concurrentRuns: 1, pageBytes: 1_000_000, textChars: 12_000, runMs: 45_000, requestMs: 8_000 })
export interface BrowserEvidence {
  evidenceId: string; requestedUrl: string; sourceUrl: string; title: string; text: string
  retrievedAt: string; contentHash: string; responseBodyHash: string
  truncated: boolean; trust: 'untrusted-web-content'; reviewStatus: 'unreviewed'
}
export interface BrowserResearch {
  schemaVersion: '1.0.0'; runId: string; goal: string; status: 'completed' | 'partial' | 'failed'
  createdAt: string; completedAt: string; evidence: BrowserEvidence[]
  errors: Array<{ url: string; code: string; message: string }>
  events: Array<{ type: string; ts: string; evidenceId?: string; code?: string }>
  limitations: string[]
}
export interface PageBody { body: Buffer; contentType: string }

/** HTTPS connects only to the already validated IP; Host, SNI and TLS checks keep the domain name.
 * No proxy, no cookie jar, no redirects and no second DNS lookup. */
export async function fetchPinnedDocument(url: URL, signal: AbortSignal): Promise<PageBody> {
  const destination = await resolvePublicHost(url.hostname)
  if (signal.aborted) throw new BrowserError('TIMEOUT', 'Research deadline exceeded.', 408)
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: 'GET', agent: false, signal, servername: url.hostname,
      lookup: ((_hostname: string, options: { all?: boolean }, callback: Function) => {
        if (options.all) callback(null, [destination])
        else callback(null, destination.address, destination.family)
      }) as any,
      headers: { 'User-Agent': 'TextFX-ReadOnly-Research/1.0', Accept: 'text/html,text/plain', 'Accept-Encoding': 'identity' },
    }, response => {
      if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
        response.destroy(); reject(new BrowserError('HTTP_REJECTED', 'Non-success response or redirect refused.')); return
      }
      const contentType = String(response.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
      if (!['text/html', 'text/plain'].includes(contentType) || (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity')) {
        response.destroy(); reject(new BrowserError('CONTENT_BLOCKED', 'Only uncompressed HTML/plain text is supported.')); return
      }
      if (Number(response.headers['content-length'] || 0) > BROWSER_LIMITS.pageBytes) {
        response.destroy(); reject(new BrowserError('PAGE_TOO_LARGE', 'Page exceeds the byte budget.')); return
      }
      const chunks: Buffer[] = []; let size = 0
      response.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > BROWSER_LIMITS.pageBytes) { response.destroy(new BrowserError('PAGE_TOO_LARGE', 'Page exceeds the byte budget.')); return }
        chunks.push(chunk)
      })
      response.on('end', () => resolve({ body: Buffer.concat(chunks), contentType }))
      response.on('error', reject)
    })
    request.setTimeout(BROWSER_LIMITS.requestMs, () => request.destroy(new BrowserError('TIMEOUT', 'Page request timed out.')))
    request.on('error', reject)
    request.end()
  })
}

export function makeEvidence(url: string, title: string, text: string, body: Buffer): BrowserEvidence {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  const excerpt = normalized.slice(0, BROWSER_LIMITS.textChars)
  return { evidenceId: randomUUID(), requestedUrl: url, sourceUrl: url, title: title.slice(0, 500), text: excerpt,
    retrievedAt: new Date().toISOString(), contentHash: hash(excerpt), responseBodyHash: hash(body),
    truncated: normalized.length > excerpt.length, trust: 'untrusted-web-content', reviewStatus: 'unreviewed' }
}

const rootDir = () => process.env.TEXTFX_BROWSER_DATA_DIR || path.join(os.homedir(), '.textfx', 'browser-research')
function runPath(runId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId)) throw new BrowserError('INVALID_ID', 'Invalid research ID.')
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
  } finally { await fs.rm(temp, { force: true }) }
}
export async function loadBrowserResearch(runId: string): Promise<BrowserResearch> {
  let raw: string
  try { raw = await fs.readFile(runPath(runId), 'utf8') } catch (error: any) {
    if (error.code === 'ENOENT') throw new BrowserError('NOT_FOUND', 'Research not found.', 404)
    throw error
  }
  try {
    const envelope = JSON.parse(raw)
    if (typeof envelope.payload !== 'string' || hash(envelope.payload) !== envelope.sha256) throw new Error('hash')
    const result = JSON.parse(envelope.payload) as BrowserResearch
    if (result.runId !== runId || result.schemaVersion !== '1.0.0') throw new Error('schema')
    return result
  } catch { throw new BrowserError('SNAPSHOT_INVALID', 'Research snapshot failed integrity validation.', 500) }
}
export async function deleteBrowserResearch(runId: string): Promise<void> { await fs.rm(runPath(runId), { force: true }) }

let active = 0
/** Synchronous reservation before the first await: one process-wide slot, no hidden waiting queue. */
export function reserveBrowserSlot(): () => void {
  if (active >= BROWSER_LIMITS.concurrentRuns) throw new BrowserError('BROWSER_BUSY', 'Another browser run is active; retry later.', 429)
  active++
  let released = false
  return () => { if (!released) { active--; released = true } }
}

export async function runBrowserResearch(input: unknown, policy: BrowserPolicy): Promise<BrowserResearch> {
  const request = parseBrowserRequest(input, policy.allowedHosts)
  const release = reserveBrowserSlot()
  const controller = new AbortController()
  let browser: Browser | undefined
  const deadline = Date.now() + BROWSER_LIMITS.runMs
  const timer = setTimeout(() => { controller.abort(); void browser?.close().catch(() => {}) }, BROWSER_LIMITS.runMs)
  const run: BrowserResearch = {
    schemaVersion: '1.0.0', runId: randomUUID(), goal: request.goal, status: 'failed', createdAt: new Date().toISOString(), completedAt: '',
    evidence: [], errors: [], events: [{ type: 'browser.started', ts: new Date().toISOString() }],
    limitations: ['Read-only, supplied URLs only; no autonomous search, login, forms, clicks or publication.',
      'JavaScript, service workers, cookies from previous sessions, downloads and subresources are disabled.',
      'No redirects or query strings. Dynamic sites and protected pages may not work.',
      'Extracted text is untrusted and unreviewed; not proof of a marketing claim.',
      'Local single-user snapshots; not a multi-tenant event store or model-cost ledger.'],
  }
  try {
    // Chromium sandbox stays enabled. Deployment must support it; no --no-sandbox fallback.
    browser = await chromium.launch({ headless: true, chromiumSandbox: true, timeout: 10_000, args: ['--disable-background-networking'] })
    if (controller.signal.aborted) throw new BrowserError('TIMEOUT', 'Research deadline exceeded.', 408)
    const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block', acceptDownloads: false })
    await context.clearPermissions()
    for (const source of request.urls) {
      if (Date.now() >= deadline || controller.signal.aborted) { run.errors.push({ url: source, code: 'TIMEOUT', message: 'Research deadline exceeded.' }); continue }
      const page = await context.newPage()
      let body: Buffer | undefined
      let networkError: unknown
      let fetched = false
      try {
        await page.route('**/*', async route => {
          if (!route.request().isNavigationRequest() || route.request().frame() !== page.mainFrame() || route.request().method() !== 'GET' || route.request().url() !== source || fetched) {
            await route.abort().catch(() => {}); return
          }
          fetched = true
          try {
            const url = validateBrowserUrl(route.request().url(), policy.allowedHosts)
            const result = await fetchPinnedDocument(url, controller.signal)
            body = result.body
            await route.fulfill({ status: 200, body, contentType: result.contentType, headers: {
              'Content-Security-Policy': "default-src 'none'; script-src 'none'; connect-src 'none'; form-action 'none'; frame-src 'none'; sandbox allow-same-origin",
              'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store',
            } })
          } catch (error) { networkError = error; await route.abort().catch(() => {}) }
        })
        await page.goto(source, { waitUntil: 'domcontentloaded', timeout: Math.min(12_000, Math.max(1, deadline - Date.now())) })
        if (networkError) throw networkError
        if (!body) throw new BrowserError('NO_CONTENT', 'No allowed document was fetched.')
        const title = await page.title()
        const text = await page.locator('body').innerText({ timeout: 2000 })
        const evidence = makeEvidence(source, title, text, body)
        run.evidence.push(evidence)
        run.events.push({ type: 'browser.evidence-captured', ts: evidence.retrievedAt, evidenceId: evidence.evidenceId })
      } catch (error) {
        const actual = networkError || error
        const code = actual instanceof BrowserError ? actual.code : 'PAGE_FAILED'
        run.errors.push({ url: source, code, message: actual instanceof BrowserError ? actual.message : 'Page could not be read within the permitted browser policy.' })
        run.events.push({ type: 'browser.page-failed', ts: new Date().toISOString(), code })
      } finally { await page.close().catch(() => {}) }
    }
    run.status = run.errors.length ? (run.evidence.length ? 'partial' : 'failed') : 'completed'
  } catch (error) {
    run.errors.push({ url: '', code: error instanceof BrowserError ? error.code : 'BROWSER_UNAVAILABLE', message: error instanceof BrowserError ? error.message : 'Chromium could not start. Install the browser and verify sandbox support.' })
  } finally {
    clearTimeout(timer)
    try {
      await browser?.close()
      run.completedAt = new Date().toISOString()
      run.events.push({ type: `browser.${run.status}`, ts: run.completedAt })
      await saveBrowserResearch(run)
    } finally { release() }
  }
  return run
}
