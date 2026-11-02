'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const http = require('node:http')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'textfx-idempotency-'))
process.env.TEXTFX_AGENT_DATA_DIR = path.join(tempRoot, 'agent-state')
process.env.TEXTFX_CREATIVE_MEMORY_PATH = path.join(tempRoot, 'memory.json')
process.env.TEXTFX_CANDIDATE_ARCHIVE_PATH = path.join(tempRoot, 'candidates.json')

function loadService() {
  const modulePath = require.resolve('../dist/agent/agent-service.js')
  delete require.cache[modulePath]
  return require(modulePath)
}

function concept(title) {
  return { title, tagline: `${title} tagline`, coreIdea: `${title} core`, visualNotes: 'A visible image', creativeDevice: 'A mechanism', emotionalArc: 'Tension then release', targetParadox: 'Want change, fear it', lateralThinkingTechniques: ['fixture'] }
}

function candidate(id, title, score) {
  return { id, lens: title, lensId: id, version: 1, runId: 'fixture-run', promptVersion: 'fixture-prompt', concept: concept(title), score, rationale: ['Fixture evidence'], origin: 'seed', parentIds: [], generation: 0 }
}

function dependencies(counters) {
  const candidates = [candidate('candidate-one', 'One', 90), candidate('candidate-two', 'Two', 80)]
  const review = score => ({ source: 'model', score, verdict: 'ready', criterionScores: { goalAlignment: score, originality: score, emotionalArc: score, visualSpecificity: score, clarityAndPacing: score, conceptIntegrity: score }, strengths: ['Clear'], weaknesses: ['Could sharpen'], revisionBrief: ['Sharpen'], summary: 'Fixture review' })
  return {
    skipConfigurationCheck: true,
    runtime: { mode: 'Gemini', provider: { generateCreativeText: async () => { throw new Error('No real provider calls allowed in this fixture') } } },
    createExecutionPlan: async () => { counters.plans++; return { summary: 'Plan', steps: ['Create'], acceptanceCriteria: ['Artifact'], risks: ['Subjective'], estimatedMinutes: 1, mode: 'Gemini' } },
    generateInsight: async () => { counters.insights++; return { mainInsight: 'Insight', lateralThinkingBreakdown: {}, constraints: [], opportunities: [], metaphoricFraming: 'Image', emotionalTruth: 'Truth', creativeMethod: 'Fixture' } },
    discoverConcepts: async () => { counters.discovery++; return { candidates, selected: candidates[0], strategy: 'five-technique-v1', failedLenses: [] } },
    metabolizeIdeas: async seeds => ({ candidates: seeds, offspring: [], events: [] }),
    regulateCreativeEntropy: async ({ candidates: items }) => ({ candidates: items, report: { diversityScore: 80, maxSimilarity: 0.2, threshold: 0.68, action: 'unchanged', candidateCount: items.length, antiTasteLessonIds: [], notes: [] } }),
    judgeConceptCandidates: async () => ({ source: 'model', selectedCandidateId: 'candidate-one', summary: 'Selected', rubric: ['Fit'], reviews: candidates.map(item => ({ candidateId: item.id, score: item.score, verdict: 'advance', rationale: ['Good'], strengths: ['Distinct'], weaknesses: ['None'], nextActions: ['Deliver'] })) }),
    writeScript: async selected => { counters.scripts++; return { script: `${selected.title} script`, beats: ['one', 'two', 'three'], cameraLanguage: 'Wide', narrativeStrategy: 'Visual', emotionalTurning: 'Turn', lateralThinkingTechniques: ['fixture'] } },
    reviewCreativeScript: async () => { counters.reviews++; return review(90) },
  }
}

test('same-key concurrent requests coalesce and matching retries after reload return the persisted run', async t => {
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }))
  const counters = { plans: 0, insights: 0, discovery: 0, scripts: 0, reviews: 0 }
  let service = loadService()
  const request = { goal: 'Idempotent run', brief: 'Brief', language: 'en', idempotencyKey: 'caller-key-123' }
  const [first, concurrent] = await Promise.all([
    service.runAgentWithDependencies(request, dependencies(counters)),
    service.runAgentWithDependencies(request, dependencies(counters)),
  ])
  assert.equal(first.runId, concurrent.runId)
  assert.deepEqual(counters, { plans: 1, insights: 1, discovery: 1, scripts: 2, reviews: 2 })
  assert.throws(() => service.transitionAgentRun(first.runId, 'script', 'illegal backward transition'), /Invalid agent run transition/)
  await assert.rejects(service.runAgentWithDependencies({ ...request, brief: 'Changed brief' }, dependencies(counters)), { code: 'IDEMPOTENCY_CONFLICT' })

  const approval = service.approveAgentRun(first.runId, 'trusted-test-operator', 'policy-test-v1')
  assert.equal(approval.artifactVersion, first.creativeIR.lineage.revision)
  assert.equal(service.validateAgentRunApproval(first.runId, 'policy-test-v1').valid, true)
  assert.match(service.validateAgentRunApproval(first.runId, 'policy-test-v2').reason, /policy version changed/)

  service = loadService()
  const recovered = await service.runAgentWithDependencies(request, {
    createExecutionPlan: async () => { throw new Error('completed run must not re-execute') },
  })
  assert.equal(recovered.runId, first.runId)
  assert.equal(recovered.status, 'done')
  assert.equal(recovered.creativeIR.concept.title, first.creativeIR.concept.title)
  assert.equal(recovered.approvalStatus, 'invalidated')
  assert.equal(recovered.creativeIR.provenance.approval.approvalId, approval.approvalId)
  const lifecycle = service.getAgentRunLifecycle(first.runId)
  assert.equal(lifecycle.status, 'done')
  assert.ok(lifecycle.events.some(event => event.eventType === 'run.approval.created'))
  assert.ok(lifecycle.events.some(event => event.eventType === 'run.approval.invalidated'))
  const app = express()
  app.use('/api/agent', require('../dist/agent/agent-route.js').default)
  const server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => { server.closeAllConnections(); server.close() })
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/agent/runs/${first.runId}/events`)
  assert.equal(response.status, 200)
  assert.equal((await response.json()).lifecycle.status, 'done')
  assert.deepEqual(counters, { plans: 1, insights: 1, discovery: 1, scripts: 2, reviews: 2 })
})

test('restart marks unfinished snapshots interrupted and preserves their last generated stage', t => {
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }))
  const runId = randomUUID()
  const store = require('../dist/agent/agent-run-store.js')
  store.persistAgentRun({ runId, goal: 'Interrupted run', brief: 'Saved brief', status: 'script', trace: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), script: { script: 'Existing saved script', beats: ['a', 'b', 'c'] } })
  const service = loadService()
  const recovered = service.getAgentRun(runId)
  assert.equal(recovered.status, 'interrupted')
  assert.equal(recovered.script.script, 'Existing saved script')
  assert.equal(recovered.errorDisposition, 'interrupted')
  assert.ok(recovered.trace.some(item => item.phase === 'interrupted'))
  assert.ok(store.loadAgentRunEvents().some(event => event.runId === runId && event.eventType === 'run.interrupted'))
  const eventsBeforeReload = store.loadAgentRunEvents().filter(event => event.runId === runId)
  const recoveredAgain = loadService().getAgentRun(runId)
  assert.equal(recoveredAgain.status, 'interrupted')
  assert.equal(recoveredAgain.script.script, 'Existing saved script')
  assert.deepEqual(store.loadAgentRunEvents().filter(event => event.runId === runId), eventsBeforeReload)
  const lifecycle = store.reconstructAgentRunLifecycle(runId)
  assert.equal(lifecycle.status, 'interrupted')
  assert.equal(lifecycle.events.filter(event => event.eventType === 'run.interrupted').length, 1)
})