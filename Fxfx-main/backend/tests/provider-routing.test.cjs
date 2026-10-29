'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const secretNames = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'XAI_API_KEY']
const modelNames = [
  'GEMINI_MODEL', 'OPENAI_MODEL', 'OPENROUTER_MODEL', 'XAI_MODEL',
  'GEMINI_MODELS', 'OPENAI_MODELS', 'OPENROUTER_MODELS', 'XAI_MODELS',
  'AI_AUTO_PROVIDER_ORDER', 'AI_MAX_OUTPUT_TOKENS',
]
const originalEnv = new Map([...secretNames, ...modelNames].map(name => [name, process.env[name]]))
for (const name of secretNames) delete process.env[name]
for (const name of modelNames) delete process.env[name]
process.env.AI_MAX_OUTPUT_TOKENS = '64'

const originalFetch = global.fetch
let requests = []
let responseStatus = 200
let delayRequest
const mockFetch = async (url, options) => {
  requests.push({ url: String(url), options })
  if (delayRequest) await delayRequest(options.signal)
  if (responseStatus !== 200) return new Response('provider error detail must not be surfaced', { status: responseStatus })
  return new Response(JSON.stringify({
    model: JSON.parse(options.body).model,
    choices: [{ message: { content: 'provider fixture output' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 11, completion_tokens: 7 },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
global.fetch = mockFetch

const { callLLM, createGatewayBudgetContext, getGatewayCallHistory, getGatewayStats, getProviderStatus } = require('../dist/gateway/llm-gateway.js')
const { getMetrics } = require('../dist/utils/metrics.js')

test.after(() => {
  global.fetch = originalFetch
  for (const [name, value] of originalEnv) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

test.beforeEach(() => {
  global.fetch = mockFetch
  requests = []
  responseStatus = 200
  delayRequest = undefined
  for (const name of secretNames) delete process.env[name]
  for (const name of modelNames) delete process.env[name]
  process.env.AI_MAX_OUTPUT_TOKENS = '64'
})

test('provider and selected model route to actual OpenAI-compatible endpoints', async () => {
  const fixtures = [
    { id: 'openai', key: 'OPENAI_API_KEY', model: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1/chat/completions' },
    { id: 'openrouter', key: 'OPENROUTER_API_KEY', model: 'openai/gpt-4o-mini', endpoint: 'https://openrouter.ai/api/v1/chat/completions' },
    { id: 'grok', key: 'XAI_API_KEY', model: 'grok-3-mini', endpoint: 'https://api.x.ai/v1/chat/completions' },
  ]

  for (const fixture of fixtures) {
    process.env[fixture.key] = `${fixture.id}-server-secret`
    const response = await callLLM(
      `request for ${fixture.id}`,
      'system prompt',
      createGatewayBudgetContext(`route-${fixture.id}`, { providerId: fixture.id, model: fixture.model }),
    )
    const request = requests.at(-1)
    assert.equal(request.url, fixture.endpoint)
    assert.equal(request.options.method, 'POST')
    assert.equal(request.options.headers.Authorization, `Bearer ${fixture.id}-server-secret`)
    assert.equal(request.options.body.includes(fixture.id + '-server-secret'), false)
    assert.equal(JSON.parse(request.options.body).model, fixture.model)
    assert.equal(response.provider, fixture.id === 'grok' ? 'Grok' : fixture.id === 'openrouter' ? 'OpenRouter' : 'OpenAI')
    assert.equal(response.model, fixture.model)
    assert.equal(response.text, 'provider fixture output')
  }

  const publicStatus = JSON.stringify(getProviderStatus())
  assert.equal(publicStatus.includes('-server-secret'), false)
})

test('provider status and usage telemetry never expose configured API key values', () => {
  const credentials = secretNames.map(name => `${name}-must-not-be-returned`)
  for (const [index, name] of secretNames.entries()) process.env[name] = credentials[index]
  const responseData = JSON.stringify({ providers: getProviderStatus(), metrics: getMetrics(), gateway: getGatewayStats() })
  for (const credential of credentials) assert.equal(responseData.includes(credential), false)
})

test('unconfigured or unapproved models fail before any provider request', async () => {
  process.env.OPENAI_API_KEY = 'openai-test-secret'
  await assert.rejects(
    callLLM('prompt', 'system', createGatewayBudgetContext('bad-model', { providerId: 'openai', model: 'unknown-expensive-model' })),
    /not enabled for OpenAI/,
  )
  assert.equal(requests.length, 0)
})

test('Auto falls back only after a provider rejection known not to have generated output', async () => {
  process.env.OPENAI_API_KEY = 'openai-test-secret'
  process.env.OPENROUTER_API_KEY = 'openrouter-test-secret'
  process.env.AI_AUTO_PROVIDER_ORDER = 'openai,openrouter'
  responseStatus = 401
  const statusSequence = [401, 200]
  global.fetch = async (url, options) => {
    requests.push({ url: String(url), options })
    const status = statusSequence.shift()
    if (status === 401) return new Response('invalid key', { status })
    return new Response(JSON.stringify({
      model: 'openai/gpt-4o-mini',
      choices: [{ message: { content: 'fallback output' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 4, completion_tokens: 5 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const response = await callLLM('prompt', 'system', createGatewayBudgetContext('auto-fallback'))
  assert.equal(response.provider, 'OpenRouter')
  assert.equal(requests.length, 2)
  const history = getGatewayCallHistory(10).filter(item => item.runId === 'auto-fallback')
  assert.deepEqual(history.map(item => [item.provider, item.status]), [
    ['OpenAI', 'failed'],
    ['OpenRouter', 'succeeded'],
  ])
  assert.ok(history.every(item => item.chargedCostUsd > 0))
  assert.ok(history.reduce((sum, item) => sum + item.chargedCostUsd, 0) <= 0.5)
  assert.equal(getGatewayStats().budgets.reservedUsd, 0)
})

test('Auto reserves the worst-case fallback sequence within the per-call ceiling', async () => {
  process.env.OPENAI_API_KEY = 'openai-test-secret'
  process.env.OPENROUTER_API_KEY = 'openrouter-test-secret'
  process.env.AI_AUTO_PROVIDER_ORDER = 'openai,openrouter'
  await assert.rejects(
    callLLM('prompt', 'system', createGatewayBudgetContext('auto-call-budget', { runBudgetUsd: 0.75, callBudgetUsd: 0.000001 })),
    { code: 'BUDGET_EXCEEDED' },
  )
  assert.equal(requests.length, 0)
})

test('Auto does not retry or fall back after ambiguous server errors', async () => {
  process.env.OPENAI_API_KEY = 'openai-test-secret'
  process.env.OPENROUTER_API_KEY = 'openrouter-test-secret'
  process.env.AI_AUTO_PROVIDER_ORDER = 'openai,openrouter'
  responseStatus = 503
  await assert.rejects(callLLM('prompt', 'system', createGatewayBudgetContext('no-duplicate-auto')), /OpenAI request failed \(HTTP 503\)/)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].url, 'https://api.openai.com/v1/chat/completions')
  const history = getGatewayCallHistory(10).find(item => item.runId === 'no-duplicate-auto')
  assert.ok(history.chargedCostUsd > 0)
  assert.equal(getGatewayStats().budgets.reservedUsd, 0)
})

test('caller cancellation aborts the provider request and does not retry', async () => {
  process.env.OPENAI_API_KEY = 'openai-test-secret'
  const controller = new AbortController()
  let observedAbort = false
  delayRequest = signal => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => {
      observedAbort = true
      reject(new Error('aborted by caller'))
    }, { once: true })
  })
  const pending = callLLM('prompt', 'system', createGatewayBudgetContext('cancel-request', {
    providerId: 'openai',
    signal: controller.signal,
  }))
  setTimeout(() => controller.abort(), 10)
  await assert.rejects(pending, /Provider request cancelled/)
  assert.equal(observedAbort, true)
  assert.equal(requests.length, 1)
})
