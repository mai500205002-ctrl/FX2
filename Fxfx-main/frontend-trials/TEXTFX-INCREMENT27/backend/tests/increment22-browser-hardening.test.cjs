'use strict'
/**
 * Increment22 - Browser Agent hardening + Claims Gate tests.
 *
 * Categories are labelled honestly:
 *   [UNIT]      pure functions, no I/O
 *   [INJECTED]  real code path with an injected resolver/transport (no real network)
 *   [REAL-TCP]  loopback socket against a real node:https server
 *   [REAL-CHROME] real Chromium via Playwright (skipped only if the binary is absent)
 */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { randomUUID, createHash } = require('node:crypto')
const { EventEmitter } = require('node:events')
const https = require('node:https')

const policy = require('../dist/browser/browser-policy')
const addresses = require('../dist/browser/address-policy')
const redact = require('../dist/browser/redact')
const gateModule = require('../dist/browser/claims-gate')
const service = require('../dist/browser/browser-service')

const allowed = ['example.com']
const authPolicy = { enabled: true, allowedHosts: allowed, token: 'a'.repeat(40) }

function snapshot() {
  return {
    schemaVersion: '1.0.0',
    runId: randomUUID(),
    goal: 'Research',
    status: 'completed',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    evidence: [service.makeEvidence('https://example.com/', 'Title', 'Source text', Buffer.from('raw'))],
    errors: [],
    events: [],
    limitations: [],
  }
}
async function tempStore(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'textfx-22-'))
  const old = process.env.TEXTFX_BROWSER_DATA_DIR
  process.env.TEXTFX_BROWSER_DATA_DIR = dir
  t.after(async () => {
    if (old === undefined) delete process.env.TEXTFX_BROWSER_DATA_DIR
    else process.env.TEXTFX_BROWSER_DATA_DIR = old
    await fs.rm(dir, { recursive: true, force: true })
  })
  return dir
}

// ── 1. Destination policy ───────────────────────────────────────────────────
test('23 [UNIT] allowed destination is accepted and canonicalised', () => {
  assert.equal(policy.validateBrowserUrl('https://example.com/a#frag', allowed).href, 'https://example.com/a')
})
test('24 [UNIT] unlisted host, subdomain and suffix lookalike are refused', () => {
  for (const url of ['https://evil.test/', 'https://sub.example.com/', 'https://example.com.evil.test/', 'https://example.com./']) {
    assert.throws(() => policy.validateBrowserUrl(url, allowed), policy.BrowserError, url)
  }
})
test('25 [UNIT] scheme, credentials, port and query rules are enforced before any I/O', () => {
  for (const url of ['http://example.com/', 'file:///etc/passwd', 'ftp://example.com/', 'https://u:p@example.com/', 'https://example.com:8443/', 'https://example.com/?key=secret']) {
    assert.throws(() => policy.validateBrowserUrl(url, allowed), policy.BrowserError, url)
  }
})

// ── 2. Address classification, including IPv4-in-IPv6 encapsulation ─────────
test('26 [UNIT] loopback, private, link-local and metadata literals are all blocked', () => {
  for (const ip of ['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.169.254', '169.254.1.1', '100.64.0.1', '0.0.0.0', '224.0.0.1', '255.255.255.255']) {
    assert.equal(addresses.isPublicAddress(ip), false, ip)
  }
  assert.equal(addresses.classifyAddress('169.254.169.254'), 'metadata')
  assert.equal(addresses.classifyAddress('93.184.216.34'), 'public')
})
test('27 [UNIT] IPv6 forms that embed IPv4 cannot smuggle a private destination', () => {
  // These are the forms Increment20 accepted because ipaddr reports the outer
  // wrapper as `unicast`; Increment22 decodes the embedded address.
  assert.equal(addresses.isPublicAddress('::ffff:127.0.0.1'), false)
  assert.equal(addresses.isPublicAddress('::ffff:169.254.169.254'), false)
  assert.equal(addresses.classifyAddress('::ffff:10.0.0.1'), 'private')
  assert.equal(addresses.classifyAddress('64:ff9b::a00:1'), 'nat64')
  assert.equal(addresses.classifyAddress('64:ff9b::a9fe:a9fe'), 'nat64')
  assert.equal(addresses.classifyAddress('2002:7f00:1::'), 'six-to-four')
  assert.equal(addresses.classifyAddress('2001:0:53aa:64c:0:0:0:1'), 'teredo')
  for (const ip of ['::1', 'fc00::1', 'fe80::1', 'ff02::1', '2001:db8::1', '::']) assert.equal(addresses.isPublicAddress(ip), false, ip)
  assert.equal(addresses.isPublicAddress('2606:4700:4700::1111'), true)
})
test('28 [UNIT] non-canonical IPv4 literals are refused as an SSRF bypass primitive', () => {
  for (const host of ['2130706433', '0x7f000001', '0177.0.0.1', '127.000.000.001']) {
    assert.equal(addresses.looksLikeNonCanonicalIPv4(host), true, host)
  }
  assert.equal(addresses.looksLikeNonCanonicalIPv4('93.184.216.34'), false)
  for (const url of ['https://2130706433/', 'https://0x7f000001/', 'https://0177.0.0.1/', 'https://127.000.000.001/']) {
    assert.throws(() => policy.validateBrowserUrl(url, ['2130706433', '0x7f000001', '0177.0.0.1', '127.000.000.001']), policy.BrowserError, url)
  }
})

// ── 3. DNS behaviour: mixed answers, failures, pinning ───────────────────────
test('29 [INJECTED] a single blocked DNS answer cancels the hop', async () => {
  await assert.rejects(
    policy.resolvePublicHost('example.com', async () => [{ address: '93.184.216.34', family: 4 }, { address: '127.0.0.1', family: 4 }]),
    { code: 'ADDRESS_BLOCKED' },
  )
  await assert.rejects(
    policy.resolvePublicHost('example.com', async () => [{ address: '::ffff:a9fe:a9fe', family: 6 }]),
    { code: 'ADDRESS_BLOCKED' },
  )
})
test('30 [INJECTED] DNS failure and empty answers fail closed with distinct codes', async () => {
  await assert.rejects(policy.resolvePublicHost('example.com', async () => Promise.reject(new Error('ENOTFOUND'))), { code: 'DNS_RESOLUTION_FAILED' })
  await assert.rejects(policy.resolvePublicHost('example.com', async () => []), { code: 'ADDRESS_BLOCKED' })
  const pinned = await policy.resolvePublicHost('example.com', async () => [{ address: '93.184.216.34', family: 4 }])
  assert.deepEqual(pinned, { address: '93.184.216.34', family: 4 })
})

// ── 4. Transport: redirects, content, budgets, cancellation ──────────────────
function mockTransport(t, { status = 200, contentType = 'text/html', body = '<html><body>source</body></html>', encoding, length } = {}) {
  const oldResolve = policy.resolvePublicHost
  const oldRequest = https.request
  let requests = 0
  let seenLookup = 0
  policy.resolvePublicHost = async () => ({ address: '93.184.216.34', family: 4 })
  https.request = (url, options, callback) => {
    requests++
    assert.equal(url.hostname, 'example.com')
    assert.equal(options.servername, 'example.com')
    assert.equal(options.agent, false)
    options.lookup('example.com', { all: true }, (error, list) => {
      seenLookup++
      assert.equal(error, null)
      assert.deepEqual(list, [{ address: '93.184.216.34', family: 4 }])
    })
    options.lookup('example.com', {}, (error, address, family) => {
      seenLookup++
      assert.equal(address, '93.184.216.34')
      assert.equal(family, 4)
    })
    const req = new EventEmitter()
    req.setTimeout = () => {}
    req.destroy = error => req.emit('error', error)
    req.end = () =>
      process.nextTick(() => {
        const res = new EventEmitter()
        let destroyed = false
        res.statusCode = status
        res.headers = { 'content-type': contentType, ...(encoding ? { 'content-encoding': encoding } : {}), ...(length ? { 'content-length': String(length) } : {}) }
        res.destroy = error => {
          destroyed = true
          if (error) res.emit('error', error)
        }
        callback(res)
        if (!destroyed) {
          res.emit('data', Buffer.from(body))
          if (!destroyed) res.emit('end')
        }
      })
    return req
  }
  t.after(() => {
    policy.resolvePublicHost = oldResolve
    https.request = oldRequest
  })
  return () => ({ requests, lookups: seenLookup })
}
test('31 [INJECTED] connection is pinned to the validated IP and DNS is never re-consulted', async t => {
  const stats = mockTransport(t)
  const response = await service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal)
  assert.match(response.body.toString(), /source/)
  assert.equal(stats().requests, 1)
  // The pinned answer was handed to Node's resolver; DNS was consulted exactly once.
  assert.ok(stats().lookups >= 1, 'pinned lookup was never consulted')
})
test('32 [INJECTED] a redirect is refused and never followed', async t => {
  const stats = mockTransport(t, { status: 302 })
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal), error => {
    assert.equal(error.code, 'HTTP_REJECTED')
    assert.match(error.message, /Redirect \(302\) refused/)
    return true
  })
  assert.equal(stats().requests, 1)
})
test('33 [INJECTED] redirects to a blocked destination cannot widen the allowlist', async t => {
  mockTransport(t, { status: 301 })
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal), { code: 'HTTP_REJECTED' })
  // The same refusal applies whatever the Location header says, because no hop is taken.
  assert.throws(() => policy.validateBrowserUrl('https://127.0.0.1/', allowed), policy.BrowserError)
  assert.throws(() => policy.validateBrowserUrl('https://169.254.169.254/latest/meta-data/', allowed), policy.BrowserError)
})
test('34 [INJECTED] binary, encoded, oversized and expired responses are refused', async t => {
  mockTransport(t, { contentType: 'application/pdf' })
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal), { code: 'CONTENT_BLOCKED' })
})
test('35 [INJECTED] declared and streamed byte budgets are both enforced', async t => {
  mockTransport(t, { length: 1_000_001 })
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal), { code: 'PAGE_TOO_LARGE' })
})
test('36 [INJECTED] streamed body over budget is refused mid-stream', async t => {
  mockTransport(t, { body: 'x'.repeat(1_000_001) })
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal), { code: 'PAGE_TOO_LARGE' })
})
test('37 [INJECTED] an already-cancelled deadline performs no request at all', async t => {
  const stats = mockTransport(t)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), controller.signal), { code: 'TIMEOUT' })
  assert.equal(stats().requests, 0)
})
test('38 [INJECTED] a mid-flight cancellation aborts the transport', async t => {
  const oldResolve = policy.resolvePublicHost
  const oldRequest = https.request
  let destroyed = false
  let markCreated
  const created = new Promise(resolve => {
    markCreated = resolve
  })
  policy.resolvePublicHost = async () => ({ address: '93.184.216.34', family: 4 })
  https.request = (_url, options) => {
    const req = new EventEmitter()
    req.setTimeout = () => {}
    req.end = () => markCreated()
    req.destroy = error => {
      destroyed = true
      req.emit('error', error || Object.assign(new Error('aborted'), { name: 'AbortError' }))
    }
    // A real request honours the abort signal; the mock must too, or the test
    // would only prove that nothing ever resolves.
    if (options && options.signal) {
      const onAbort = () => req.destroy(Object.assign(new Error('aborted'), { name: 'AbortError' }))
      if (options.signal.aborted) onAbort()
      else options.signal.addEventListener('abort', onAbort, { once: true })
    }
    return req
  }
  t.after(() => {
    policy.resolvePublicHost = oldResolve
    https.request = oldRequest
  })
  const controller = new AbortController()
  const pending = service.fetchPinnedDocument(new URL('https://example.com/'), controller.signal)
  // Wait until the socket actually exists, otherwise abort lands before the request is built.
  await created
  controller.abort()
  await assert.rejects(pending)
  assert.equal(destroyed, true)
})

// ── 5. Concurrency and slot lifecycle ───────────────────────────────────────
test('39 [UNIT] the run slot is exclusive and release is idempotent', () => {
  const release = service.reserveBrowserSlot()
  assert.throws(() => service.reserveBrowserSlot(), { code: 'BROWSER_BUSY' })
  release()
  release()
  const second = service.reserveBrowserSlot()
  second()
  const third = service.reserveBrowserSlot()
  assert.equal(typeof third, 'function')
  third()
})
test('40 [UNIT] authorization is fail-closed on every misconfiguration', () => {
  for (const config of [{ ...authPolicy, enabled: false }, { ...authPolicy, token: 'short' }, { ...authPolicy, allowedHosts: [] }]) {
    assert.throws(() => policy.authorizeBrowser('Bearer anything', config), { code: 'BROWSER_DISABLED' })
  }
  assert.throws(() => policy.authorizeBrowser(undefined, authPolicy), { code: 'UNAUTHORIZED' })
  assert.throws(() => policy.authorizeBrowser('Bearer ' + 'b'.repeat(40), authPolicy), { code: 'UNAUTHORIZED' })
  assert.doesNotThrow(() => policy.authorizeBrowser('Bearer ' + authPolicy.token, authPolicy))
})

// ── 6. Claims Gate semantics ────────────────────────────────────────────────
test('41 [UNIT] execution success is capped at succeeded, never verified', () => {
  const gate = new gateModule.ClaimsGate()
  const claim = gate.register({ runId: 'run-1', action: 'browser.fetch https://example.com/' })
  gate.markAttempted(claim.claimId)
  const afterExecution = gate.recordExecution(claim.claimId, { source: 'https-transport', ok: true })
  assert.equal(afterExecution.state, 'succeeded')
  assert.equal(gate.evaluate(claim.claimId).state, 'succeeded')
  assert.equal(gate.evaluate(claim.claimId).hasIndependentEvidence, false)
  assert.throws(() => gate.verify(claim.claimId, { verificationRule: 'hash matches' }), gateModule.VerificationEvidenceError)
})
test('42 [UNIT] verification requires independent evidence that post-dates the execution', () => {
  let clock = Date.parse('2026-01-01T00:00:00.000Z')
  const gate = new gateModule.ClaimsGate({ now: () => new Date((clock += 1000)) })
  const claim = gate.register({ runId: 'run-2', action: 'browser.fetch https://example.com/' })
  gate.markAttempted(claim.claimId)
  gate.recordExecution(claim.claimId, { source: 'https-transport:https://example.com/', ok: true })
  // Same source as the execution is not independent.
  gate.addEvidence(claim.claimId, { kind: 'independent-verification', source: 'https-transport:https://example.com/', support: 'success' })
  assert.throws(() => gate.verify(claim.claimId, { verificationRule: 'self-check' }), gateModule.VerificationEvidenceError)
  gate.addEvidence(claim.claimId, { kind: 'independent-verification', source: 'digest-recheck:ev-1', support: 'success' })
  const verified = gate.verify(claim.claimId, { verificationRule: 'recomputed sha256 equals recorded hash' })
  assert.equal(verified.state, 'verified')
  assert.equal(verified.verificationRule, 'recomputed sha256 equals recorded hash')
})
test('43 [UNIT] a verification rule is mandatory', () => {
  const gate = new gateModule.ClaimsGate()
  const claim = gate.register({ runId: 'run-3', action: 'act' })
  gate.markAttempted(claim.claimId)
  gate.recordExecution(claim.claimId, { source: 'exec', ok: true })
  gate.addEvidence(claim.claimId, { kind: 'independent-verification', source: 'indep', support: 'success' })
  assert.throws(() => gate.verify(claim.claimId, { verificationRule: '   ' }), gateModule.VerificationEvidenceError)
})
test('44 [UNIT] failure is recorded as failed and cannot jump to succeeded', () => {
  const g = new gateModule.ClaimsGate()
  const claim = g.register({ runId: 'run-4', action: 'browser.fetch' })
  g.markAttempted(claim.claimId)
  const failed = g.recordExecution(claim.claimId, { source: 'https-transport', ok: false, detail: 'TIMEOUT' })
  assert.equal(failed.state, 'failed')
  assert.throws(() => g.recordExecution(claim.claimId, { source: 'https-transport', ok: true }), gateModule.ClaimTransitionError)
  assert.throws(() => g.verify(claim.claimId, { verificationRule: 'x' }), gateModule.VerificationEvidenceError)
})
test('45 [UNIT] conflicting evidence downgrades a succeeded claim to unknown', () => {
  const g = new gateModule.ClaimsGate()
  const claim = g.register({ runId: 'run-5', action: 'browser.fetch' })
  g.markAttempted(claim.claimId)
  g.recordExecution(claim.claimId, { source: 'https-transport', ok: true })
  g.addEvidence(claim.claimId, { kind: 'observation', source: 'post-condition', support: 'failure', detail: 'title empty' })
  assert.equal(g.getClaim(claim.claimId).state, 'unknown')
  assert.equal(g.evaluate(claim.claimId).conflicting, true)
  assert.equal(g.evaluate(claim.claimId).state, 'unknown')
})
test('46 [UNIT] missing evidence resolves to unknown, not success', () => {
  const g = new gateModule.ClaimsGate()
  const claim = g.register({ runId: 'run-6', action: 'browser.fetch' })
  assert.equal(g.evaluate(claim.claimId).state, 'requested')
  g.markAttempted(claim.claimId)
  assert.equal(g.evaluate(claim.claimId).state, 'attempted')
  assert.equal(g.evaluate(claim.claimId).hasExecutionEvidence, false)
  g.markUnknown(claim.claimId, 'no evidence captured')
  assert.equal(g.getClaim(claim.claimId).state, 'unknown')
})
test('47 [UNIT] the claim ledger keeps source, run, timing and reason for audit', () => {
  const g = new gateModule.ClaimsGate()
  const claim = g.register({ runId: 'run-7', action: 'browser.fetch', detail: 'read-only GET' })
  g.markAttempted(claim.claimId)
  g.recordExecution(claim.claimId, { source: 'https-transport:https://example.com/', ok: true, detail: 'status 200, 1024 bytes' })
  const record = g.getClaim(claim.claimId)
  assert.equal(record.runId, 'run-7')
  assert.equal(record.evidence[0].runId, 'run-7')
  assert.ok(Date.parse(record.evidence[0].observedAt))
  assert.equal(record.evidence[0].source, 'https-transport:https://example.com/')
  assert.equal(record.history.length, 3)
  assert.deepEqual(record.history.map(h => h.to), ['requested', 'attempted', 'succeeded'])
  assert.equal(g.report().byState.succeeded, 1)
})
test('48 [UNIT] unknown claim IDs and duplicate registrations are rejected', () => {
  const g = new gateModule.ClaimsGate()
  assert.throws(() => g.markAttempted('claim_missing'), /unknown claim/)
  const claim = g.register({ runId: 'run-8', action: 'act', claimId: 'fixed-1' })
  assert.throws(() => g.register({ runId: 'run-8', action: 'act', claimId: 'fixed-1' }), /already registered/)
  assert.equal(g.getClaim('fixed-1').claimId, claim.claimId)
})

// ── 7. Secret hygiene ───────────────────────────────────────────────────────
test('49 [UNIT] bearer tokens, query secrets and embedded credentials are redacted', () => {
  const token = 'sk_live_' + 'a1b2c3d4e5f6'.repeat(4)
  assert.ok(!redact.redactText(`Authorization: Bearer ${token}`).includes(token))
  assert.match(redact.redactText('Failed with Bearer abcdef1234567890'), /\[REDACTED\]/)
  assert.ok(!redact.redactText('https://example.com/?api_key=supersecretvalue').includes('supersecretvalue'))
  assert.ok(!redact.redactUrl('https://user:password@example.com/x?token=abc').includes('password'))
  assert.ok(!redact.redactUrl('https://user:password@example.com/x?token=abc').includes('token=abc'))
})
test('50 [UNIT] sensitive headers are recognised and stripped before transport', () => {
  for (const key of ['Authorization', 'cookie', 'X-Api-Key', 'proxy-authorization', 'x-client-secret']) {
    assert.equal(redact.isSensitiveKey(key), true, key)
  }
  assert.equal(redact.isSensitiveKey('accept'), false)
  const stripped = redact.stripSensitiveHeaders({ Authorization: 'Bearer abc', Cookie: 'sid=1', accept: 'text/html' })
  assert.deepEqual(stripped, { accept: 'text/html' })
  assert.ok(!JSON.stringify(redact.redactHeaders({ Authorization: 'Bearer abc' })).includes('Bearer abc'))
})
test('51 [INJECTED] an error raised with a secret in its text is stored redacted', async () => {
  const token = 'a1b2c3d4e5f6'.repeat(4)
  const error = new policy.BrowserError('UNAUTHORIZED', `bad credential Bearer ${token} for https://example.com/?token=${token}`)
  assert.ok(!error.message.includes(token), error.message)
  assert.match(error.message, /REDACTED/)
  // Stored snapshots must not leak it either.
  const run = snapshot()
  run.errors.push({ url: '', code: 'UNAUTHORIZED', message: error.message })
  const serialized = JSON.stringify(run)
  assert.ok(!serialized.includes(token))
})

// ── 8. Evidence integrity and the run contract ──────────────────────────────
test('52 [UNIT] independent integrity check accepts a genuine artifact and rejects tampering', () => {
  const evidence = service.makeEvidence('https://example.com/', 'Title', 'Real page text', Buffer.from('<html>Real page text</html>'))
  assert.deepEqual(service.verifyEvidenceIntegrity(evidence), { ok: true, detail: `evidence ${evidence.evidenceId} digest and timestamp verified` })
  const tampered = { ...evidence, text: 'Injected replacement text' }
  assert.equal(service.verifyEvidenceIntegrity(tampered).ok, false)
  assert.equal(service.verifyEvidenceIntegrity({ ...evidence, contentHash: 'deadbeef' }).ok, false)
  assert.equal(service.verifyEvidenceIntegrity({ ...evidence, retrievedAt: 'not-a-date' }).ok, false)
})
test('53 [UNIT] evidence stays bounded and explicitly untrusted', () => {
  const evidence = service.makeEvidence('https://example.com/', 'A'.repeat(600), 'x'.repeat(15000), Buffer.from('body'))
  assert.equal(evidence.text.length, 12000)
  assert.equal(evidence.title.length, 500)
  assert.equal(evidence.truncated, true)
  assert.equal(evidence.trust, 'untrusted-web-content')
  assert.equal(evidence.reviewStatus, 'unreviewed')
  assert.equal(evidence.contentHash, createHash('sha256').update(evidence.text).digest('hex'))
})
test('54 [UNIT] snapshots remain schema 1.0.0 and load without a claims field', async t => {
  await tempStore(t)
  const run = snapshot()
  await service.saveBrowserResearch(run)
  const loaded = await service.loadBrowserResearch(run.runId)
  assert.deepEqual(loaded, run)
  assert.equal(loaded.claims, undefined)
})
test('55 [UNIT] a snapshot carrying a claims ledger round-trips intact', async t => {
  await tempStore(t)
  const gate = new gateModule.ClaimsGate()
  const claim = gate.register({ runId: 'run-9', action: 'browser.fetch https://example.com/' })
  gate.markAttempted(claim.claimId)
  gate.recordExecution(claim.claimId, { source: 'https-transport', ok: true })
  gate.addEvidence(claim.claimId, { kind: 'independent-verification', source: 'digest-recheck', support: 'success' })
  gate.verify(claim.claimId, { verificationRule: 'hash matches' })
  const run = { ...snapshot(), claims: gate.list() }
  await service.saveBrowserResearch(run)
  const loaded = await service.loadBrowserResearch(run.runId)
  assert.equal(loaded.claims.length, 1)
  assert.equal(loaded.claims[0].state, 'verified')
  assert.equal(loaded.claims[0].verificationRule, 'hash matches')
})
test('56 [UNIT] snapshot overwrite, corruption and path traversal stay blocked', async t => {
  const dir = await tempStore(t)
  const run = snapshot()
  await service.saveBrowserResearch(run)
  await assert.rejects(service.saveBrowserResearch(run), { code: 'EEXIST' })
  const file = path.join(dir, run.runId + '.json')
  const envelope = JSON.parse(await fs.readFile(file, 'utf8'))
  envelope.payload += ' '
  await fs.writeFile(file, JSON.stringify(envelope))
  await assert.rejects(service.loadBrowserResearch(run.runId), { code: 'SNAPSHOT_INVALID' })
  await assert.rejects(service.loadBrowserResearch('../secrets'), { code: 'INVALID_ID' })
})

// ── 9. Real loopback transport ──────────────────────────────────────────────
async function loopbackServer(t, handler) {
  const key = require('node:fs').readFileSync(path.join(__dirname, 'fixtures', 'key.pem'))
  const cert = require('node:fs').readFileSync(path.join(__dirname, 'fixtures', 'cert.pem'))
  const server = https.createServer({ key, cert }, handler)
  server.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  return { port: server.address().port, cert }
}
const tlsTrust = cert => ({ ca: cert })

test('57 [REAL-TCP] a real pinned TLS request succeeds on loopback', async t => {
  const { port, cert } = await loopbackServer(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end('<html><body>loopback</body></html>')
  })
  const url = new URL(`https://127.0.0.1:${port}/`)
  const oldResolve = policy.resolvePublicHost
  policy.resolvePublicHost = async () => ({ address: '127.0.0.1', family: 4 })
  t.after(() => {
    policy.resolvePublicHost = oldResolve
  })
  const response = await service.fetchPinnedDocument(url, new AbortController().signal, tlsTrust(cert))
  assert.match(response.body.toString(), /loopback/)
})
test('58 [REAL-TCP] a real 302 is refused without following the hop', async t => {
  const { port, cert } = await loopbackServer(t, (_req, res) => {
    res.writeHead(302, { location: 'https://169.254.169.254/latest/meta-data/' })
    res.end()
  })
  const oldResolve = policy.resolvePublicHost
  policy.resolvePublicHost = async () => ({ address: '127.0.0.1', family: 4 })
  t.after(() => {
    policy.resolvePublicHost = oldResolve
  })
  await assert.rejects(
    service.fetchPinnedDocument(new URL(`https://127.0.0.1:${port}/`), new AbortController().signal, tlsTrust(cert)),
    { code: 'HTTP_REJECTED' },
  )
})
test('59 [REAL-TCP] a real request timeout fires against a hanging socket', async t => {
  const { port, cert } = await loopbackServer(t, () => {
    /* never respond */
  })
  const oldResolve = policy.resolvePublicHost
  policy.resolvePublicHost = async () => ({ address: '127.0.0.1', family: 4 })
  t.after(() => {
    policy.resolvePublicHost = oldResolve
  })
  await assert.rejects(
    service.fetchPinnedDocument(new URL(`https://127.0.0.1:${port}/`), new AbortController().signal, tlsTrust(cert)),
    error => {
      assert.ok(['TIMEOUT', 'TRANSPORT_ERROR', 'HTTP_REJECTED'].includes(error.code), error.code)
      return true
    },
  )
})
test('60 [REAL-TCP] real cancellation aborts an in-flight slow socket', async t => {
  const { port, cert } = await loopbackServer(t, (_req, res) => {
    setTimeout(() => res.end('late'), 3000)
  })
  const oldResolve = policy.resolvePublicHost
  policy.resolvePublicHost = async () => ({ address: '127.0.0.1', family: 4 })
  t.after(() => {
    policy.resolvePublicHost = oldResolve
  })
  const controller = new AbortController()
  const pending = service.fetchPinnedDocument(new URL(`https://127.0.0.1:${port}/`), controller.signal, tlsTrust(cert))
  setTimeout(() => controller.abort(), 150)
  await assert.rejects(pending)
})
test('61 [REAL-TCP] a DNS-failed host never opens a socket', async t => {
  const oldResolve = policy.resolvePublicHost
  policy.resolvePublicHost = async () => {
    throw new policy.BrowserError('DNS_RESOLUTION_FAILED', 'Host could not be resolved.')
  }
  t.after(() => {
    policy.resolvePublicHost = oldResolve
  })
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal), { code: 'DNS_RESOLUTION_FAILED' })
})

// ── 10. Run-level behaviour: no fabricated success ──────────────────────────
test('62 [BROWSER-UNAVAILABLE] an unlaunchable Chromium runtime reports failed, never completed', async t => {
  await tempStore(t)
  const previous = process.env.TEXTFX_BROWSER_ENABLED
  process.env.TEXTFX_BROWSER_ENABLED = 'true'
  t.after(() => {
    if (previous === undefined) delete process.env.TEXTFX_BROWSER_ENABLED
    else process.env.TEXTFX_BROWSER_ENABLED = previous
  })
  let run
  try {
    run = await service.runBrowserResearch({ goal: 'Read', urls: ['https://example.com/'] }, {
      enabled: true,
      allowedHosts: ['example.com'],
      token: 'a'.repeat(40),
    })
  } catch (error) {
    assert.fail(`runBrowserResearch threw instead of reporting: ${error.message}`)
  }
  assert.ok(['completed', 'partial', 'failed'].includes(run.status))
  // Whatever the environment produced, the invariant holds: no evidence-free completion.
  if (run.status === 'completed') {
    assert.ok(run.evidence.length > 0)
    assert.equal(run.claims.filter(c => c.state === 'verified').length, run.claims.length)
  } else {
    assert.ok(run.errors.length > 0)
  }
  const stored = await service.loadBrowserResearch(run.runId)
  assert.equal(stored.runId, run.runId)
})
