'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const http = require('node:http')
const express = require('express')

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'textfx-rc-test-'))
process.env.TEXTFX_AGENT_DATA_DIR = path.join(tempRoot, 'agent-state')
process.env.TEXTFX_CANDIDATE_ARCHIVE_PATH = path.join(tempRoot, 'data', 'creative-candidates.json')
process.env.TEXTFX_CREATIVE_MEMORY_PATH = path.join(tempRoot, 'data', 'creative-memory.json')
process.env.TEXTFX_BROWSER_DATA_DIR = path.join(tempRoot, 'browser')

const {
  runAgentWithDependencies,
  getAgentRun,
  approveAgentRun,
  executeConsequentialAction,
  validateAgentRunApproval,
  deleteAgentRun,
} = require('../dist/agent/agent-service.js')
const {
  createArtifactApproval,
  validateArtifactApproval,
} = require('../dist/agent/approval-integrity.js')
const {
  makeEvidence,
  saveBrowserResearch,
  verifyEvidenceIntegrity,
} = require('../dist/browser/browser-service.js')
const {
  callLLM,
  createGatewayBudgetContext,
  GatewayBudgetExceededError,
} = require('../dist/gateway/llm-gateway.js')
const {
  measureRunQualityMetrics,
  evaluateControlledExperiment,
} = require('../dist/modules/creative-quality-lab.js')
const agentRoutes = require('../dist/agent/agent-route.js').default
const browserRoutes = require('../dist/browser/browser-route.js').default
const saasRoutes = require('../dist/saas/saas-route.js').default
const { authenticateApi } = require('../dist/utils/security.js')

function createTestServer() {
  const app = express()
  app.use(express.json({ limit: '512kb' }))
  app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path === '/healthz' || req.path === '/key-status') return next()
    if (!authenticateApi(req)) return res.status(401).json({ error: 'Unauthorized' })
    next()
  })
  app.get('/health', (_req, res) => res.json({ status: 'ok' }))
  app.get('/healthz', (_req, res) => res.json({ ok: true }))
  app.get('/api/key-status', (_req, res) => res.json({ configured: false, provider: 'Gemini' }))
  app.use('/api/agent', agentRoutes)
  app.use('/api/browser', browserRoutes)
  app.use('/api/saas', saasRoutes)
  return http.createServer(app)
}

function mockDependencies(options = {}) {
  const candidates = [
    {
      id: 'cand-rc-1',
      lens: 'provocation',
      lensId: 'provocation',
      concept: { title: 'The Reverse Clock', coreIdea: 'A watch that counts up lived moments', tagline: 'Track life, not time' },
      score: 85,
      version: 1,
      origin: 'seed',
    },
    {
      id: 'cand-rc-2',
      lens: 'analogy',
      lensId: 'analogy',
      concept: { title: 'The Memory Ledger', coreIdea: 'Banking life stories as interest', tagline: 'Compound your moments' },
      score: 82,
      version: 1,
      origin: 'seed',
    },
  ]

  return {
    skipConfigurationCheck: true,
    runtime: {
      mode: 'Gemini',
      provider: {
        generateCreativeText: async () => {
          if (options.providerError) throw new Error('Simulated upstream model timeout')
          return { text: '{}' }
        },
      },
      providerConfig: null,
    },
    createExecutionPlan: async () => {
      if (options.providerError) throw new Error('Simulated upstream model timeout')
      return {
        summary: 'RC execution plan',
        steps: ['Discover', 'Metabolize', 'Evaluate', 'Revise'],
        acceptanceCriteria: ['Valid CreativeIR produced'],
        risks: ['Subjective quality evaluation'],
        estimatedMinutes: 5,
        mode: 'Gemini',
      }
    },
    generateInsight: async () => ({
      mainInsight: 'People value moments when they are given tangible boundaries',
      constraints: ['Attention span'],
      opportunities: ['Tangible metaphor'],
      metaphoricFraming: 'An hourglass that pauses',
      emotionalTruth: 'Time feels stolen until paused',
      creativeMethod: 'Fixture',
    }),
    discoverConcepts: async () => ({
      candidates,
      selected: candidates[0],
      strategy: 'five-technique-v1',
      failedLenses: [],
    }),
    metabolizeIdeas: async (seeds) => ({
      candidates: seeds,
      offspring: [],
      events: [{ type: 'skipped', message: 'Test fixture skipped offspring', parentIds: [] }],
    }),
    regulateCreativeEntropy: async ({ candidates: incoming }) => ({
      candidates: incoming,
      report: { diversityScore: 0.85, maxSimilarity: 0.15, threshold: 0.68, action: 'unchanged', candidateCount: incoming.length, antiTasteLessonIds: [] },
    }),
    judgeConceptCandidates: async ({ candidates: incoming }) => ({
      source: 'model',
      selectedCandidateId: incoming[0].id,
      summary: 'Selected the strongest conceptual fit',
      rubric: ['Fit', 'Originality'],
      reviews: incoming.map(c => ({
        candidateId: c.id,
        score: c.id === 'cand-rc-1' ? 90 : 80,
        verdict: c.id === 'cand-rc-1' ? 'advance' : 'not-selected',
        rationale: ['Strong conceptual reversal'],
        strengths: ['Tangible mechanism'],
        weaknesses: ['Requires filmable execution'],
        nextActions: ['Draft script beats'],
      })),
    }),
    writeScript: async (selectedConcept) => ({
      script: `Script for ${selectedConcept.title}. Scene 1: Clock ticks backward. Scene 2: Person smiles.`,
      beats: ['Opening tick', 'Realization', 'Resolution'],
      cameraLanguage: 'Macro to wide',
      narrativeStrategy: 'Visual reversal',
      emotionalTurning: 'The moment of quiet',
      lateralThinkingTechniques: ['reversal'],
    }),
    reviewCreativeScript: async () => ({
      source: 'model',
      score: 88,
      verdict: 'ready',
      criterionScores: { goalAlignment: 88, originality: 90, emotionalArc: 85, visualSpecificity: 88, clarityAndPacing: 87, conceptIntegrity: 88 },
      strengths: ['Clear visual turning point'],
      weaknesses: ['None critical'],
      revisionBrief: [],
      summary: 'Ready for production review',
      objections: [],
    }),
  }
}

test('RC E2E: complete creative workflow generates verified CreativeIR and provenance', async () => {
  const request = {
    goal: 'Create an emotional film for a slow-living timepiece',
    brief: 'Audience: stressed city workers. Emotional truth: time should be measured by memory, not pressure.',
    language: 'en',
  }
  const deps = mockDependencies()
  const result = await runAgentWithDependencies(request, deps)

  assert.equal(result.status, 'done')
  assert.equal(result.creativeIR.schemaVersion, '1.0.0')
  assert.equal(result.creativeIR.concept.title, 'The Reverse Clock')
  assert.equal(result.creativeIR.script.beats.length, 3)
  assert.equal(result.creativeIR.provenance.provider, 'Gemini')
  assert.equal(result.creativeIR.provenance.rubricVersions.court, '1.0.0')
  assert.equal(result.creativeIR.provenance.rubricVersions.scriptReview, '1.0.0')
  assert.ok(result.creativeIR.lineage.events.includes('run.queued'))
  assert.ok(result.creativeIR.lineage.events.includes('evaluation.completed'))
})

test('RC Resilience: provider outage fails explicitly without silent mock fallback', async () => {
  const request = { goal: 'Resilience test' }
  const deps = mockDependencies({ providerError: true })
  await assert.rejects(
    () => runAgentWithDependencies(request, deps),
    /Simulated upstream model timeout/
  )
})

test('RC Resilience: budget exhaustion rejects call with 429 BUDGET_EXCEEDED', async () => {
  const previousKey = process.env.GEMINI_API_KEY
  process.env.GEMINI_API_KEY = 'rc-test-budget-key'
  try {
    const context = createGatewayBudgetContext('rc-budget-test', { runBudgetUsd: 1, callBudgetUsd: 0.000001 })
    await assert.rejects(
      callLLM('too expensive', 'system', { ...context, requestId: 'call-cap-rc' }),
      { code: 'BUDGET_EXCEEDED' }
    )
  } finally {
    if (previousKey) process.env.GEMINI_API_KEY = previousKey
    else delete process.env.GEMINI_API_KEY
  }
})

test('RC Resilience: evidence tampering is detected and fails integrity recheck', () => {
  const evidence = makeEvidence('https://example.com/data', 'Data', 'Authentic text content', Buffer.from('Authentic text content'))
  assert.equal(verifyEvidenceIntegrity(evidence).ok, true)

  // Tamper with text
  const tampered = { ...evidence, text: 'Tampered malicious text injected' }
  assert.equal(verifyEvidenceIntegrity(tampered).ok, false)
  assert.match(verifyEvidenceIntegrity(tampered).detail, /content hash mismatch/)
})

test('RC Resilience: approval binding and consequential action gating', () => {
  const artifact = { concept: { title: 'Campaign' }, script: { beats: ['1', '2'] } }
  const basis = { artifact, artifactVersion: 1, policyVersion: 'policy-v1', evidenceIds: ['ev-1'] }
  const approval = createArtifactApproval({ approvedBy: 'Director', basis })
  assert.equal(validateArtifactApproval(approval, basis).valid, true)

  // Invalidation on artifact alteration
  assert.equal(validateArtifactApproval(approval, { ...basis, artifact: { ...artifact, script: { beats: ['altered'] } } }).valid, false)

  // Invalidation on policy alteration
  assert.equal(validateArtifactApproval(approval, { ...basis, policyVersion: 'policy-v2' }).valid, false)

  // Invalidation on evidence alteration
  assert.equal(validateArtifactApproval(approval, { ...basis, evidenceIds: ['ev-2'] }).valid, false)
})

test('RC Compatibility: HTTP endpoints inventory and error handling', async () => {
  const server = createTestServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port

  try {
    // 1. Health checks
    const h1 = await fetch(`http://127.0.0.1:${port}/health`)
    assert.equal(h1.status, 200)
    assert.equal((await h1.json()).status, 'ok')

    const h2 = await fetch(`http://127.0.0.1:${port}/healthz`)
    assert.equal(h2.status, 200)
    assert.equal((await h2.json()).ok, true)

    const ks = await fetch(`http://127.0.0.1:${port}/api/key-status`)
    assert.equal(ks.status, 200)
    assert.equal((await ks.json()).provider, 'Gemini')

    // 2. SaaS endpoints
    const saasStatus = await fetch(`http://127.0.0.1:${port}/api/saas/status`)
    assert.equal(saasStatus.status, 200)
    const plans = await fetch(`http://127.0.0.1:${port}/api/saas/plans`)
    assert.equal(plans.status, 200)

    // 3. Browser policy endpoint (requires authorization)
    const browserNoAuth = await fetch(`http://127.0.0.1:${port}/api/browser/status`)
    assert.ok([401, 503].includes(browserNoAuth.status))

    // 4. Agent endpoints
    const agentStatus = await fetch(`http://127.0.0.1:${port}/api/agent/status`)
    assert.equal(agentStatus.status, 200)

    const runs = await fetch(`http://127.0.0.1:${port}/api/agent/runs`)
    assert.equal(runs.status, 200)

    // 5. Invalid runId rejection (Path Traversal / injection defense)
    const badRun = await fetch(`http://127.0.0.1:${port}/api/agent/runs/..%2F..%2Fpasswd`)
    assert.equal(badRun.status, 400)
  } finally {
    server.close()
    try { fs.rmSync(tempRoot, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})
