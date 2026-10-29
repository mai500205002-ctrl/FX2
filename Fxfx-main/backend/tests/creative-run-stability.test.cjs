'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const benchmark = require('./fixtures/creative-benchmark.json')
const { analyzeRunStability } = require('../scripts/creative-run-stability.cjs')
function buildRatings({ repeats = 3, includeAllCases = true } = {}) {
  const ratings = []
  const cases = includeAllCases ? benchmark.cases.slice(0, 2) : benchmark.cases.slice(0, 1)
  for (const c of cases) for (const version of ['v1', 'v2']) for (let run = 1; run <= repeats; run++) for (let reviewer = 1; reviewer <= 3; reviewer++) {
    const score = version === 'v1' ? 2 + run : 3 + Math.min(run, 2)
    const scores = Object.fromEntries(benchmark.scoringProtocol.criteria.map(item => [item.id, score]))
    ratings.push({ caseId: c.id, artifactId: `${c.id}-${version}-run${run}`, engineVersion: version, reviewerId: `reviewer-${reviewer}`, scores })
  }
  return ratings
}

test('computes repeated-run score variability and paired case means', () => {
  const report = analyzeRunStability({ ratingsDocument: buildRatings(), benchmark, baselineVersion: 'v1', candidateVersion: 'v2', minimumRepeats: 3 })
  assert.equal(report.comparison.eligiblePairedCaseCount, 2)
  assert.equal(report.comparison.excludedCaseCount, 3)
  const cell = report.perCaseVersion.find(item => item.caseId === 'human-tension-01' && item.engineVersion === 'v1')
  assert.equal(cell.repeatCount, 3)
  assert.equal(cell.score.sampleStandardDeviation, 1)
  assert.equal(report.comparison.meanPairedDelta, 0.667)
})

test('insufficient repeats are excluded instead of silently treated as stable', () => {
  const report = analyzeRunStability({ ratingsDocument: buildRatings({ repeats: 2 }), benchmark, baselineVersion: 'v1', candidateVersion: 'v2', minimumRepeats: 3 })
  assert.equal(report.comparison.eligiblePairedCaseCount, 0)
  assert.ok(report.perCaseVersion.every(item => item.enoughRepeats === false))
  assert.match(report.comparison.interpretation, /No cases meet/)
})

test('rejects a minimum repeat threshold below two and missing versions', () => {
  assert.throws(() => analyzeRunStability({ ratingsDocument: buildRatings(), benchmark, baselineVersion: 'v1', candidateVersion: 'v2', minimumRepeats: 1 }), /at least 2/)
  assert.throws(() => analyzeRunStability({ ratingsDocument: buildRatings(), benchmark, baselineVersion: 'v1', candidateVersion: 'v3' }), /Both requested versions/)
})

test('rejects invalid reviewer scores via the Quality Lab validation', () => {
  const ratings = buildRatings()
  ratings[0].scores.originality = 9
  assert.throws(() => analyzeRunStability({ ratingsDocument: ratings, benchmark, baselineVersion: 'v1', candidateVersion: 'v2' }), /between 1 and 5/)
})
