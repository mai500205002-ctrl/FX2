#!/usr/bin/env node
'use strict'
const fs = require('node:fs')
const path = require('node:path')
const { aggregateArtifactRatings, analyzeCandidateDiversity, compareQualityVersions } = require('../dist/modules/creative-quality-lab.js')

function arg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
function usage() {
  console.error('Usage: node scripts/score-creative-benchmark.cjs (--candidate-runs <runs.json> | --ratings <ratings.json> --baseline <version> --candidate <version>) [--out <report.json>]')
  console.error('Ratings JSON must be an array of blind human ratings or an object with a ratings array. Scores use the benchmark criteria on a 1–5 scale.')
}
const ratingsPath = arg('--ratings')
const baseline = arg('--baseline')
const candidate = arg('--candidate')
const candidateRunsPath = arg('--candidate-runs')
const hasRatingsArgs = Boolean(ratingsPath || baseline || candidate)
const hasCompleteRatingsArgs = Boolean(ratingsPath && baseline && candidate)
if ((!candidateRunsPath && !hasCompleteRatingsArgs) || (hasRatingsArgs && !hasCompleteRatingsArgs)) { usage(); process.exit(2) }
try {
  const benchmarkPath = path.resolve(__dirname, '../tests/fixtures/creative-benchmark.json')
  const benchmark = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'))
  let summaries = null
  let comparison = null
  if (hasCompleteRatingsArgs) {
    const input = JSON.parse(fs.readFileSync(path.resolve(ratingsPath), 'utf8'))
    const ratings = Array.isArray(input) ? input : input.ratings
    summaries = aggregateArtifactRatings({ benchmark, ratings })
    comparison = compareQualityVersions(summaries, baseline, candidate)
  }
  let candidateDiversity = null
  if (candidateRunsPath) {
    const candidateRuns = JSON.parse(fs.readFileSync(path.resolve(candidateRunsPath), 'utf8'))
    const benchmarkCaseIds = new Set(benchmark.cases.map(item => item.id))
    if (!Array.isArray(candidateRuns) || candidateRuns.some(run => !benchmarkCaseIds.has(run?.caseId))) throw new Error('Candidate runs must use case IDs from the fixed creative benchmark.')
    candidateDiversity = analyzeCandidateDiversity(candidateRuns)
  }
  const report = {
    reportVersion: '1.1.0', generatedAt: new Date().toISOString(), benchmarkVersion: benchmark.benchmarkVersion,
    summaries, comparison, candidateDiversity,
    guardrail: 'Human ratings and synthetic/test candidate inputs are separate evidence classes. Lexical candidate diagnostics do not establish quality or audience impact. No automatic generation policy changes are permitted from this report.',
  }
  const output = JSON.stringify(report, null, 2)
  const outPath = arg('--out')
  if (outPath) fs.writeFileSync(path.resolve(outPath), `${output}\n`, { encoding: 'utf8', mode: 0o600 })
  else process.stdout.write(`${output}\n`)
  if (comparison && !comparison.pairedCaseCount) process.exitCode = 1
} catch (error) {
  console.error(`Quality Lab failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
}
