'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const express = require('express')
const http = require('node:http')
const originalFetch = global.fetch
const providerRequests = []
let usageFixture = { promptTokenCount: 4, candidatesTokenCount: 3, totalTokenCount: 7 }
let waitForAbort = false
const environmentNames = [
  'GEMINI_API_KEY', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'XAI_API_KEY',
  'AI_MAX_OUTPUT_TOKENS',
]
const savedEnvironment = new Map(environmentNames.map(name => [name, process.env[name]]))
for (const name of environmentNames) delete process.env[name]
global.fetch = async (url, options) => {
  if (!String(url).startsWith('https://generativelanguage.googleapis.com/')) return originalFetch(url, options)
  const body = JSON.parse(options.body)
  const prompt = body.contents[0].parts[0].text
  providerRequests.push({ url: String(url), body })
  if (waitForAbort) {
    return new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('mock provider timeout')), { once: true })
    })
  }
  await new Promise(resolve => setTimeout(resolve, 25))
  if (prompt.includes('uncertain usage')) throw new Error('fixture provider failure')
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: 'fixture response' }] }, finishReason: 'STOP' }],
    usageMetadata: usageFixture,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
test.after(() => {
  global.fetch = originalFetch
  for (const [name, value] of savedEnvironment) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

process.env.GEMINI_API_KEY = 'budget-test-key'
process.env.GEMINI_MODEL = 'gemini-2.5-flash'
process.env.GEMINI_MAX_OUTPUT_TOKENS = '128'

const { callLLM, createGatewayBudgetContext, getGatewayCallHistory, getGatewayStats } = require('../dist/gateway/llm-gateway.js')

test.beforeEach(() => {
  for (const name of environmentNames) delete process.env[name]
  process.env.GEMINI_API_KEY = 'budget-test-key'
  delete process.env.AI_MAX_OUTPUT_TOKENS
  process.env.GEMINI_MAX_OUTPUT_TOKENS = '128'
  usageFixture = { promptTokenCount: 4, candidatesTokenCount: 3, totalTokenCount: 7 }
  waitForAbort = false
})

test('concurrent reservations stay within run budget and reconcile actual provider usage', async () => {
  const context = createGatewayBudgetContext('budget-run', { runBudgetUsd: 0.0004, callBudgetUsd: 0.001, promptVersion: 'prompt-budget-test' })
  const before = getGatewayStats().budgets
  const results = await Promise.allSettled([
    callLLM('unique prompt one', 'system', { ...context, requestId: 'request-one' }),
    callLLM('unique prompt two', 'system', { ...context, requestId: 'request-two' }),
  ])

  assert.equal(results.filter(item => item.status === 'fulfilled').length, 1)
  const rejected = results.find(item => item.status === 'rejected')
  assert.equal(rejected.reason.code, 'BUDGET_EXCEEDED')
  assert.equal(providerRequests.length, 1, 'the denied reservation must not reach the provider')

  const budget = getGatewayStats().budgets
  assert.ok(budget.chargedUsd > before.chargedUsd)
  assert.equal(budget.reservedUsd, before.reservedUsd)

  const history = getGatewayCallHistory(10)
  assert.equal(history.length, 1)
  assert.equal(history[0].runId, 'budget-run')
  assert.equal(history[0].requestId, 'request-one')
  assert.equal(history[0].promptVersion, 'prompt-budget-test')
  assert.equal(history[0].status, 'succeeded')
  assert.ok(!JSON.stringify(history).includes('unique prompt one'), 'call provenance must not store prompt contents')
})

test('call cap rejects before provider access and a settled idempotency key cannot be reused', async () => {
  const context = createGatewayBudgetContext('call-cap-run', { runBudgetUsd: 1, callBudgetUsd: 0.000001 })
  await assert.rejects(callLLM('too expensive', 'system', { ...context, requestId: 'call-cap' }), { code: 'BUDGET_EXCEEDED' })
  assert.equal(providerRequests.length, 1)

  const completedContext = createGatewayBudgetContext('budget-run', { runBudgetUsd: 0.0004, callBudgetUsd: 0.001 })
  await assert.rejects(callLLM('different prompt', 'system', { ...completedContext, requestId: 'request-one' }), { code: 'BUDGET_EXCEEDED' })
  assert.equal(providerRequests.length, 1)
})

test('failed calls charge the reserved amount when provider usage is uncertain', async () => {
  const context = createGatewayBudgetContext('uncertain-run', { runBudgetUsd: 1, callBudgetUsd: 0.01, promptVersion: 'prompt-failure-test' })
  const before = getGatewayStats().budgets
  await assert.rejects(callLLM('uncertain usage', 'system', { ...context, requestId: 'uncertain-request' }), /Gemini request failed/)
  assert.equal(providerRequests.filter(item => item.body.contents[0].parts[0].text === 'uncertain usage').length, 1, 'uncertain failures are never retried')
  const budget = getGatewayStats().budgets
  assert.ok(budget.chargedUsd > before.chargedUsd)
  assert.equal(budget.reservedUsd, before.reservedUsd)
  const history = getGatewayCallHistory(10).find(item => item.runId === 'uncertain-run')
  assert.equal(history.status, 'failed')
  assert.ok(history.chargedCostUsd > 0)
  assert.ok(!JSON.stringify(history).includes('uncertain usage'))
})

test('cached responses never cross run boundaries', async () => {
  const firstContext = createGatewayBudgetContext('private-run-one')
  const secondContext = createGatewayBudgetContext('private-run-two')
  const first = await callLLM('same cross-run prompt', 'same system', firstContext)
  const second = await callLLM('same cross-run prompt', 'same system', secondContext)
  assert.equal(first.cacheHit, false)
  assert.equal(second.cacheHit, false)
  assert.equal(first.runId, 'private-run-one')
  assert.equal(second.runId, 'private-run-two')
  assert.equal(providerRequests.filter(item => item.body.contents[0].parts[0].text === 'same cross-run prompt').length, 2)
})

test('successful generation does not retry and reconciles final usage', async () => {
  const context = createGatewayBudgetContext('retry-success-run', { runBudgetUsd: 1, callBudgetUsd: 0.01 })
  const response = await callLLM('retry once', 'system', { ...context, requestId: 'retry-success-request' })
  const history = getGatewayCallHistory(10).find(item => item.runId === 'retry-success-run')
  assert.equal(response.retries, 0)
  assert.equal(history.retries, 0)
  assert.equal(history.status, 'succeeded')
  assert.ok(history.chargedCostUsd >= history.estimatedCostUsd)
  assert.ok(history.chargedCostUsd < 0.01)
})

test('malformed token usage succeeds conservatively and charges the reserved estimate', async () => {
  usageFixture = { promptTokenCount: 'invalid', candidatesTokenCount: -1 }
  const context = createGatewayBudgetContext('malformed-usage-run', { runBudgetUsd: 1, callBudgetUsd: 0.01 })
  const response = await callLLM('malformed usage fixture', 'system', { ...context, requestId: 'malformed-usage-request' })
  const history = getGatewayCallHistory(10).find(item => item.runId === 'malformed-usage-run')

  assert.equal(response.usageEstimated, true)
  assert.equal(history.usageEstimated, true)
  assert.ok(history.chargedCostUsd > 0)
  assert.equal(getGatewayStats().budgets.reservedUsd, 0)
})

test('reported usage outside request bounds fails and charges the reservation', async () => {
  usageFixture = { promptTokenCount: 100_000, candidatesTokenCount: 3, totalTokenCount: 100_003 }
  const context = createGatewayBudgetContext('usage-overrun-run', { runBudgetUsd: 1, callBudgetUsd: 0.01 })

  await assert.rejects(
    callLLM('usage overrun fixture', 'system', { ...context, requestId: 'usage-overrun-request' }),
    /reported token usage outside the request limits/,
  )
  const history = getGatewayCallHistory(10).find(item => item.runId === 'usage-overrun-run')
  assert.equal(history.status, 'failed')
  assert.ok(history.chargedCostUsd > 0)
  assert.ok(history.chargedCostUsd <= 0.01)
  assert.equal(getGatewayStats().budgets.reservedUsd, 0)
})

test('provider deadline aborts the fetch and conservatively settles its reservation', async () => {
  waitForAbort = true
  const context = createGatewayBudgetContext('provider-timeout-run', { runBudgetUsd: 1, callBudgetUsd: 0.01 })

  await assert.rejects(
    callLLM('provider timeout fixture', 'system', { ...context, requestId: 'provider-timeout-request' }),
    /Gemini request timed out after 30000ms/,
  )
  const history = getGatewayCallHistory(10).find(item => item.runId === 'provider-timeout-run')
  assert.equal(history.status, 'failed')
  assert.ok(history.chargedCostUsd > 0)
  assert.equal(getGatewayStats().budgets.reservedUsd, 0)
})

test('invalid token configuration fails before SDK access and public budget stats omit run IDs', async () => {
  const original = process.env.GEMINI_MAX_OUTPUT_TOKENS
  const beforeCalls = providerRequests.length
  process.env.GEMINI_MAX_OUTPUT_TOKENS = 'not-a-number'
  await assert.rejects(callLLM('invalid limits', 'system', createGatewayBudgetContext('invalid-config-run')), /integer between 1 and 512/)
  if (original === undefined) delete process.env.GEMINI_MAX_OUTPUT_TOKENS
  else process.env.GEMINI_MAX_OUTPUT_TOKENS = original
  assert.equal(providerRequests.length, beforeCalls)
  const budgetStats = JSON.stringify(getGatewayStats().budgets)
  assert.ok(!budgetStats.includes('retry-success-run'))
  assert.ok(!budgetStats.includes('budget-run'))
})

test('agent HTTP route returns 429 for an exhausted call budget before provider access', async t => {
  const memoryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'textfx-budget-route-'))
  const oldMemoryPath = process.env.TEXTFX_CREATIVE_MEMORY_PATH
  const oldAgentDataDir = process.env.TEXTFX_AGENT_DATA_DIR
  const oldKey = process.env.GEMINI_API_KEY
  const oldRunBudget = process.env.GEMINI_RUN_BUDGET_USD
  const oldCallBudget = process.env.GEMINI_CALL_BUDGET_USD
  process.env.TEXTFX_CREATIVE_MEMORY_PATH = path.join(memoryDirectory, 'memory.json')
  process.env.TEXTFX_AGENT_DATA_DIR = path.join(memoryDirectory, 'agent-state')
  process.env.GEMINI_API_KEY = 'budget-route-test-key'
  process.env.GEMINI_RUN_BUDGET_USD = '1'
  process.env.GEMINI_CALL_BUDGET_USD = '0.000001'
  t.after(() => {
    fs.rmSync(memoryDirectory, { recursive: true, force: true })
    if (oldMemoryPath === undefined) delete process.env.TEXTFX_CREATIVE_MEMORY_PATH
    else process.env.TEXTFX_CREATIVE_MEMORY_PATH = oldMemoryPath
    if (oldAgentDataDir === undefined) delete process.env.TEXTFX_AGENT_DATA_DIR
    else process.env.TEXTFX_AGENT_DATA_DIR = oldAgentDataDir
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY
    else process.env.GEMINI_API_KEY = oldKey
    if (oldRunBudget === undefined) delete process.env.GEMINI_RUN_BUDGET_USD
    else process.env.GEMINI_RUN_BUDGET_USD = oldRunBudget
    if (oldCallBudget === undefined) delete process.env.GEMINI_CALL_BUDGET_USD
    else process.env.GEMINI_CALL_BUDGET_USD = oldCallBudget
  })

  const router = require('../dist/agent/agent-route.js').default
  const app = express()
  app.use(express.json())
  app.use('/api/agent', router)
  const server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => { server.closeAllConnections(); server.close() })
  const beforeProviderCalls = providerRequests.length
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/agent/run`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ goal: 'Budget gate test', brief: 'Do not call the provider.' }),
  })
  assert.equal(response.status, 429)
  assert.equal((await response.json()).code, 'BUDGET_EXCEEDED')
  assert.equal(providerRequests.length, beforeProviderCalls)
})