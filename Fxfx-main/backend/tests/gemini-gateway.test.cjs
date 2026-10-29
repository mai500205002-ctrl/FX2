'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const originalFetch = global.fetch
const providerRequests = []
global.fetch = async (url, options) => {
  const body = JSON.parse(options.body)
  providerRequests.push({ url: String(url), headers: options.headers, body })
  await new Promise(resolve => setTimeout(resolve, 20))
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: `generated:${body.contents[0].parts[0].text}` }] }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 3, totalTokenCount: 7 },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
test.after(() => { global.fetch = originalFetch })

process.env.GEMINI_API_KEY = 'test-gemini-key'
process.env.GEMINI_MODEL = 'gemini-2.5-flash'
process.env.GEMINI_TEMPERATURE = '0.25'
process.env.GEMINI_MAX_OUTPUT_TOKENS = '128'

const { callLLM, createGatewayBudgetContext, gateway, getGatewayCallHistory, getGatewayStats, withGatewayTask } = require('../dist/gateway/llm-gateway.js')

test('Gemini gateway routes requests and counts cache hits and in-flight deduplication', async () => {
  const context = createGatewayBudgetContext('cache-run')
  const first = await gateway.generateCreativeText('same prompt', 'system rules', context)
  assert.equal(first.text, 'generated:same prompt')
  assert.equal(first.model, 'gemini-2.5-flash')

  const cached = await callLLM('same prompt', 'system rules', context)
  assert.equal(cached.text, first.text)
  assert.equal(cached.cacheHit, true)
  assert.equal(cached.latencyMs, 0)

  const concurrent = await Promise.all([
    callLLM('concurrent prompt', 'system rules', context),
    callLLM('concurrent prompt', 'system rules', context),
  ])
  assert.equal(concurrent[0].text, concurrent[1].text)
  assert.equal(concurrent[0].cacheHit, false)
  assert.equal(concurrent[1].cacheHit, false)

  assert.equal(providerRequests.length, 2, 'cache and deduplication avoid duplicate Gemini requests')
  assert.ok(providerRequests.every(request => request.url.endsWith('/gemini-2.5-flash:generateContent')))
  assert.ok(providerRequests.every(request => request.headers['x-goog-api-key'] === 'test-gemini-key'))
  assert.ok(providerRequests.every(request => request.body.generationConfig.temperature === 0.25))
  assert.ok(providerRequests.every(request => request.body.generationConfig.maxOutputTokens === 128))

  const stats = getGatewayStats()
  assert.equal(stats.totalCalls, 4)
  assert.equal(stats.cacheHits, 1)
  assert.equal(stats.cacheHitRate, 0.25)
  assert.equal(stats.dedupHits, 1)
  assert.equal(stats.cacheSize, 2)
  assert.equal(stats.inflight, 0)
  assert.equal(stats.providers.Gemini.totalCalls, 2)
  assert.deepEqual(Object.keys(stats.providers), ['Gemini'])
})

test('Gemini model routing is configurable by task and recorded in call provenance', async () => {
  const taskModels = {
    'candidate-generation': ['GEMINI_MODEL_CANDIDATE_GENERATION', 'candidate-model-test'],
    critique: ['GEMINI_MODEL_CRITIQUE', 'critique-model-test'],
    'final-artifact': ['GEMINI_MODEL_FINAL_ARTIFACT', 'final-model-test'],
    utility: ['GEMINI_MODEL_UTILITY', 'utility-model-test'],
  }
  for (const [envName, model] of Object.values(taskModels)) process.env[envName] = model
  const start = providerRequests.length
  const historyStart = getGatewayCallHistory(500).length
  for (const task of Object.keys(taskModels)) {
    const context = withGatewayTask(createGatewayBudgetContext(`routing-${task}`, { promptVersion: 'prompt-routing-test' }), task)
    const response = await callLLM(`routing prompt ${task}`, 'routing system', context)
    assert.equal(response.model, taskModels[task][1])
  }
  assert.deepEqual(providerRequests.slice(start).map(request => decodeURIComponent(request.url.split('/models/')[1].split(':')[0])), Object.values(taskModels).map(([, model]) => model))
  const records = getGatewayCallHistory(500).slice(historyStart)
  assert.deepEqual(records.map(item => item.task), Object.keys(taskModels))
  assert.ok(records.every(item => item.promptVersion === 'prompt-routing-test'))
  assert.equal(getGatewayStats().routing.version, 'multi-provider-task-routing-v1')
})