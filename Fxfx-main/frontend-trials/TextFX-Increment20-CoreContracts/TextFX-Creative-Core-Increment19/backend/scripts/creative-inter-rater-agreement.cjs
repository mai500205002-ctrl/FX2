#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')

function readJson(file) { return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) }
function writeJson(file, value) {
  const target = path.resolve(file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
const round = (value, digits = 3) => Math.round(value * (10 ** digits)) / (10 ** digits)

function analyzeInterRaterAgreement({ ratingsDocument, benchmark, disagreementSpreadThreshold = 2 }) {
  const ratings = Array.isArray(ratingsDocument) ? ratingsDocument : ratingsDocument?.ratings
  if (!Array.isArray(ratings) || ratings.length === 0) throw new Error('A non-empty ratings array is required.')
  if (!benchmark || !Array.isArray(benchmark.scoringProtocol?.criteria) || benchmark.scoringProtocol.criteria.length === 0) throw new Error('Benchmark scoring criteria are required.')
  if (!Number.isFinite(disagreementSpreadThreshold) || disagreementSpreadThreshold < 1 || disagreementSpreadThreshold > 4) throw new Error('disagreementSpreadThreshold must be between 1 and 4.')
  const criterionIds = benchmark.scoringProtocol.criteria.map(item => item.id)
  if (criterionIds.some(id => typeof id !== 'string' || !id.trim()) || new Set(criterionIds).size !== criterionIds.length) throw new Error('Benchmark criterion IDs must be non-empty and unique.')
  const groups = new Map()
  const seen = new Set()
  for (const [index, rating] of ratings.entries()) {
    if (!rating || typeof rating !== 'object') throw new Error(`Rating ${index + 1} must be an object.`)
    for (const key of ['artifactId', 'caseId', 'reviewerId']) if (typeof rating[key] !== 'string' || !rating[key].trim()) throw new Error(`Rating ${index + 1} needs ${key}.`)
    if (!rating.scores || typeof rating.scores !== 'object' || Array.isArray(rating.scores)) throw new Error(`Rating ${index + 1} needs scores.`)
    const duplicate = `${rating.artifactId}\u0000${rating.reviewerId}`
    if (seen.has(duplicate)) throw new Error(`Duplicate reviewer ${rating.reviewerId} for artifact ${rating.artifactId}.`)
    seen.add(duplicate)
    for (const [criterion, score] of Object.entries(rating.scores)) {
      if (!criterionIds.includes(criterion)) throw new Error(`Unknown criterion: ${criterion}`)
      if (!Number.isFinite(score) || score < 1 || score > 5) throw new Error(`Score ${criterion} must be between 1 and 5.`)
    }
    const key = `${rating.caseId}\u0000${rating.artifactId}`
    const group = groups.get(key) ?? []
    group.push(rating)
    groups.set(key, group)
  }

  const cells = []
  let pairCount = 0
  let exactAgreementPairs = 0
  let weightedAgreementSum = 0
  let weightedPairCount = 0
  const alerts = []
  for (const group of groups.values()) {
    const first = group[0]
    for (const criterionId of criterionIds) {
      const observations = group.filter(rating => Number.isFinite(rating.scores[criterionId])).map(rating => ({ reviewerId: rating.reviewerId, score: rating.scores[criterionId] }))
      const scores = observations.map(item => item.score)
      const pairs = []
      for (let i = 0; i < scores.length; i++) for (let j = i + 1; j < scores.length; j++) {
        const difference = Math.abs(scores[i] - scores[j])
        pairCount++
        if (difference === 0) exactAgreementPairs++
        weightedAgreementSum += 1 - difference / 4
        weightedPairCount++
        pairs.push(difference)
      }
      const min = scores.length ? Math.min(...scores) : null
      const max = scores.length ? Math.max(...scores) : null
      const spread = scores.length >= 2 ? max - min : null
      const mean = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null
      const variance = scores.length >= 2 ? scores.reduce((sum, score) => sum + ((score - mean) ** 2), 0) / (scores.length - 1) : null
      const cell = {
        caseId: first.caseId,
        artifactId: first.artifactId,
        criterionId,
        reviewerCount: observations.length,
        missingReviewerCount: group.length - observations.length,
        scores: observations,
        exactAgreementRate: pairs.length ? round(pairs.filter(value => value === 0).length / pairs.length) : null,
        linearlyWeightedAgreement: pairs.length ? round(pairs.reduce((sum, value) => sum + (1 - value / 4), 0) / pairs.length) : null,
        scoreSpread: spread,
        sampleStandardDeviation: variance === null ? null : round(Math.sqrt(variance)),
        needsDiscussion: spread !== null && spread >= disagreementSpreadThreshold,
      }
      if (observations.length < 2) alerts.push({ caseId: first.caseId, artifactId: first.artifactId, criterionId, reason: 'Fewer than two valid ratings; agreement cannot be estimated.' })
      if (cell.needsDiscussion) alerts.push({ caseId: first.caseId, artifactId: first.artifactId, criterionId, reason: `Reviewer score spread (${spread}) meets/exceeds threshold (${disagreementSpreadThreshold}).` })
      if (cell.missingReviewerCount > 0) alerts.push({ caseId: first.caseId, artifactId: first.artifactId, criterionId, reason: `${cell.missingReviewerCount} reviewer(s) did not score this criterion.` })
      cells.push(cell)
    }
  }
  return {
    reportVersion: '1.0.0',
    benchmarkVersion: benchmark.benchmarkVersion ?? 'unknown',
    generatedAt: new Date().toISOString(),
    input: { ratingCount: ratings.length, artifactCount: groups.size, reviewerCount: new Set(ratings.map(item => item.reviewerId)).size },
    overall: {
      pairwiseComparisonCount: pairCount,
      exactAgreementRate: pairCount ? round(exactAgreementPairs / pairCount) : null,
      linearlyWeightedAgreement: weightedPairCount ? round(weightedAgreementSum / weightedPairCount) : null,
      interpretation: pairCount ? 'Descriptive pairwise agreement diagnostics; not a formal Krippendorff alpha or proof of validity.' : 'Insufficient overlapping ratings to estimate pairwise agreement.',
    },
    cells,
    alerts,
    limitations: [
      'Pairwise exact and linear-weighted agreement are descriptive and do not correct for chance agreement.',
      'Small reviewer panels produce unstable agreement estimates.',
      'High agreement does not prove that the criterion measures real audience impact or artistic quality.',
      'Resolve large disagreements through documented human discussion; do not silently replace original scores.',
      'Do not adapt generation policy automatically from this report.',
    ],
  }
}
function main(argv = process.argv.slice(2)) {
  const get = key => { const i = argv.indexOf(key); return i < 0 ? undefined : argv[i + 1] }
  const input = get('--ratings'), output = get('--out'), benchmarkPath = get('--benchmark') || path.resolve(__dirname, '../tests/fixtures/creative-benchmark.json')
  if (!input || !output) {
    console.error('Usage: node scripts/creative-inter-rater-agreement.cjs --ratings finalized-ratings.json --out agreement-report.json [--benchmark benchmark.json] [--spread-threshold 2]')
    return 2
  }
  try {
    const report = analyzeInterRaterAgreement({ ratingsDocument: readJson(input), benchmark: readJson(benchmarkPath), disagreementSpreadThreshold: Number(get('--spread-threshold') || 2) })
    writeJson(output, report)
    process.stdout.write(`Analyzed ${report.input.ratingCount} ratings across ${report.input.artifactCount} artifacts.\n`)
    process.stdout.write(`Exact agreement: ${report.overall.exactAgreementRate ?? 'not estimable'}; weighted agreement: ${report.overall.linearlyWeightedAgreement ?? 'not estimable'}.\n`)
    process.stdout.write(`Report: ${path.resolve(output)}\n`)
    return 0
  } catch (error) {
    console.error(`Inter-rater agreement analysis failed: ${error instanceof Error ? error.message : String(error)}`)
    return 2
  }
}
if (require.main === module) process.exitCode = main()
module.exports = { analyzeInterRaterAgreement }
