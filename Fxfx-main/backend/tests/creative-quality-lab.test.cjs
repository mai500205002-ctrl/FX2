'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const benchmark = require('./fixtures/creative-benchmark.json')
const { validateQualityBenchmark, aggregateArtifactRatings, analyzeCandidateDiversity, compareQualityVersions } = require('../dist/modules/creative-quality-lab.js')

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

test('candidate diversity reports exact and near duplicate pairs as lexical diagnostics', () => {
  const report = analyzeCandidateDiversity([{
    caseId: 'human-tension-01', engineVersion: 'v1', runId: 'run-1', candidates: [
      { id: 'a', concept: { title: 'Quiet doors open slowly', coreIdea: 'Quiet doors open slowly' } },
      { id: 'b', concept: { title: 'Quiet doors open slowly', coreIdea: 'Quiet doors open slowly' } },
      { id: 'c', concept: { title: 'Quiet doors open gradually', coreIdea: 'Quiet doors open slowly' } },
      { id: 'd', concept: { title: 'A distant compass guides travelers', coreIdea: 'Find another path' } },
    ],
  }])
  assert.equal(report.method, 'token-jaccard-v1')
  assert.equal(report.status, 'measured')
  assert.equal(report.runs[0].exactDuplicatePairs, 1)
  assert.ok(report.runs[0].nearDuplicatePairs >= 1)
  assert.equal(report.runs[0].candidateCount, 4)
  assert.match(report.limitations.join(' '), /do not measure semantic originality/)
})

test('candidate diversity rejects malformed runs and thresholds', () => {
  assert.throws(() => analyzeCandidateDiversity([]), /At least one candidate run/)
  assert.throws(() => analyzeCandidateDiversity([{ caseId: 'c', engineVersion: 'v', runId: 'r', candidates: [{ id: 'a', concept: {} }] }], 0), /between 0 and 1/)
})

test('benchmark CLI emits candidate diagnostics without representing fixtures as human ratings', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'textfx-diversity-cli-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const input = path.join(directory, 'candidate-runs.json')
  fs.writeFileSync(input, JSON.stringify([{
    caseId: 'human-tension-01', engineVersion: 'fixture-only', runId: 'synthetic-test-run', candidates: [
      { id: 'one', concept: { title: 'A quiet door opens', coreIdea: 'A quiet door opens' } },
      { id: 'two', concept: { title: 'A quiet door opens', coreIdea: 'A quiet door opens' } },
    ],
  }]))
  const script = path.resolve(__dirname, '../scripts/score-creative-benchmark.cjs')
  const result = spawnSync(process.execPath, [script, '--candidate-runs', input], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const report = JSON.parse(result.stdout)
  assert.equal(report.comparison, null)
  assert.equal(report.candidateDiversity.status, 'measured')
  assert.equal(report.candidateDiversity.exactDuplicatePairs, 1)
  assert.match(report.guardrail, /synthetic\/test candidate inputs/)
})
