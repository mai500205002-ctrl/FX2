'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const http = require('node:http')

const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'textfx-pipeline-e2e-'))
const savedEnv = new Map([
  'HOME',
  'TEXTFX_API_KEY',
  'OPENAI_API_KEY',
  'OPENROUTER_API_KEY',
  'GEMINI_API_KEY',
  'XAI_API_KEY',
  'GEMINI_RUN_BUDGET_USD',
  'GEMINI_CALL_BUDGET_USD',
  'AI_MAX_OUTPUT_TOKENS',
  'AI_TEMPERATURE',
].map(name => [name, process.env[name]]))
process.env.HOME = tempHome
process.env.TEXTFX_API_KEY = 'pipeline-test-key'
process.env.OPENAI_API_KEY = 'pipeline-openai-test-key'
process.env.OPENROUTER_API_KEY = 'pipeline-provider-test-key'
process.env.GEMINI_API_KEY = 'pipeline-gemini-test-key'
process.env.XAI_API_KEY = 'pipeline-xai-test-key'
process.env.GEMINI_RUN_BUDGET_USD = '0.75'
process.env.GEMINI_CALL_BUDGET_USD = '0.08'
process.env.AI_MAX_OUTPUT_TOKENS = '512'

const originalFetch = global.fetch
const providerRequests = []
let scenario = 'success'
let selectedProvider = 'openrouter'
let selectedModel = 'openai/gpt-4o-mini'
global.fetch = async (url, options) => {
  const providerUrl = String(url)
  if (![
    'https://openrouter.ai/',
    'https://api.openai.com/',
    'https://generativelanguage.googleapis.com/',
    'https://api.x.ai/',
  ].some(prefix => providerUrl.startsWith(prefix))) return originalFetch(url, options)

  const body = JSON.parse(options.body)
  const prompt = providerUrl.startsWith('https://generativelanguage.googleapis.com/')
    ? body.contents[0].parts[0].text
    : body.messages[1].content
  providerRequests.push({ body, prompt, signal: options.signal })

  if (scenario === 'http-429') return new Response('provider secret response', { status: 429 })
  if (scenario === 'http-503') return new Response('provider secret response', { status: 503 })
  if (scenario === 'network-timeout') throw new Error('simulated provider timeout')
  if (scenario === 'request-cancelled') {
    return new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('simulated provider cancellation')), { once: true })
    })
  }
  if (scenario === 'truncated-debate' && prompt.includes('Create a concise debate')) {
    return providerResponse({ content: '{"voices":[', finishReason: 'length' })
  }
  if (scenario === 'empty' && prompt.includes('Use provocation')) {
    return providerResponse({ content: '', finishReason: 'stop' })
  }
  if (scenario === 'invalid-json' && prompt.includes('Use provocation')) {
    return providerResponse({ content: 'not valid json', finishReason: 'stop' })
  }
  if (scenario === 'invalid-envelope' && prompt.includes('Use provocation')) {
    return new Response('not valid provider JSON', { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  if (scenario === 'unexpected-finish' && prompt.includes('Use provocation')) {
    return providerResponse({ content: '{"provocation":"blocked"}', finishReason: 'content_filter' })
  }
  if (scenario === 'invalid-schema' && prompt.includes('Use provocation')) {
    return providerResponse({ content: JSON.stringify({ provocation: 'Only one field.' }), finishReason: 'stop' })
  }
  if (scenario === 'invalid-concept' && prompt.includes('Transform this strategic insight')) {
    return providerResponse({ content: JSON.stringify({ title: 'Incomplete concept' }), finishReason: 'stop' })
  }
  if (scenario === 'invalid-script' && prompt.includes('Write a cinematic 30-second screenplay')) {
    return providerResponse({ content: JSON.stringify({ script: 'Incomplete script' }), finishReason: 'stop' })
  }

  const content = fixtureFor(prompt)
  return providerResponse({
    content,
    finishReason: 'stop',
    includeUsage: scenario !== 'missing-usage',
  })
}

function providerResponse({ content, finishReason, includeUsage = true }) {
  const payload = {
    model: selectedModel,
    choices: [{ message: { content }, finish_reason: finishReason }],
  }
  if (includeUsage) payload.usage = { prompt_tokens: 80, completion_tokens: 60 }
  return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

function fixtureFor(prompt) {
  if (prompt.includes('Use provocation')) {
    return JSON.stringify({ provocation: 'Reverse the expected cue', reversal: 'Make the pause rewarding', opportunity: 'Create a caring ritual', creativeInsight: 'Care can feel self-directed' })
  }
  if (prompt.includes('Create original cross-domain analogies')) {
    return JSON.stringify({ analogies: [{ sourceField: 'Gardening', sharedPrinciple: 'Gentle repetition', application: 'Nurture a small routine', metaphor: 'A daily seedling' }] })
  }
  if (prompt.includes('Choose an unexpected random stimulus')) {
    return JSON.stringify({ randomWord: 'Pebble', forcedConnection: 'Small reminders gather meaning', visualMetaphor: 'A trail of pebbles', unexpectedAngle: 'A quiet moment becomes visible' })
  }
  if (prompt.includes('Explore the positive and negative extremes')) {
    return JSON.stringify({ extremePositive: 'Hydration happens effortlessly', extremeNegative: 'Reminders disappear', desirableMiddle: 'One gentle cue', paradox: 'A pause restores focus' })
  }
  if (prompt.includes('Turn the constraint itself into a solution')) {
    return JSON.stringify({ constraint: 'Reminders feel nagging', reversal: 'Let users choose the cue', opportunity: 'Make care feel personal', insight: 'Choice turns a cue into care' })
  }
  if (prompt.includes('Synthesize these five lateral-thinking outputs')) {
    return JSON.stringify({ synthesizedInsight: 'A chosen pause makes care feel rewarding.', creativeBreakthrough: 'Turn hydration into a quiet moment of care.' })
  }
  if (prompt.includes('Create a concise debate')) {
    return JSON.stringify({
      voices: [
        { agent: 'Creative Rebel', stance: 'Reject nagging', sharpCritique: 'Cues interrupt focus', contribution: 'Make the bottle respond gently' },
        { agent: 'Strategy Master', stance: 'Keep choice central', sharpCritique: 'Avoid another notification', contribution: 'Reward a chosen pause', trendAngle: 'No event', liveEventCite: 'No event' },
        { agent: 'Picky Client', stance: 'Show the ritual', sharpCritique: 'Benefit must be clear', contribution: 'Make progress visible' },
      ],
      conflictPoint: 'Visibility versus interruption',
      resolution: 'Use a chosen, quiet cue',
      debateSummary: 'Choice makes hydration caring',
      trendConnection: 'No event',
      liveEventUsed: '',
      finalMasterpiece: {
        headline: 'A Moment for You',
        tagline: 'Care, one sip at a time',
        coreIdea: 'A reusable bottle turns hydration into a chosen ritual.',
        emotionalTruth: 'Small acts can restore attention.',
        creativeDevice: 'A soft glow follows each chosen sip.',
        visualNotes: 'A focused worker pauses in warm daylight.',
      },
    })
  }
  if (prompt.includes('Create visual aesthetics')) {
    return JSON.stringify({
      midjourneyPrompt: 'Warm home office, reusable bottle, cinematic daylight',
      negativePrompt: 'No clutter',
      styleKeywords: ['natural', 'warm', 'cinematic'],
      colorPalette: ['#ffffff', '#b9d8d0', '#334455'],
      mood: 'Calm and caring',
      aspectRatio: '16:9',
      version: '1.0',
      trendInfluence: 'No event',
    })
  }
  if (prompt.includes('Transform this strategic insight into an original creative concept.')) {
    return JSON.stringify({
      title: 'The Quiet Sip',
      tagline: 'A little care, on your terms',
      coreIdea: 'A reusable bottle makes a chosen hydration pause feel rewarding.',
      visualNotes: 'A soft light marks each intentional sip.',
      creativeDevice: 'A subtle bottle glow rewards a chosen pause.',
      emotionalArc: 'From focused neglect to gentle self-care.',
      targetParadox: 'Workers ignore reminders but welcome chosen rituals.',
      lateralThinkingTechniques: ['Reversal', 'Ritual'],
    })
  }
  if (prompt.includes('Write a cinematic 30-second screenplay')) {
    return JSON.stringify({
      script: 'A remote worker ignores a buzzing reminder. They notice the bottle, choose a sip, and return to work refreshed.',
      beats: ['recognition', 'transformation', 'arrival'],
      cameraLanguage: 'A close-up opens into a warm, calm frame.',
      narrativeStrategy: 'Show the choice through one quiet action.',
      emotionalTurning: 'The pause becomes an act of care.',
      lateralThinkingTechniques: ['Ritual', 'Visual reversal'],
    })
  }
  throw new Error(`Unexpected production-stage prompt: ${prompt.slice(0, 80)}`)
}

const { app } = require('../dist/index.js')
const { getGatewayCallHistory, getGatewayStats } = require('../dist/gateway/llm-gateway.js')
const server = http.createServer(app)
let baseUrl

test.before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

test.after(async () => {
  global.fetch = originalFetch
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
  fs.rmSync(tempHome, { recursive: true, force: true })
  for (const [name, value] of savedEnv) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

async function postPipeline() {
  return global.fetch(`${baseUrl}/api/full-pipeline`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer pipeline-test-key',
    },
    body: JSON.stringify({
      brief: 'Product: a reusable water bottle for people working from home. Audience: remote workers who forget to drink water during focused work. Challenge: reminders feel nagging and are ignored. Goal: make hydration feel like a small, rewarding ritual of care.',
      provider: selectedProvider,
      model: selectedModel,
      language: 'en',
    }),
  })
}

test.beforeEach(() => {
  scenario = 'success'
  selectedProvider = 'openrouter'
  selectedModel = 'openai/gpt-4o-mini'
  providerRequests.length = 0
  process.env.GEMINI_RUN_BUDGET_USD = '0.75'
  process.env.GEMINI_CALL_BUDGET_USD = '0.08'
  process.env.AI_MAX_OUTPUT_TOKENS = '512'
})

test('authenticated full pipeline validates Insight, Concept, Script and completes with 512-token calls', async () => {
  const response = await postPipeline()
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.pipelineStatus, 'complete')
  assert.equal(body.insight.mainInsight, 'Turn hydration into a quiet moment of care.')
  assert.ok(body.insight.lateralThinkingBreakdown.agentDebate.finalMasterpiece.coreIdea)
  assert.equal(body.concept.title, 'The Quiet Sip')
  assert.ok(body.script.script)
  assert.equal(body.script.beats.length, 3)
  assert.equal(providerRequests.length, 10)
  assert.ok(providerRequests.every(item => item.body.max_tokens === 512))
  assert.equal(body.generation.calls.length, 10)
  const calls = getGatewayCallHistory(100).filter(call => call.runId === response.headers.get('x-request-id'))
  assert.equal(calls.length, 10)
  assert.ok(calls.every(call => call.chargedCostUsd <= 0.08))
  assert.ok(calls.reduce((sum, call) => sum + call.chargedCostUsd, 0) <= 0.75)
  assert.equal(getGatewayStats().budgets.reservedUsd, 0)
})

test('truncated debate output fails Insight and never starts Concept or Script', async () => {
  scenario = 'truncated-debate'
  const response = await postPipeline()
  const body = await response.json()

  assert.equal(response.status, 502)
  assert.equal(body.code, 'PROVIDER_REQUEST_FAILED')
  assert.match(body.error, /truncated at 512 output tokens/)
  assert.equal(providerRequests.length, 7)
  const requestId = response.headers.get('x-request-id')
  const calls = getGatewayCallHistory(100).filter(call => call.runId === requestId)
  assert.equal(calls.length, 7)
  assert.ok(calls.find(call => call.status === 'failed').chargedCostUsd > 0)
  assert.ok(calls.every(call => call.chargedCostUsd <= 0.08))
  assert.ok(calls.reduce((sum, call) => sum + call.chargedCostUsd, 0) <= 0.75)
  assert.equal(getGatewayStats().budgets.reservedUsd, 0)
  assert.ok(!providerRequests.some(item => item.prompt.includes('Transform this strategic insight')))
  assert.ok(!providerRequests.some(item => item.prompt.includes('Write a cinematic 30-second screenplay')))
})

test('empty, malformed JSON, and invalid schema responses stop before downstream stages', async t => {
  for (const [name, expectedStatus, expectedCalls] of [
    ['empty', 502, 5],
    ['invalid-json', 500, 5],
    ['invalid-envelope', 502, 5],
    ['unexpected-finish', 502, 5],
    ['invalid-schema', 500, 5],
    ['invalid-concept', 500, 9],
    ['invalid-script', 500, 10],
  ]) {
    await t.test(name, async () => {
      scenario = name
      providerRequests.length = 0
      const response = await postPipeline()
      assert.equal(response.status, expectedStatus)
      assert.equal(providerRequests.length, expectedCalls)
      const conceptCalls = providerRequests.filter(item => item.prompt.includes('Transform this strategic insight')).length
      const scriptCalls = providerRequests.filter(item => item.prompt.includes('Write a cinematic 30-second screenplay')).length
      assert.equal(conceptCalls, name === 'invalid-concept' || name === 'invalid-script' ? 1 : 0)
      assert.equal(scriptCalls, name === 'invalid-script' ? 1 : 0)
      const body = await response.json()
      assert.notEqual(body.pipelineStatus, 'complete')
      scenario = 'success'
    })
  }
})

test('provider HTTP 429/5xx and simulated network timeout return safe failures with conservative charges', async t => {
  for (const name of ['http-429', 'http-503', 'network-timeout']) {
    await t.test(name, async () => {
      scenario = name
      if (name === 'http-503') {
        selectedProvider = 'openai'
        selectedModel = 'gpt-4o-mini'
      } else if (name === 'network-timeout') {
        selectedProvider = 'gemini'
        selectedModel = 'gemini-3.1-flash-lite'
      }
      providerRequests.length = 0
      const response = await postPipeline()
      const body = await response.json()
      assert.equal(response.status, 502)
      assert.equal(body.code, 'PROVIDER_REQUEST_FAILED')
      assert.ok(!JSON.stringify(body).includes('provider secret response'))
      assert.equal(providerRequests.length, 5)
      const requestId = response.headers.get('x-request-id')
      const failures = getGatewayCallHistory(100).filter(call => call.runId === requestId && call.status === 'failed')
      assert.equal(failures.length, providerRequests.length)
      assert.ok(failures.every(failure => failure.chargedCostUsd > 0))
      assert.ok(failures.every(failure => failure.chargedCostUsd <= 0.08))
      assert.equal(getGatewayStats().budgets.reservedUsd, 0)
      scenario = 'success'
    })
  }
})

test('missing usage metadata preserves successful output but charges the reservation estimate', async () => {
  scenario = 'missing-usage'
  selectedProvider = 'grok'
  selectedModel = 'grok-3-mini'
  const response = await postPipeline()
  const body = await response.json()
  const requestId = response.headers.get('x-request-id')
  const calls = getGatewayCallHistory(100).filter(call => call.runId === requestId)

  assert.equal(response.status, 200)
  assert.equal(body.pipelineStatus, 'complete')
  assert.equal(calls.length, 10)
  assert.ok(calls.every(call => call.usageEstimated === true && call.chargedCostUsd > 0))
  assert.ok(calls.every(call => call.chargedCostUsd <= 0.08))
  assert.ok(calls.reduce((sum, call) => sum + call.chargedCostUsd, 0) <= 0.75)
})

test('run-budget exhaustion rejects before any provider fetch', async () => {
  process.env.GEMINI_RUN_BUDGET_USD = '0.000001'
  const response = await postPipeline()
  const body = await response.json()

  assert.equal(response.status, 429)
  assert.equal(body.code, 'BUDGET_EXCEEDED')
  assert.equal(providerRequests.length, 0)
})

test('client cancellation aborts pending provider calls and releases reservations', async () => {
  scenario = 'request-cancelled'
  selectedProvider = 'grok'
  selectedModel = 'grok-3-mini'
  const controller = new AbortController()
  const pending = postPipelineWithSignal(controller.signal)
  const deadline = Date.now() + 2_000
  while (providerRequests.length < 5 && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  assert.equal(providerRequests.length, 5)
  controller.abort()
  await assert.rejects(pending)
  await new Promise(resolve => setTimeout(resolve, 50))
  assert.equal(getGatewayStats().budgets.reservedUsd, 0)
})

async function postPipelineWithSignal(signal) {
  return global.fetch(`${baseUrl}/api/full-pipeline`, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer pipeline-test-key',
    },
    body: JSON.stringify({
      brief: 'Product: a reusable water bottle. Audience: remote workers. Challenge: reminders feel nagging. Goal: make hydration a caring ritual.',
      provider: selectedProvider,
      model: selectedModel,
      language: 'en',
    }),
  })
}
