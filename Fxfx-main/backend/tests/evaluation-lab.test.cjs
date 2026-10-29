'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const benchmark = require('./fixtures/creative-benchmark.json')
const {
  validateQualityBenchmark,
  measureRunQualityMetrics,
  evaluateControlledExperiment,
} = require('../dist/modules/creative-quality-lab.js')

test('benchmark: stable benchmark suite is valid and contains representative briefs', () => {
  const errors = validateQualityBenchmark(benchmark)
  assert.equal(errors.length, 0)
  assert.equal(benchmark.benchmarkVersion, '1.0.0')
  assert.equal(benchmark.cases.length, 5)

  // Verify privacy: no PII in benchmark cases
  for (const c of benchmark.cases) {
    assert.ok(!c.brief.includes('@'), 'Briefs must not contain email addresses')
    assert.ok(!c.brief.includes('password'), 'Briefs must not contain passwords')
    assert.ok(c.goal.length > 10, 'Goals must be descriptive')
    assert.ok(c.brief.length > 20, 'Briefs must contain concrete creative constraints')
  }
})

test('metrics: measures separate quality dimensions without collapsing into single aggregate', () => {
  const mockRun = {
    runId: 'metric-test-run-1',
    goal: 'Create a launch idea for a reusable water bottle',
    brief: 'Audience: commuters. Challenge category assumption. Must be filmable on modest budget.',
    mode: 'Gemini',
    status: 'done',
    concept: {
      title: 'The Pocket Hydration Station',
      coreIdea: 'A reusable water bottle designed specifically for busy subway commuters.',
      tagline: 'Hydrate without the mountain climb.',
    },
    script: {
      script: 'Scene 1: Subway commuter pulls out a compact reusable bottle. Scene 2: Takes a sip while train rattles. Scene 3: Smiles at fellow commuter.',
      beats: ['Commute struggle', 'Bottle reveal', 'Quiet satisfaction'],
    },
    scriptReview: {
      source: 'model',
      score: 84,
      verdict: 'ready',
      criterionScores: {
        goalAlignment: 88,
        originality: 82,
        emotionalArc: 80,
        visualSpecificity: 85,
        clarityAndPacing: 85,
        conceptIntegrity: 86,
      },
    },
    revisionHistory: [
      { artifactVersion: 1, review: { score: 72 } },
      { artifactVersion: 2, review: { score: 84 } },
    ],
    browserResearch: {
      runId: 'research-1',
      evidenceIds: ['ev-1', 'ev-2'],
      reviewStatus: 'unreviewed',
    },
    modelCalls: [
      { callId: 'call-1', task: 'candidate-generation' },
      { callId: 'call-2', task: 'critique' },
    ],
    creativeIR: {
      schemaVersion: '1.0.0',
      id: 'metric-test-run-1',
      provenance: {
        modelRoutingVersion: 'gemini-task-routing-v1',
      },
      discovery: {
        candidates: [
          { id: 'cand-1', concept: { title: 'The Pocket Hydration Station', coreIdea: 'Subway commuter reusable water bottle' } },
          { id: 'cand-2', concept: { title: 'Stationary Refill Magnet', coreIdea: 'A magnet bottle that sticks to bus rails' } },
          { id: 'cand-3', concept: { title: 'The Origami Flask', coreIdea: 'Folds flat into a briefcase after drinking' } },
        ],
      },
    },
  }

  const metrics = measureRunQualityMetrics(mockRun, { latencyMs: 1420, costUsd: 0.045 })

  // 1. Brief Adherence
  assert.ok(metrics.briefAdherence.score > 20, 'Should match keywords from brief/goal')
  assert.ok(metrics.briefAdherence.matchedKeywords.length > 0)
  assert.equal(metrics.briefAdherence.goalPresent, true)

  // 2. Novelty and Diversity
  assert.ok(metrics.noveltyAndDiversity.diversityScore > 50, 'Diverse candidates should have high diversity score')
  assert.ok(metrics.noveltyAndDiversity.distinctVocabularyCount > 10)

  // 3. Duplication
  assert.equal(metrics.candidateDuplication.candidateCount, 3)
  assert.equal(metrics.candidateDuplication.exactDuplicates, 0)

  // 4. Internal Coherence
  assert.ok(metrics.internalCoherence.score >= 80)
  assert.equal(metrics.internalCoherence.narrativeArcPresent, true)

  // 5. Evidence Quality & Unsupported Claim Rate
  assert.equal(metrics.evidenceQuality.totalReferences, 2)
  assert.equal(metrics.evidenceQuality.unreviewedCount, 2)
  assert.equal(metrics.evidenceQuality.unsupportedClaimRate, 100, 'Unreviewed evidence must report 100% unsupported claim rate')

  // 6. Revision Effectiveness
  assert.equal(metrics.revisionEffectiveness.revised, true)
  assert.equal(metrics.revisionEffectiveness.initialScore, 72)
  assert.equal(metrics.revisionEffectiveness.postRevisionScore, 84)
  assert.equal(metrics.revisionEffectiveness.scoreDelta, 12)

  // 7. Cost & Latency
  assert.equal(metrics.costAndLatency.latencyMs, 1420)
  assert.equal(metrics.costAndLatency.estimatedCostUsd, 0.045)
  assert.equal(metrics.costAndLatency.callCount, 2)
  assert.equal(metrics.costAndLatency.modelRoutingVersion, 'gemini-task-routing-v1')
})

test('experiments: controlled experiment tracks hypotheses, models, and prevents ungrounded promotion', () => {
  const baselineRun = {
    runId: 'exp-base-1',
    goal: 'Learn to code film',
    brief: 'Adult beginner embarrassments',
    concept: { title: 'Late Bloomers', coreIdea: 'Adults secretly learning at night' },
    script: { script: 'Scene 1: Screen glows. Scene 2: Syntax error. Scene 3: Hello World.', beats: ['1', '2', '3'] },
    scriptReview: { score: 75, criterionScores: { clarityAndPacing: 75, visualSpecificity: 70, emotionalArc: 75, conceptIntegrity: 75 } },
    creativeIR: { discovery: { candidates: [
      { id: 'c1', concept: { title: 'Late Bloomers', coreIdea: 'Adults learning at night' } },
      { id: 'c2', concept: { title: 'Late Bloomers Two', coreIdea: 'Adults learning at night' } },
    ] } },
  }

  const improvedRun = {
    runId: 'exp-cand-1',
    goal: 'Learn to code film',
    brief: 'Adult beginner embarrassments',
    concept: { title: 'The Undercover Apprentice', coreIdea: 'An adult beginner secretly takes an entry-level coding class to learn programming without embarrassment' },
    script: { script: 'Scene 1: Adult beginner sits in coding class. Scene 2: Overcomes embarrassment as syntax error is resolved. Scene 3: Film concludes with a successful program run.', beats: ['1', '2', '3'] },
    scriptReview: { score: 88, criterionScores: { clarityAndPacing: 88, visualSpecificity: 85, emotionalArc: 88, conceptIntegrity: 88 } },
    creativeIR: { discovery: { candidates: [
      { id: 'c1', concept: { title: 'The Undercover Apprentice', coreIdea: 'Adult beginner takes class secretly' } },
      { id: 'c2', concept: { title: 'The Silent Screen Club', coreIdea: 'Grandmothers debugging assembly together in a bakery' } },
    ] } },
  }

  const experiment = evaluateControlledExperiment({
    experimentId: 'exp-prompt-v2-test',
    hypothesis: 'System prompt v2 with domain reversal generates higher concept diversity and brief adherence',
    expectedOutcome: 'Diversity score increase >= 10 points without brief adherence regression',
    baselineConfig: {
      promptVersion: '1.0.0',
      modelId: 'gemini-3.1-flash-lite',
      rubricVersion: '1.0.0',
      routingPolicyVersion: 'gemini-task-routing-v1',
      providerMode: 'fixture',
    },
    candidateConfig: {
      promptVersion: '2.0.0',
      modelId: 'gemini-3.1-flash-lite',
      rubricVersion: '1.0.0',
      routingPolicyVersion: 'gemini-task-routing-v1',
      providerMode: 'fixture',
    },
    baselineRuns: [baselineRun],
    candidateRuns: [improvedRun],
  })

  assert.equal(experiment.experimentId, 'exp-prompt-v2-test')
  assert.equal(experiment.decision, 'promote')
  assert.ok(experiment.results.comparison.diversityDelta > 0)
  assert.equal(experiment.provenance.syntheticValidationOnly, true, 'Fixture/synthetic test runs must explicitly report syntheticValidationOnly=true')
  assert.ok(!JSON.stringify(experiment).includes('market validation'), 'Synthetic evaluations must never claim market validation')
})

test('experiments: regressed candidate is rejected with explicit rationale', () => {
  const goodRun = {
    runId: 'exp-good-1',
    goal: 'Eco bottle launch',
    brief: 'Commuter sustainability',
    concept: { title: 'The Flat Flask', coreIdea: 'Fits in jacket pocket' },
    creativeIR: { discovery: { candidates: [
      { id: 'c1', concept: { title: 'Flask 1', coreIdea: 'Jacket pocket bottle' } },
      { id: 'c2', concept: { title: 'Flask 2', coreIdea: 'Magnetic belt bottle' } },
    ] } },
  }

  const degradedRun = {
    runId: 'exp-bad-1',
    goal: 'Eco bottle launch',
    brief: 'Commuter sustainability',
    concept: { title: 'Bottle', coreIdea: 'Bottle' },
    creativeIR: { discovery: { candidates: [
      { id: 'c1', concept: { title: 'Bottle', coreIdea: 'Bottle' } },
      { id: 'c2', concept: { title: 'Bottle', coreIdea: 'Bottle' } },
    ] } },
  }

  const experiment = evaluateControlledExperiment({
    experimentId: 'exp-degrade-test',
    hypothesis: 'New high-temperature setting will increase creativity',
    expectedOutcome: 'Higher novelty without duplication regression',
    baselineConfig: { promptVersion: '1.0.0', modelId: 'gemini', rubricVersion: '1.0.0', routingPolicyVersion: 'v1', providerMode: 'fixture' },
    candidateConfig: { promptVersion: '1.0.0-high-temp', modelId: 'gemini', rubricVersion: '1.0.0', routingPolicyVersion: 'v1', providerMode: 'fixture' },
    baselineRuns: [goodRun],
    candidateRuns: [degradedRun],
  })

  assert.equal(experiment.decision, 'reject')
  assert.ok(experiment.results.comparison.duplicationDelta > 0, 'Duplication regression must be detected')
  assert.match(experiment.results.rationale, /regressed/)
})
