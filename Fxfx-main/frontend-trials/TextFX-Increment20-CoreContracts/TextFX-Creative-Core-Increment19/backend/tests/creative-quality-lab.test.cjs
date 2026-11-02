'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const benchmark = require('./fixtures/creative-benchmark.json')
const { validateQualityBenchmark, aggregateArtifactRatings, compareQualityVersions } = require('../dist/modules/creative-quality-lab.js')

function rating(caseId, artifactId, engineVersion, reviewerId, value) {
  return {
    caseId, artifactId, engineVersion, reviewerId,
    scores: Object.fromEntries(benchmark.scoringProtocol.criteria.map(item => [item.id, value])),
  }
}

test('benchmark fixture is valid and uses unique case/criterion IDs', () => {
  assert.deepEqual(validateQualityBenchmark(benchmark), [])
})

test('artifact score uses declared criterion weights and requires three independent reviewers by default', () => {
  const ratings = [rating('human-tension-01', 'a-v1', 'v1', 'r1', 3), rating('human-tension-01', 'a-v1', 'v1', 'r2', 4)]
  const [summary] = aggregateArtifactRatings({ benchmark, ratings })
  assert.equal(summary.weightedScore, 3.5)
  assert.equal(summary.reviewerCount, 2)
  assert.equal(summary.complete, false)
  assert.match(summary.warnings.join(' '), /Needs 1 more independent reviewer/)
})

test('paired version comparison reports descriptive per-case deltas only', () => {
  const ratings = [
    ...[1, 2, 3].map(n => rating('human-tension-01', 'a-v1', 'v1', `r${n}`, 3)),
    ...[1, 2, 3].map(n => rating('human-tension-01', 'a-v2', 'v2', `r${n}`, 4)),
    ...[1, 2, 3].map(n => rating('category-reversal-02', 'b-v1', 'v1', `r${n}`, 4)),
    ...[1, 2, 3].map(n => rating('category-reversal-02', 'b-v2', 'v2', `r${n}`, 3)),
  ]
  const summaries = aggregateArtifactRatings({ benchmark, ratings })
  const comparison = compareQualityVersions(summaries, 'v1', 'v2')
  assert.equal(comparison.pairedCaseCount, 2)
  assert.equal(comparison.wins, 1)
  assert.equal(comparison.losses, 1)
  assert.equal(comparison.meanDelta, 0)
  assert.match(comparison.interpretation, /does not establish statistical significance/)
})

test('invalid scores and duplicate reviewer entries are rejected', () => {
  assert.throws(() => aggregateArtifactRatings({ benchmark, ratings: [rating('human-tension-01', 'a', 'v1', 'r1', 6)] }), /between 1 and 5/)
  assert.throws(() => aggregateArtifactRatings({ benchmark, minimumReviewers: 1, ratings: [rating('human-tension-01', 'a', 'v1', 'r1', 3), rating('human-tension-01', 'a', 'v1', 'r1', 4)] }), /Duplicate reviewer/)
})

test('incomplete or unpaired cases do not become version evidence', () => {
  const summaries = aggregateArtifactRatings({ benchmark, minimumReviewers: 1, ratings: [rating('human-tension-01', 'a-v1', 'v1', 'r1', 3)] })
  const comparison = compareQualityVersions(summaries, 'v1', 'v2')
  assert.equal(comparison.pairedCaseCount, 0)
  assert.equal(comparison.meanDelta, null)
  assert.match(comparison.interpretation, /No complete paired cases/)
})
