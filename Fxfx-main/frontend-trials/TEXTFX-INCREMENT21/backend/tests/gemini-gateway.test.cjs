'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')
const originalLoad = Module._load
const sdkRequests = []

Module._load = function(request, parent, isMain) {
  if (request === '@google/genai') {
    return {
      GoogleGenAI: class GoogleGenAI {
        constructor({ apiKey }) {
          assert.equal(apiKey, 'test-gemini-key')
          this.models = {
            generateContent: async request => {
              sdkRequests.push(request)
              await new Promise(resolve => setTimeout(resolve, 20))
              return {
                text: `generated:${request.contents}`,
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

process.env.GEMINI_API_KEY = 'test-gemini-key'
process.env.GEMINI_MODEL = 'gemini-2.5-flash'
process.env.GEMINI_TEMPERATURE = '0.25'
process.env.GEMINI_MAX_OUTPUT_TOKENS = '128'

const { callLLM, gateway, getGatewayStats } = require('../dist/gateway/llm-gateway.js')

test('Gemini gateway routes requests and counts cache hits and in-flight deduplication', async () => {
  const first = await gateway.generateCreativeText('same prompt', 'system rules')
  assert.equal(first.text, 'generated:same prompt')
  assert.equal(first.model, 'gemini-2.5-flash')

  const cached = await callLLM('same prompt', 'system rules')
  assert.equal(cached.text, first.text)
  assert.equal(cached.cacheHit, true)
  assert.equal(cached.latencyMs, 0)

  const concurrent = await Promise.all([
    callLLM('concurrent prompt', 'system rules'),
    callLLM('concurrent prompt', 'system rules'),
  ])
  assert.equal(concurrent[0].text, concurrent[1].text)
  assert.equal(concurrent[0].cacheHit, false)
  assert.equal(concurrent[1].cacheHit, false)

  assert.equal(sdkRequests.length, 2, 'cache and deduplication avoid duplicate Gemini requests')
  assert.ok(sdkRequests.every(request => request.model === 'gemini-2.5-flash'))
  assert.ok(sdkRequests.every(request => request.config.temperature === 0.25))
  assert.ok(sdkRequests.every(request => request.config.maxOutputTokens === 128))

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