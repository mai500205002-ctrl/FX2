'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { spawn } = require('node:child_process')
const { randomBytes } = require('node:crypto')
const http = require('node:http')
const net = require('node:net')
const os = require('node:os')
const path = require('node:path')
const { chromium } = require('playwright')

const repositoryRoot = path.resolve(__dirname, '../..')
const appRoot = path.join(repositoryRoot, 'app')
const viteCli = path.join(appRoot, 'node_modules/vite/bin/vite.js')
const testApiKey = 'browser-test-server-only-key'

const providers = [
  { id: 'gemini', label: 'Gemini', configured: true, models: ['gemini-3.1-flash-lite'] },
  { id: 'openai', label: 'OpenAI', configured: true, models: ['gpt-4o-mini'] },
  { id: 'openrouter', label: 'OpenRouter', configured: true, models: ['openai/gpt-4o-mini'] },
  { id: 'grok', label: 'Grok', configured: true, models: ['grok-3-mini'] },
]

const fixtures = {
  insight(brief) {
    return {
      mainInsight: brief.includes('second') ? 'INSIGHT FOR SECOND BRIEF' : 'INSIGHT FOR FIRST BRIEF',
      lateralThinkingBreakdown: {
        provocation: { provocation: 'provocation', reversal: 'reversal', opportunity: 'opportunity' },
        analogies: [{ sourceField: 'ecology', metaphor: 'a living archive' }],
        randomStimulus: { randomWord: 'seed', unexpectedAngle: 'growth', visualMetaphor: 'a planted clock' },
        oppositeThinking: { desirableMiddle: 'calm urgency', paradox: 'rest by moving' },
      },
      constraints: ['limited attention'],
      opportunities: ['make waiting visible'],
      metaphoricFraming: 'a living archive',
      emotionalTruth: 'small moments endure',
      creativeMethod: 'five lenses',
      evidenceReferences: [],
      generation: { mode: 'OpenAI', providers: ['OpenAI'], models: ['gpt-4o-mini'] },
    }
  },
  concept() {
    return {
      title: 'The Living Archive', tagline: 'Keep what grows', coreIdea: 'A garden stores small daily moments.',
      visualNotes: 'Seed packets become photographs.', creativeDevice: 'Time-lapse garden',
      emotionalArc: 'From hurried to present', targetParadox: 'Preserve by letting grow',
      evidenceReferences: [], generation: { mode: 'OpenAI', providers: ['OpenAI'], models: ['gpt-4o-mini'] },
    }
  },
  script() {
    return {
      script: 'A hand plants a seed. Seasons pass. The garden becomes a memory wall.',
      beats: ['Plant', 'Wait', 'Remember'], cameraLanguage: 'Macro to wide',
      narrativeStrategy: 'Time-lapse reveal', emotionalTurning: 'The garden is the archive',
      evidenceReferences: [], generation: { mode: 'OpenAI', providers: ['OpenAI'], models: ['gpt-4o-mini'] },
    }
  },
}

let backend
let backendOrigin
let browser
let viteProcess
let appOrigin
let requests
let responseOverrides

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject)
      resolve(server.address().port)
    })
  })
}

async function waitForApp(url) {
  const deadline = Date.now() + 30_000
  let lastError
  while (Date.now() < deadline) {
    if (viteProcess.exitCode !== null) throw new Error(`Vite exited with code ${viteProcess.exitCode}`)
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch (error) { lastError = error }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`Vite did not become ready: ${lastError?.message || 'timeout'}`)
}

function sendJson(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(value))
}

test.before(async () => {
  requests = []
  responseOverrides = {}
  backend = http.createServer((request, response) => {
    const chunks = []
    request.on('data', chunk => chunks.push(chunk))
    request.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8')
      let body = {}
      try { body = rawBody ? JSON.parse(rawBody) : {} } catch {}
      const pathname = new URL(request.url, backendOrigin).pathname
      requests.push({ pathname, method: request.method, authorization: request.headers.authorization, cookie: request.headers.cookie, body })
      if (pathname === '/api/key-status') {
        return sendJson(response, 200, { configured: true, provider: 'OpenAI', providers })
      }
      if (pathname === '/api/session' && request.method === 'GET') {
        return sendJson(response, 200, { authRequired: true, authenticated: false })
      }
      if (pathname === '/api/session' && request.method === 'POST') {
        if (body.apiKey !== testApiKey) return sendJson(response, 401, { error: 'Authentication failed' })
        response.writeHead(200, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Set-Cookie': 'textfx_session=browser-test-session; Path=/api; HttpOnly; SameSite=Strict',
        })
        return response.end(JSON.stringify({ authRequired: true, authenticated: true }))
      }
      if (pathname === '/api/saas/status') {
        return sendJson(response, 200, { billingReady: false, authReady: false, persistence: 'test', ready: false, tenantCount: 0, tenants: [], plans: [] })
      }
      if (pathname === '/api/agent/status') {
        return sendJson(response, 200, {
          ok: true, mode: 'test', readyForSaaS: false, capabilities: [],
          counts: { totalRuns: 0, activeRuns: 0, auditEvents: 0 }, recentRuns: [], recentAudit: [],
        })
      }
      if (pathname === '/api/metrics') {
        return sendJson(response, 200, { providerMode: 'test', gateway: { totalCalls: 0 } })
      }
      const stage = pathname.split('/').at(-1)
      const override = responseOverrides[stage]
      const deliver = () => {
        if (response.destroyed || response.writableEnded) return
        if (override?.status) return sendJson(response, override.status, override.body)
        if (override?.body !== undefined) return sendJson(response, 200, override.body)
        const fixture = fixtures[stage]
        if (!fixture) return sendJson(response, 404, { error: 'unknown test endpoint' })
        sendJson(response, 200, stage === 'insight' ? fixture(body.brief || '') : fixture())
      }
      if (override?.delayMs) setTimeout(deliver, override.delayMs)
      else deliver()
    })
  })
  const backendPort = await listen(backend)
  backendOrigin = `http://127.0.0.1:${backendPort}`

  const portProbe = net.createServer()
  const proxyPort = await listen(portProbe)
  await new Promise((resolve, reject) => portProbe.close(error => error ? reject(error) : resolve()))
  appOrigin = `http://127.0.0.1:${proxyPort}`

  viteProcess = spawn(process.execPath, [viteCli, '--host', '127.0.0.1', '--port', String(proxyPort), '--strictPort'], {
    cwd: appRoot,
    env: {
      ...process.env,
      TEXTFX_BACKEND_PROXY_URL: backendOrigin,
    },
    stdio: 'ignore',
  })
  await waitForApp(appOrigin)
  browser = await chromium.launch({ headless: true })
})

test.after(async () => {
  await browser?.close()
  if (viteProcess && viteProcess.exitCode === null) {
    await new Promise(resolve => {
      viteProcess.once('exit', resolve)
      viteProcess.kill('SIGTERM')
    })
  }
  if (backend?.listening) await new Promise(resolve => backend.close(resolve))
})

async function gotoApp(origin = appOrigin) {
  const page = await browser.newPage()
  const rendererAuthHeaders = []
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/')) {
      rendererAuthHeaders.push(request.headers().authorization)
    }
  })
  await page.goto(origin)
  await page.getByRole('heading', { name: 'Connect to TextFX' }).waitFor()
  return { page, rendererAuthHeaders }
}

async function signIn(page, key = testApiKey) {
  await page.locator('#server-access-key').fill(key)
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('textbox', { name: 'The Brief' }).waitFor()
}

async function openApp() {
  const opened = await gotoApp()
  await signIn(opened.page)
  return opened
}

test('proxy keeps the API key server-side and provider selection flows through all creative stages', async () => {
  const { page, rendererAuthHeaders } = await openApp()
  try {
    const briefInput = page.getByRole('textbox', { name: 'The Brief' })
    await briefInput.fill('first brief about a living archive')

    await page.locator('.model-picker-trigger').click()
    await page.getByRole('option', { name: /GPT \(OpenAI\)/ }).click()
    await page.locator('.model-picker-trigger').click()
    await page.getByRole('combobox', { name: 'Model OpenAI' }).selectOption('gpt-4o-mini')

    await page.getByRole('button', { name: 'Ignite Insight' }).click()
    await page.locator('.insight-hero').getByText('INSIGHT FOR FIRST BRIEF').waitFor()
    await page.getByRole('button', { name: 'Evolve to Concept' }).click()
    await page.getByRole('heading', { name: 'The Living Archive' }).waitFor()
    await page.getByRole('button', { name: 'Manifest Script' }).click()
    await page.locator('.script-block').getByText(/A hand plants a seed/).waitFor()

    const stageCalls = requests.filter(request => ['/api/insight', '/api/concept', '/api/script'].includes(request.pathname))
    assert.deepEqual(stageCalls.map(request => request.pathname), ['/api/insight', '/api/concept', '/api/script'])
    for (const request of stageCalls) {
      assert.equal(request.authorization, undefined)
      assert.match(request.cookie || '', /textfx_session=browser-test-session/)
      assert.equal(request.body.provider, 'openai')
      assert.equal(request.body.model, 'gpt-4o-mini')
    }
    assert.ok(rendererAuthHeaders.every(value => value === undefined), 'renderer requests must not carry the backend key')
    assert.equal((await page.locator('body').innerText()).includes(testApiKey), false)
    const secretFreeStatuses = await page.evaluate(async () => {
      const [keyStatus, metrics] = await Promise.all([
        fetch('/api/key-status').then(response => response.text()),
        fetch('/api/metrics').then(response => response.text()),
      ])
      return `${keyStatus}\n${metrics}`
    })
    assert.equal(secretFreeStatuses.includes(testApiKey), false)
    assert.equal(await page.evaluate(() => localStorage.getItem('textfx_session')), null)

    await briefInput.fill('changed brief')
    await page.locator('.insight-hero').waitFor({ state: 'detached' })
    await page.getByRole('heading', { name: 'The Living Archive' }).waitFor({ state: 'detached' })
    await page.locator('.script-block').waitFor({ state: 'detached' })
  } finally {
    await page.close()
  }
})

test('wrong access keys are not retained and logout invalidates the HttpOnly session', async () => {
  const { page } = await gotoApp()
  try {
    await page.locator('#server-access-key').fill('incorrect-key')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('alert').getByText(/Authentication failed/).waitFor()
    assert.equal(await page.locator('#server-access-key').inputValue(), '')
    await signIn(page)
    assert.equal(await page.getByRole('textbox', { name: 'The Brief' }).count(), 1)
    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.getByRole('heading', { name: 'Connect to TextFX' }).waitFor()
    const status = await page.evaluate(() => fetch('/api/session').then(response => response.json()))
    assert.deepEqual(status, { authRequired: true, authenticated: false })
  } finally {
    await page.close()
  }
})

test('provider picker routes each configured provider and selected model to the backend', async () => {
  const { page } = await openApp()
  try {
    const briefInput = page.getByRole('textbox', { name: 'The Brief' })
    const selections = [
      { id: 'gemini', label: 'Gemini', model: 'gemini-3.1-flash-lite' },
      { id: 'openai', label: 'GPT (OpenAI)', model: 'gpt-4o-mini' },
      { id: 'openrouter', label: 'OpenRouter', model: 'openai/gpt-4o-mini' },
      { id: 'grok', label: 'Grok', model: 'grok-3-mini' },
    ]
    for (const selection of selections) {
      await briefInput.fill(`provider ${selection.id}`)
      await page.locator('.model-picker-trigger').click()
      await page.getByRole('option').filter({ hasText: selection.label }).click()
      await page.locator('.model-picker-trigger').click()
      await page.getByRole('combobox').selectOption(selection.model)
      const requestStart = requests.length
      await page.getByRole('button', { name: 'Ignite Insight' }).click()
      await page.locator('.insight-hero').waitFor()
      const request = requests.slice(requestStart).find(item => item.pathname === '/api/insight')
      assert.ok(request, `${selection.id} should call insight`)
      assert.equal(request.body.provider, selection.id)
      assert.equal(request.body.model, selection.model)
    }
  } finally {
    await page.close()
  }
})

test('failed and structurally invalid insight responses do not render old or malformed cards', async () => {
  const { page } = await openApp()
  try {
    assert.equal(await page.locator('.insight-hero, .concept-title, .script-block').count(), 0)
    const briefInput = page.getByRole('textbox', { name: 'The Brief' })
    await briefInput.fill('brief that receives an upstream failure')

    responseOverrides.insight = { status: 503, delayMs: 200, body: { error: 'upstream unavailable' } }
    await page.getByRole('button', { name: 'Ignite Insight' }).click()
    await page.getByRole('button', { name: 'Deep Processing…' }).waitFor()
    await page.locator('.error-banner').filter({ hasText: 'upstream unavailable' }).waitFor()
    assert.equal(await page.locator('.insight-hero').count(), 0)

    delete responseOverrides.insight
    await page.getByRole('button', { name: 'Ignite Insight' }).click()
    await page.locator('.insight-hero').getByText('INSIGHT FOR FIRST BRIEF').waitFor()

    await briefInput.fill('brief with malformed nested response')
    responseOverrides.insight = { body: { ...fixtures.insight(''), lateralThinkingBreakdown: { provocation: {} } } }
    await page.getByRole('button', { name: 'Ignite Insight' }).click()
    await page.locator('.error-banner').filter({ hasText: 'Server error' }).waitFor()
    assert.equal(await page.locator('.insight-hero').count(), 0)
  } finally {
    delete responseOverrides.insight
    await page.close()
  }
})

test('editing the Brief cancels a pending response and a newer request wins', async () => {
  const { page } = await openApp()
  try {
    const briefInput = page.getByRole('textbox', { name: 'The Brief' })
    await briefInput.fill('stale request brief')
    responseOverrides.insight = { delayMs: 1200 }
    await page.getByRole('button', { name: 'Ignite Insight' }).click()
    await page.waitForFunction(() => document.querySelector('.loading-overlay') !== null)

    await briefInput.fill('second brief should win')
    responseOverrides.insight = {}
    await page.getByRole('button', { name: 'Ignite Insight' }).click()
    await page.locator('.insight-hero').getByText('INSIGHT FOR SECOND BRIEF').waitFor()
    await page.waitForTimeout(1400)

    assert.equal(await page.locator('.insight-hero').innerText(), 'INSIGHT FOR SECOND BRIEF')
  } finally {
    delete responseOverrides.insight
    await page.close()
  }
})

test('real backend session protects the actual Brief route and reports missing provider credentials explicitly', async () => {
  const tempData = fs.mkdtempSync(path.join(os.tmpdir(), 'textfx-real-backend-ui-'))
  const backendReservation = net.createServer()
  const backendPort = await listen(backendReservation)
  await new Promise((resolve, reject) => backendReservation.close(error => error ? reject(error) : resolve()))
  const proxyReservation = net.createServer()
  const proxyPort = await listen(proxyReservation)
  await new Promise((resolve, reject) => proxyReservation.close(error => error ? reject(error) : resolve()))
  const realAppOrigin = `http://127.0.0.1:${proxyPort}`
  const backendProcess = spawn(process.execPath, ['dist/index.js'], {
    cwd: path.join(repositoryRoot, 'backend'),
    env: {
      ...process.env,
      PORT: String(backendPort),
      CORS_ORIGIN: realAppOrigin,
      TEXTFX_API_KEY: testApiKey,
      TEXTFX_AGENT_DATA_DIR: path.join(tempData, 'runs'),
      TEXTFX_CANDIDATE_ARCHIVE_PATH: path.join(tempData, 'candidates.json'),
      TEXTFX_CREATIVE_MEMORY_PATH: path.join(tempData, 'memory.json'),
      TEXTFX_BROWSER_DATA_DIR: path.join(tempData, 'browser'),
      TEXTFX_BROWSER_ENABLED: 'false',
      GEMINI_API_KEY: '', OPENAI_API_KEY: '', OPENROUTER_API_KEY: '', XAI_API_KEY: '',
    },
    stdio: 'ignore',
  })
  const realViteProcess = spawn(process.execPath, [viteCli, '--host', '127.0.0.1', '--port', String(proxyPort), '--strictPort'], {
    cwd: appRoot,
    env: { ...process.env, TEXTFX_BACKEND_PROXY_URL: `http://127.0.0.1:${backendPort}` },
    stdio: 'ignore',
  })

  async function stop(child) {
    if (child.exitCode !== null) return
    await new Promise(resolve => {
      child.once('exit', resolve)
      child.kill('SIGTERM')
    })
  }

  try {
    await waitForApp(realAppOrigin)
    const deadline = Date.now() + 20000
    let backendReady = false
    while (Date.now() < deadline) {
      if (backendProcess.exitCode !== null) throw new Error(`Backend exited (${backendProcess.exitCode})`)
      try {
        const health = await fetch(`http://127.0.0.1:${backendPort}/healthz`)
        if (health.ok) { backendReady = true; break }
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.equal(backendReady, true, 'actual backend should start')

    const { page, rendererAuthHeaders } = await gotoApp(realAppOrigin)
    try {
      await page.locator('#server-access-key').fill(testApiKey)
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('textbox', { name: 'The Brief' }).waitFor()

      const statuses = await page.evaluate(async () => {
        const session = await fetch('/api/session').then(response => response.json())
        const keyStatus = await fetch('/api/key-status').then(response => response.json())
        const metricsResponse = await fetch('/api/metrics')
        return { session, keyStatus, metricsStatus: metricsResponse.status }
      })
      assert.deepEqual(statuses.session, { authRequired: true, authenticated: true })
      assert.equal(statuses.keyStatus.configured, false)
      assert.equal(statuses.metricsStatus, 200)

      await page.getByRole('textbox', { name: 'The Brief' }).fill('A real backend smoke-test brief.')
      await page.getByRole('button', { name: 'Ignite Insight' }).click()
      await page.getByRole('alert').getByText(/No AI provider is configured/).waitFor()
      assert.equal(await page.locator('.insight-hero').count(), 0)
      assert.ok(rendererAuthHeaders.every(value => value === undefined))
      assert.equal((await page.locator('body').innerText()).includes(testApiKey), false)
    } finally {
      await page.close()
    }
  } finally {
    await stop(realViteProcess)
    await stop(backendProcess)
    fs.rmSync(tempData, { recursive: true, force: true })
  }
})