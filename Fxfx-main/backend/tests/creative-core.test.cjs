'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

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

test('counterfactual runner-up excludes rejected candidates and prefers Court score', () => {
  const candidates = [candidate('chosen', 90), candidate('runner-up-a', 88), candidate('runner-up-b', 70)]
  const court = { reviews: [
    { candidateId: 'runner-up-a', score: 61, verdict: 'revise' },
    { candidateId: 'runner-up-b', score: 94, verdict: 'reject' },
  ] }
  assert.equal(selectCounterfactualCandidate(candidates, 'chosen', court).id, 'runner-up-a')
})

test('counterfactual replay is skipped when every alternative was explicitly rejected', () => {
  const candidates = [candidate('chosen', 90), candidate('rejected-a', 99), candidate('rejected-b', 95)]
  const court = { reviews: [
    { candidateId: 'chosen', score: 90, verdict: 'advance' },
    { candidateId: 'rejected-a', score: 99, verdict: 'reject' },
    { candidateId: 'rejected-b', score: 95, verdict: 'reject' },
  ] }
  assert.equal(selectCounterfactualCandidate(candidates, 'chosen', court), undefined)
})

test('counterfactual selection still uses discovery scores when no Court decision exists', () => {
  const candidates = [candidate('chosen', 90), candidate('runner-up-a', 88), candidate('runner-up-b', 70)]
  assert.equal(selectCounterfactualCandidate(candidates, 'chosen').id, 'runner-up-a')
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
  const validEvidence = {
    status: 'compared', method: 'bounded-shadow-script-review-v1',
    selectedCandidateId: 'main', alternativeCandidateId: 'shadow',
    primaryReviewSource: 'model', shadowReviewSource: 'model',
    primaryScore: 72, shadowScore: 84, scoreDelta: 12,
    primaryVerdict: 'revise', shadowVerdict: 'ready', interpretation: 'Test-only evidence.', limitations: [],
  }
  recordCounterfactualEvidence('model-run', validEvidence)
  // Keep malformed comparisons in the audit ledger, but never count them as evaluation evidence.
  recordCounterfactualEvidence('nan-run', { ...validEvidence, scoreDelta: Number.NaN })
  recordCounterfactualEvidence('mismatch-run', { ...validEvidence, scoreDelta: 99 })
  recordCounterfactualEvidence('out-of-range-run', { ...validEvidence, shadowScore: 120, scoreDelta: 48 })

  const status = getCreativeMemoryStatus()
  assert.equal(status.persistence, 'durable')
  assert.equal(status.evaluation.evidenceCount, 4)
  assert.equal(status.evaluation.comparableModelReviewCount, 1)
  assert.equal(status.evaluation.positiveShadowCount, 1)
  assert.equal(status.evaluation.meanShadowScoreDelta, 12)
  const persisted = JSON.parse(fs.readFileSync(process.env.TEXTFX_CREATIVE_MEMORY_PATH, 'utf8'))
  assert.equal(persisted.schemaVersion, 1)
  assert.ok(persisted.lessons.length > 0)
  assert.equal(persisted.counterfactualEvidence.length, 4)
})

test('creative memory preserves malformed historical audit entries across reload and later writes', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'textfx-memory-reload-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const statePath = path.join(directory, 'creative-memory.json')
  const malformedAuditEntry = {
    runId: 'legacy-bad-run',
    recordedAt: 'legacy timestamp',
    status: 'compared',
    primarySource: 'model',
    shadowSource: 'model',
    primaryScore: null,
    shadowScore: 84,
    scoreDelta: null,
  }
  fs.writeFileSync(statePath, JSON.stringify({
    schemaVersion: 1,
    lessons: [],
    counterfactualEvidence: [null, malformedAuditEntry],
  }))

  const modulePath = path.resolve(__dirname, '../dist/modules/creative-memory.js')
  const childScript = `
    const memory = require(${JSON.stringify(modulePath)})
    const before = memory.getCreativeMemoryStatus()
    if (before.evaluation.evidenceCount !== 2 || before.evaluation.comparableModelReviewCount !== 0) process.exit(11)
    memory.learnFromCreativeReview({
      runId: 'reload-test-run',
      query: 'memory persistence integrity',
      review: {
        source: 'model', score: 80, verdict: 'ready', criterionScores: {},
        strengths: ['Preserve traceable historical evidence.'],
        weaknesses: [], revisionBrief: [], summary: 'Persistence regression fixture.',
      },
    })
  `
  const child = spawnSync(process.execPath, ['-e', childScript], {
    encoding: 'utf8',
    env: { ...process.env, TEXTFX_CREATIVE_MEMORY_PATH: statePath },
  })
  assert.equal(child.status, 0, child.stderr || child.stdout)
  const persisted = JSON.parse(fs.readFileSync(statePath, 'utf8'))
  assert.equal(persisted.counterfactualEvidence.length, 2)
  assert.equal(persisted.counterfactualEvidence[0], null)
  assert.deepEqual(persisted.counterfactualEvidence[1], malformedAuditEntry)
  assert.ok(persisted.lessons.length > 0)
})

test('creative memory quarantines invalid lessons without using or deleting them', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'textfx-lesson-quarantine-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const statePath = path.join(directory, 'creative-memory.json')
  const validLesson = {
    id: 'valid-lesson',
    polarity: 'reinforce',
    lesson: 'Use a concrete visual reversal.',
    sourceRunId: 'source-run',
    sourceScore: 82,
    createdAt: '2026-10-01T12:00:00.000Z',
    tags: ['campaign', 'visual'],
  }
  const invalidLessons = [
    { ...validLesson, id: '' },
    { ...validLesson, sourceScore: 1e999 },
    { ...validLesson, createdAt: 'not-a-date' },
    { ...validLesson, tags: ['campaign', 42] },
    { ...validLesson, lesson: 'x'.repeat(321) },
  ]
  fs.writeFileSync(statePath, JSON.stringify({
    schemaVersion: 1,
    lessons: [validLesson, ...invalidLessons],
    counterfactualEvidence: [],
  }))

  const modulePath = path.resolve(__dirname, '../dist/modules/creative-memory.js')
  const childScript = `
    const memory = require(${JSON.stringify(modulePath)})
    const status = memory.getCreativeMemoryStatus()
    if (status.lessonCount !== 1 || status.quarantinedLessonCount !== 5) process.exit(21)
    const retrieved = memory.retrieveCreativeMemory('campaign visual', 8)
    if (retrieved.lessons.length !== 1 || retrieved.lessons[0].id !== 'valid-lesson') process.exit(22)
    memory.learnFromCreativeReview({
      runId: 'new-run',
      query: 'new campaign visual',
      review: {
        source: 'model', score: 80, verdict: 'ready', criterionScores: {},
        strengths: ['Keep the visual reveal concrete.'],
        weaknesses: [], revisionBrief: [], summary: 'Persistence fixture.',
      },
    })
    const after = memory.getCreativeMemoryStatus()
    if (after.quarantinedLessonCount !== 5) process.exit(23)
  `
  const child = spawnSync(process.execPath, ['-e', childScript], {
    encoding: 'utf8',
    env: { ...process.env, TEXTFX_CREATIVE_MEMORY_PATH: statePath },
  })
  assert.equal(child.status, 0, child.stderr || child.stdout)
  const persisted = JSON.parse(fs.readFileSync(statePath, 'utf8'))
  assert.equal(persisted.lessons.length, 2)
  assert.equal(persisted.quarantinedLessons.length, 5)
  assert.deepEqual(persisted.quarantinedLessons, invalidLessons.map((item, index) =>
    index === 1 ? { ...item, sourceScore: null } : item
  ))
})

test('temporary test state is cleaned up', () => {
  fs.rmSync(tempRoot, { recursive: true, force: true })
  assert.equal(fs.existsSync(tempRoot), false)
})
