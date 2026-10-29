'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'textfx-creative-tests-'))
process.env.TEXTFX_CREATIVE_MEMORY_PATH = path.join(tempRoot, 'creative-memory.json')

const { selectCounterfactualCandidate, compareCounterfactualReviews } = require('../dist/modules/counterfactual-replay.js')
const { validateCreativeIR, CREATIVE_IR_VERSION } = require('../dist/core/creative-ir.js')
const { learnFromCreativeReview, recordCounterfactualEvidence, getCreativeMemoryStatus } = require('../dist/modules/creative-memory.js')

function candidate(id, score) {
  return { id, score, lens: 'test', rationale: [], concept: { title: id, coreIdea: `idea ${id}` } }
}

function review(overrides = {}) {
  return {
    source: 'model', score: 80, verdict: 'ready',
    criterionScores: {
      goalAlignment: 80, originality: 80, emotionalArc: 80,
      visualSpecificity: 80, clarityAndPacing: 80, conceptIntegrity: 80,
    },
    strengths: ['Concrete visual contrast works well.'],
    weaknesses: ['The ending could be less predictable.'],
    revisionBrief: ['Make the final image more surprising.'],
    summary: 'A coherent test review.',
    ...overrides,
  }
}

test('counterfactual runner-up excludes selected candidate and prefers Court score', () => {
  const candidates = [candidate('chosen', 90), candidate('runner-up-a', 88), candidate('runner-up-b', 70)]
  const court = { reviews: [{ candidateId: 'runner-up-a', score: 61 }, { candidateId: 'runner-up-b', score: 94 }] }
  assert.equal(selectCounterfactualCandidate(candidates, 'chosen', court).id, 'runner-up-b')
})

test('counterfactual review comparison reports positive shadow delta without claiming causality', () => {
  const result = compareCounterfactualReviews({
    selectedCandidateId: 'main', alternativeCandidateId: 'shadow',
    primary: review({ score: 72 }), shadow: review({ score: 84 }),
  })
  assert.equal(result.status, 'compared')
  assert.equal(result.scoreDelta, 12)
  assert.match(result.interpretation, /without changing the delivered selection/)
  assert.ok(result.limitations.length >= 3)
})

test('fallback review makes counterfactual comparison inconclusive', () => {
  const result = compareCounterfactualReviews({
    selectedCandidateId: 'main', alternativeCandidateId: 'shadow',
    primary: review(), shadow: review({ source: 'heuristic-fallback', score: 55 }),
  })
  assert.equal(result.status, 'inconclusive')
  assert.match(result.interpretation, /no quality winner is declared/)
})

test('CreativeIR validator rejects unsupported schema versions', () => {
  assert.throws(() => validateCreativeIR({ schemaVersion: '99.0.0' }), /schemaVersion/)
  assert.equal(CREATIVE_IR_VERSION, '1.0.0')
})

test('creative memory learns only from model reviews and persists bounded evidence', () => {
  const fallbackLessons = learnFromCreativeReview({ runId: 'fallback-run', query: 'campaign story', review: review({ source: 'heuristic-fallback' }) })
  assert.equal(fallbackLessons.length, 0)

  const learned = learnFromCreativeReview({ runId: 'model-run', query: 'campaign story', review: review() })
  assert.ok(learned.length > 0)
  recordCounterfactualEvidence('model-run', {
    status: 'compared', method: 'bounded-shadow-script-review-v1',
    selectedCandidateId: 'main', alternativeCandidateId: 'shadow',
    primaryReviewSource: 'model', shadowReviewSource: 'model',
    primaryScore: 72, shadowScore: 84, scoreDelta: 12,
    primaryVerdict: 'revise', shadowVerdict: 'ready', interpretation: 'Test-only evidence.', limitations: [],
  })

  const status = getCreativeMemoryStatus()
  assert.equal(status.persistence, 'durable')
  assert.equal(status.evaluation.comparableModelReviewCount, 1)
  const persisted = JSON.parse(fs.readFileSync(process.env.TEXTFX_CREATIVE_MEMORY_PATH, 'utf8'))
  assert.equal(persisted.schemaVersion, 1)
  assert.ok(persisted.lessons.length > 0)
  assert.equal(persisted.counterfactualEvidence.length, 1)
})

test('temporary test state is cleaned up', () => {
  fs.rmSync(tempRoot, { recursive: true, force: true })
  assert.equal(fs.existsSync(tempRoot), false)
})
