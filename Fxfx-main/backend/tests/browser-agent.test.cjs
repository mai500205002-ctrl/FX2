'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { randomUUID, createHash } = require('node:crypto')
const { EventEmitter } = require('node:events')
const https = require('node:https')
const express = require('express')
const policy = require('../dist/browser/browser-policy')
const service = require('../dist/browser/browser-service')
const router = require('../dist/browser/browser-route').default
const allowed = ['example.com']
const authPolicy = { enabled: true, allowedHosts: allowed, token: 'a'.repeat(40) }

function snapshot() {
  return { schemaVersion: '1.0.0', runId: randomUUID(), goal: 'Research', status: 'completed', createdAt: new Date().toISOString(), completedAt: new Date().toISOString(),
    evidence: [service.makeEvidence('https://example.com/', 'Title', 'Source text', Buffer.from('raw'))], errors: [], events: [], limitations: [] }
}
async function tempStore(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'textfx-browser-test-'))
  const old = process.env.TEXTFX_BROWSER_DATA_DIR
  process.env.TEXTFX_BROWSER_DATA_DIR = dir
  t.after(async () => { if (old === undefined) delete process.env.TEXTFX_BROWSER_DATA_DIR; else process.env.TEXTFX_BROWSER_DATA_DIR = old; await fs.rm(dir, { recursive: true, force: true }) })
  return dir
}

test('URL validation accepts exact HTTPS host and canonicalizes fragments', () => {
  assert.equal(policy.validateBrowserUrl('https://example.com/a#part', allowed).href, 'https://example.com/a')
})
test('URL policy blocks schemes, credentials, ports, IP forms, suffix tricks and query secrets', () => {
  for (const url of ['http://example.com', 'file:///etc/passwd', 'javascript:alert(1)', 'https://example.com:8443', 'https://u:p@example.com', 'https://example.com.evil.test', 'https://sub.example.com', 'https://example.com.', 'https://127.0.0.1', 'https://2130706433', 'https://[::1]', 'https://example.com/?key=secret']) {
    assert.throws(() => policy.validateBrowserUrl(url, allowed), policy.BrowserError, url)
  }
})
test('IP policy blocks private, loopback, link-local, metadata, mapped IPv6 and reserved ranges', () => {
  for (const ip of ['127.0.0.1', '0.0.0.0', '10.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '224.0.0.1', '192.0.2.1', '::1', 'fc00::1', 'fe80::1', 'ff02::1', '::ffff:127.0.0.1', 'not-an-ip']) assert.equal(policy.isPublicAddress(ip), false, ip)
  assert.equal(policy.isPublicAddress('93.184.216.34'), true)
  assert.equal(policy.isPublicAddress('2606:4700:4700::1111'), true)
})
test('DNS resolution rejects mixed public/private answers', async () => {
  await assert.rejects(policy.resolvePublicHost('example.com', async () => [{ address: '93.184.216.34', family: 4 }, { address: '127.0.0.1', family: 4 }]), { code: 'ADDRESS_BLOCKED' })
})
test('DNS resolution rejects empty answers and selects a validated destination', async () => {
  await assert.rejects(policy.resolvePublicHost('example.com', async () => []), { code: 'ADDRESS_BLOCKED' })
  assert.deepEqual(await policy.resolvePublicHost('example.com', async () => [{ address: '93.184.216.34', family: 4 }]), { address: '93.184.216.34', family: 4 })
})
test('browser authorization is fail-closed and rejects short tokens and missing bearer credentials', () => {
  for (const config of [{ ...authPolicy, enabled: false }, { ...authPolicy, token: 'short' }, { ...authPolicy, allowedHosts: [] }]) assert.throws(() => policy.authorizeBrowser('Bearer anything', config), { code: 'BROWSER_DISABLED' })
  assert.throws(() => policy.authorizeBrowser(undefined, authPolicy), { code: 'UNAUTHORIZED' })
  assert.throws(() => policy.authorizeBrowser('Bearer ' + 'b'.repeat(40), authPolicy), { code: 'UNAUTHORIZED' })
  assert.doesNotThrow(() => policy.authorizeBrowser('Bearer ' + authPolicy.token, authPolicy))
})
test('request contract bounds page budget, deduplicates and rejects arbitrary actions', () => {
  assert.deepEqual(policy.parseBrowserRequest({ goal: ' Read ', urls: ['https://example.com/', 'https://example.com/#x'] }, allowed).urls, ['https://example.com/'])
  for (const input of [null, [], { goal: '', urls: [] }, { goal: 'x', urls: Array(4).fill('https://example.com') }, { goal: 'x', urls: ['https://example.com'], action: 'click' }, { goal: 'x'.repeat(1001), urls: ['https://example.com'] }]) assert.throws(() => policy.parseBrowserRequest(input, allowed), policy.BrowserError)
})
test('evidence is bounded, fingerprinted and explicitly unreviewed', () => {
  const evidence = service.makeEvidence('https://example.com/', 'A'.repeat(600), 'x'.repeat(15000), Buffer.from('body'))
  assert.equal(evidence.text.length, 12000); assert.equal(evidence.title.length, 500); assert.equal(evidence.truncated, true)
  assert.equal(evidence.reviewStatus, 'unreviewed'); assert.equal(evidence.trust, 'untrusted-web-content')
  assert.equal(evidence.contentHash, createHash('sha256').update(evidence.text).digest('hex'))
  assert.equal(evidence.responseBodyHash, createHash('sha256').update('body').digest('hex'))
})
test('run slot is reserved synchronously and released idempotently', () => {
  const release = service.reserveBrowserSlot()
  assert.throws(() => service.reserveBrowserSlot(), { code: 'BROWSER_BUSY' })
  release(); release(); const second = service.reserveBrowserSlot(); second()
})
test('snapshot restoration reuses stored data without launching Chromium or calling a model', async t => {
  await tempStore(t); const run = snapshot()
  await service.saveBrowserResearch(run)
  assert.deepEqual(await service.loadBrowserResearch(run.runId), run)
})
test('snapshot storage refuses overwrite', async t => {
  await tempStore(t); const run = snapshot(); await service.saveBrowserResearch(run)
  await assert.rejects(service.saveBrowserResearch(run), { code: 'EEXIST' })
})
test('snapshot corruption is detected', async t => {
  const dir = await tempStore(t); const run = snapshot(); await service.saveBrowserResearch(run)
  const file = path.join(dir, run.runId + '.json'); const envelope = JSON.parse(await fs.readFile(file, 'utf8'))
  envelope.payload += ' '; await fs.writeFile(file, JSON.stringify(envelope))
  await assert.rejects(service.loadBrowserResearch(run.runId), { code: 'SNAPSHOT_INVALID' })
})
test('snapshot deletion and missing IDs are handled without path traversal', async t => {
  await tempStore(t); const run = snapshot(); await service.saveBrowserResearch(run)
  await service.deleteBrowserResearch(run.runId)
  await assert.rejects(service.loadBrowserResearch(run.runId), { code: 'NOT_FOUND' })
  await assert.rejects(service.loadBrowserResearch('../secrets'), { code: 'INVALID_ID' })
})

function mockTransport(t, { status = 200, contentType = 'text/html', body = '<html><body>source</body></html>', encoding, length } = {}) {
  const oldResolve = policy.resolvePublicHost, oldRequest = https.request
  let requests = 0
  policy.resolvePublicHost = async () => ({ address: '93.184.216.34', family: 4 })
  https.request = (url, options, callback) => {
    requests++
    assert.equal(url.hostname, 'example.com'); assert.equal(options.servername, 'example.com'); assert.equal(options.agent, false)
    options.lookup('example.com', { all: true }, (error, addresses) => { assert.equal(error, null); assert.deepEqual(addresses, [{ address: '93.184.216.34', family: 4 }]) })
    options.lookup('example.com', {}, (error, address, family) => { assert.equal(address, '93.184.216.34'); assert.equal(family, 4) })
    const req = new EventEmitter(); req.setTimeout = () => {}; req.destroy = error => req.emit('error', error)
    req.end = () => process.nextTick(() => {
      const res = new EventEmitter(); let destroyed = false
      res.statusCode = status; res.headers = { 'content-type': contentType, ...(encoding ? { 'content-encoding': encoding } : {}), ...(length ? { 'content-length': String(length) } : {}) }
      res.destroy = error => { destroyed = true; if (error) res.emit('error', error) }
      callback(res)
      if (!destroyed) { res.emit('data', Buffer.from(body)); if (!destroyed) res.emit('end') }
    })
    return req
  }
  t.after(() => { policy.resolvePublicHost = oldResolve; https.request = oldRequest })
  return () => requests
}
test('pinned transport preserves TLS host and supports Node all-address lookup without re-resolving', async t => {
  const count = mockTransport(t)
  const response = await service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal)
  assert.match(response.body.toString(), /source/); assert.equal(count(), 1)
})
test('transport does not follow redirects', async t => {
  const count = mockTransport(t, { status: 302 })
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal), { code: 'HTTP_REJECTED' })
  assert.equal(count(), 1)
})
test('transport rejects unsupported binary content', async t => {
  mockTransport(t, { contentType: 'application/pdf' })
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal), { code: 'CONTENT_BLOCKED' })
})
test('transport rejects encoded bodies to avoid unbounded decompression', async t => {
  mockTransport(t, { encoding: 'gzip' })
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal), { code: 'CONTENT_BLOCKED' })
})
test('transport enforces declared page byte limit', async t => {
  mockTransport(t, { length: 1000001 })
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal), { code: 'PAGE_TOO_LARGE' })
})
test('transport enforces actual streamed page byte limit', async t => {
  mockTransport(t, { body: 'x'.repeat(1000001) })
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), new AbortController().signal), { code: 'PAGE_TOO_LARGE' })
})
test('transport refuses an already expired deadline', async t => {
  const count = mockTransport(t); const controller = new AbortController(); controller.abort()
  await assert.rejects(service.fetchPinnedDocument(new URL('https://example.com/'), controller.signal), { code: 'TIMEOUT' }); assert.equal(count(), 0)
})
test('HTTP browser routes protect status, read, restore and deletion with token authorization', async t => {
  await tempStore(t)
  const keys = ['TEXTFX_BROWSER_ENABLED', 'TEXTFX_BROWSER_ALLOWED_HOSTS', 'TEXTFX_BROWSER_TOKEN']
  const old = keys.map(key => process.env[key]); Object.assign(process.env, { TEXTFX_BROWSER_ENABLED: 'true', TEXTFX_BROWSER_ALLOWED_HOSTS: 'example.com', TEXTFX_BROWSER_TOKEN: authPolicy.token })
  t.after(() => keys.forEach((key, i) => old[i] === undefined ? delete process.env[key] : process.env[key] = old[i]))
  const app = express(); app.use(express.json()); app.use('/api/browser', router)
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const origin = `http://127.0.0.1:${server.address().port}/api/browser`
  for (const [method, resource] of [['GET', '/status'], ['POST', '/research'], ['GET', '/runs/' + randomUUID()], ['DELETE', '/runs/' + randomUUID()]]) assert.equal((await fetch(origin + resource, { method })).status, 401)
  const headers = { Authorization: `Bearer ${authPolicy.token}`, 'Content-Type': 'application/json' }
  const status = await fetch(origin + '/status', { headers }); assert.equal(status.status, 200); assert.equal((await status.json()).multiTenantReady, false)
  assert.equal((await fetch(origin + '/research', { method: 'POST', headers, body: JSON.stringify({ goal: 'x', urls: ['http://localhost'] }) })).status, 400)
  const run = snapshot(); await service.saveBrowserResearch(run)
  const saved = await fetch(origin + '/runs/' + run.runId, { headers }); assert.equal(saved.status, 200); assert.deepEqual((await saved.json()).research, run)
  assert.equal((await fetch(origin + '/runs/' + run.runId, { method: 'DELETE', headers })).status, 204)
  assert.equal((await fetch(origin + '/runs/' + run.runId, { headers })).status, 404)
})
