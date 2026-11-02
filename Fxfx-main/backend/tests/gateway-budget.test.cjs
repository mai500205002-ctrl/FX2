'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const express = require('express')
const http = require('node:http')
const Module = require('node:module')
const originalLoad = Module._load
const sdkRequests = []
const promptAttempts = new Map()

Module._load = function(request, parent, isMain) {
  if (request === '@google/genai') {
    return {
      GoogleGenAI: class GoogleGenAI {
        constructor() {
          this.models = {
            generateContent: async input => {
              sdkRequests.push(input)
              await new Promise(resolve => setTimeout(resolve, 25))
              if (String(input.contents).includes('uncertain usage')) throw new Error('fixture provider failure')
              if (String(input.contents).includes('retry once')) {
                const attempts = (promptAttempts.get(input.contents) || 0) + 1
                promptAttempts.set(input.contents, attempts)
                if (attempts === 1) throw new Error('fixture transient failure')
              }
              return {
                text: 'fixture response',
                candidates: [{ finishReason: 'STOP' }],
                usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 3, totalTokenCount: 7 },
              }
            },
          }
        }
      },
    }
  }
  return originalLoad.call(this, request, parent, isMain)
}

process.env.GEMINI_API_KEY = 'budget-test-key'
process.env.GEMINI_MODEL = 'gemini-2.5-flash'
process.env.GEMINI_MAX_OUTPUT_TOKENS = '128'

const { callLLM, createGatewayBudgetContext, getGatewayCallHistory, getGatewayStats } = require('../dist/gateway/llm-gateway.js')

test('concurrent reservations stay within run budget and reconcile actual provider usage', async () => {
  const context = createGatewayBudgetContext('budget-run', { runBudgetUsd: 0.0015, callBudgetUsd: 0.001, promptVersion: 'prompt-budget-test' })
  const before = getGatewayStats().budgets
  const results = await Promise.allSettled([
    callLLM('unique prompt one', 'system', { ...context, requestId: 'request-one' }),
    callLLM('unique prompt two', 'system', { ...context, requestId: 'request-two' }),
  ])

  assert.equal(results.filter(item => item.status === 'fulfilled').length, 1)
  const rejected = results.find(item => item.status === 'rejected')
  assert.equal(rejected.reason.code, 'BUDGET_EXCEEDED')
  assert.equal(sdkRequests.length, 1, 'the denied reservation must not reach the provider SDK')

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
  assert.equal(sdkRequests.length, 1)

  const completedContext = createGatewayBudgetContext('budget-run', { runBudgetUsd: 0.0015, callBudgetUsd: 0.001 })
  await assert.rejects(callLLM('different prompt', 'system', { ...completedContext, requestId: 'request-one' }), { code: 'BUDGET_EXCEEDED' })
  assert.equal(sdkRequests.length, 1)
})

test('failed calls charge the reserved amount when provider usage is uncertain', async () => {
  const context = createGatewayBudgetContext('uncertain-run', { runBudgetUsd: 1, callBudgetUsd: 0.01, promptVersion: 'prompt-failure-test' })
  const before = getGatewayStats().budgets
  await assert.rejects(callLLM('uncertain usage', 'system', { ...context, requestId: 'uncertain-request' }), /Gemini generation failed/)
  assert.equal(sdkRequests.filter(item => item.contents === 'uncertain usage').length, 3, 'provider retries stay within one pre-reserved operation')
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
  assert.equal(sdkRequests.filter(item => item.contents === 'same cross-run prompt').length, 2)
})

test('successful retry reconciles final usage and reserves only the failed-attempt envelope', async () => {
  const context = createGatewayBudgetContext('retry-success-run', { runBudgetUsd: 1, callBudgetUsd: 0.01 })
  const response = await callLLM('retry once', 'system', { ...context, requestId: 'retry-success-request' })
  const history = getGatewayCallHistory(10).find(item => item.runId === 'retry-success-run')
  assert.equal(response.retries, 1)
  assert.equal(history.retries, 1)
  assert.equal(history.status, 'succeeded')
  assert.ok(history.chargedCostUsd >= history.estimatedCostUsd)
  assert.ok(history.chargedCostUsd < 0.01)
})

test('invalid token configuration fails before SDK access and public budget stats omit run IDs', async () => {
  const original = process.env.GEMINI_MAX_OUTPUT_TOKENS
  const beforeCalls = sdkRequests.length
  process.env.GEMINI_MAX_OUTPUT_TOKENS = 'not-a-number'
  await assert.rejects(callLLM('invalid limits', 'system', createGatewayBudgetContext('invalid-config-run')), /positive safe integer/)
  if (original === undefined) delete process.env.GEMINI_MAX_OUTPUT_TOKENS
  else process.env.GEMINI_MAX_OUTPUT_TOKENS = original
  assert.equal(sdkRequests.length, beforeCalls)
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
  const beforeProviderCalls = sdkRequests.length
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/agent/run`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ goal: 'Budget gate test', brief: 'Do not call the provider.' }),
  })
  assert.equal(response.status, 429)
  assert.equal((await response.json()).code, 'BUDGET_EXCEEDED')
  assert.equal(sdkRequests.length, beforeProviderCalls)
})