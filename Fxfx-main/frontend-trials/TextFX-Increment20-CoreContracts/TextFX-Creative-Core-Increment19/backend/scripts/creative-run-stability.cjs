#!/usr/bin/env node
'use strict'
const fs = require('node:fs')
const path = require('node:path')
const { aggregateArtifactRatings } = require('../dist/modules/creative-quality-lab.js')
const round = (value, digits = 3) => Math.round(value * (10 ** digits)) / (10 ** digits)
function readJson(file) { return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) }
function writeJson(file, value) {
  const target = path.resolve(file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  try { fs.chmodSync(target, 0o600) } catch { /* Windows may not support POSIX permissions. */ }
}
function stats(values) {
  if (!values.length) return { count: 0, mean: null, sampleStandardDeviation: null, min: null, max: null, range: null }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.length > 1 ? values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (values.length - 1) : null
  const min = Math.min(...values), max = Math.max(...values)
  return { count: values.length, mean: round(mean), sampleStandardDeviation: variance === null ? null : round(Math.sqrt(variance)), min: round(min), max: round(max), range: round(max - min) }
}
function analyzeRunStability({ ratingsDocument, benchmark, baselineVersion, candidateVersion, minimumRepeats = 3 }) {
  const ratings = Array.isArray(ratingsDocument) ? ratingsDocument : ratingsDocument?.ratings
  if (!Array.isArray(ratings) || ratings.length === 0) throw new Error('A non-empty combined finalized ratings array is required.')
  if (typeof baselineVersion !== 'string' || typeof candidateVersion !== 'string' || !baselineVersion.trim() || !candidateVersion.trim() || baselineVersion === candidateVersion) throw new Error('Two distinct versions are required.')
  if (!Number.isInteger(minimumRepeats) || minimumRepeats < 2) throw new Error('minimumRepeats must be an integer of at least 2.')
  const summaries = aggregateArtifactRatings({ benchmark, ratings })
  const versions = [...new Set(summaries.map(item => item.engineVersion))]
  if (!versions.includes(baselineVersion) || !versions.includes(candidateVersion)) throw new Error('Both requested versions must exist in the ratings.')
  const complete = summaries.filter(item => item.complete && item.weightedScore !== null)
  const groups = new Map()
  for (const item of complete) {
    const key = `${item.caseId}\u0000${item.engineVersion}`
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  }
  const perCaseVersion = []
  for (const benchmarkCase of benchmark.cases) {
    for (const version of [baselineVersion, candidateVersion]) {
      const items = groups.get(`${benchmarkCase.id}\u0000${version}`) ?? []
      const scoreStats = stats(items.map(item => item.weightedScore))
      const criterionStability = {}
      for (const criterion of benchmark.scoringProtocol.criteria) {
        criterionStability[criterion.id] = stats(items.map(item => item.criterionMeans[criterion.id]).filter(Number.isFinite))
      }
      perCaseVersion.push({
        caseId: benchmarkCase.id,
        engineVersion: version,
        repeatCount: items.length,
        enoughRepeats: items.length >= minimumRepeats,
        score: scoreStats,
        criterionStability,
        artifactIds: items.map(item => item.artifactId),
        warnings: items.length < minimumRepeats ? [`Needs ${minimumRepeats - items.length} more complete independent output(s) for a repeated-run stability estimate.`] : [],
      })
    }
  }
  const find = (caseId, version) => perCaseVersion.find(item => item.caseId === caseId && item.engineVersion === version)
  const paired = benchmark.cases.map(item => {
    const baseline = find(item.id, baselineVersion), candidate = find(item.id, candidateVersion)
    if (!baseline.enoughRepeats || !candidate.enoughRepeats || baseline.score.mean === null || candidate.score.mean === null) return { caseId: item.id, eligible: false, baselineMean: baseline.score.mean, candidateMean: candidate.score.mean, delta: null, reason: 'Both versions need the configured minimum number of complete repeats.' }
    return { caseId: item.id, eligible: true, baselineMean: baseline.score.mean, candidateMean: candidate.score.mean, delta: round(candidate.score.mean - baseline.score.mean) }
  })
  const eligible = paired.filter(item => item.eligible)
  const deltas = eligible.map(item => item.delta)
  const baselineMeans = eligible.map(item => item.baselineMean), candidateMeans = eligible.map(item => item.candidateMean)
  return {
    reportVersion: '1.0.0', generatedAt: new Date().toISOString(), benchmarkVersion: benchmark.benchmarkVersion,
    versions: { baseline: baselineVersion, candidate: candidateVersion }, minimumRepeats,
    input: { ratingCount: ratings.length, artifactCount: new Set(ratings.map(item => item.artifactId)).size, completeArtifactCount: complete.length },
    perCaseVersion,
    comparison: {
      eligiblePairedCaseCount: eligible.length,
      excludedCaseCount: paired.length - eligible.length,
      pairedCases: paired,
      baselineMeanAcrossEligibleCases: stats(baselineMeans).mean,
      candidateMeanAcrossEligibleCases: stats(candidateMeans).mean,
      meanPairedDelta: deltas.length ? round(deltas.reduce((sum, value) => sum + value, 0) / deltas.length) : null,
      interpretation: eligible.length ? 'Repeated-run descriptive stability and paired means only; no statistical significance, causality, or audience impact is established.' : 'No cases meet the repeated-run minimum for both versions; no comparison conclusion is available.',
    },
    limitations: [
      'Repeated outputs are only independent if generation runs were actually separate; duplicate copies must not be submitted as replicates.',
      'The minimum repeat count is a workflow guardrail, not a guarantee of statistical power.',
      'A mean score can hide creative diversity; inspect individual artifacts and criterion-level spread.',
      'Do not change generation policy automatically based on this report.',
    ],
  }
}
function main(argv = process.argv.slice(2)) {
  const get = name => { const i = argv.indexOf(name); return i < 0 ? undefined : argv[i + 1] }
  const ratings = get('--ratings'), baseline = get('--baseline'), candidate = get('--candidate'), out = get('--out')
  if (!ratings || !baseline || !candidate || !out) {
    console.error('Usage: node scripts/creative-run-stability.cjs --ratings combined-finalized-ratings.json --baseline v1 --candidate v2 --out stability-report.json [--min-repeats 3] [--benchmark benchmark.json]')
    return 2
  }
  try {
    const benchmarkPath = get('--benchmark') || path.resolve(__dirname, '../tests/fixtures/creative-benchmark.json')
    const report = analyzeRunStability({ ratingsDocument: readJson(ratings), benchmark: readJson(benchmarkPath), baselineVersion: baseline, candidateVersion: candidate, minimumRepeats: Number(get('--min-repeats') || 3) })
    writeJson(out, report)
    process.stdout.write(`Run stability: ${report.comparison.eligiblePairedCaseCount} paired cases eligible; mean paired delta ${report.comparison.meanPairedDelta ?? 'not available'}.\n`)
    process.stdout.write(`Report: ${path.resolve(out)}\n`)
    return 0
  } catch (error) {
    console.error(`Creative run stability analysis failed: ${error instanceof Error ? error.message : String(error)}`)
    return 2
  }
}
if (require.main === module) process.exitCode = main()
module.exports = { analyzeRunStability, stats }
