#!/usr/bin/env node
'use strict'
const fs = require('node:fs')
const path = require('node:path')
const { aggregateArtifactRatings, compareQualityVersions } = require('../dist/modules/creative-quality-lab.js')

function arg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
function usage() {
  console.error('Usage: node scripts/score-creative-benchmark.cjs --ratings <ratings.json> --baseline <version> --candidate <version> [--out <report.json>]')
  console.error('Ratings JSON must be an array of blind human ratings or an object with a ratings array. Scores use the benchmark criteria on a 1–5 scale.')
}
const ratingsPath = arg('--ratings')
const baseline = arg('--baseline')
const candidate = arg('--candidate')
if (!ratingsPath || !baseline || !candidate) { usage(); process.exit(2) }
try {
  const benchmarkPath = path.resolve(__dirname, '../tests/fixtures/creative-benchmark.json')
  const benchmark = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'))
  const input = JSON.parse(fs.readFileSync(path.resolve(ratingsPath), 'utf8'))
  const ratings = Array.isArray(input) ? input : input.ratings
  const summaries = aggregateArtifactRatings({ benchmark, ratings })
  const comparison = compareQualityVersions(summaries, baseline, candidate)
  const report = {
    reportVersion: '1.0.0', generatedAt: new Date().toISOString(), benchmarkVersion: benchmark.benchmarkVersion,
    summaries, comparison,
    guardrail: 'Descriptive human-scored evidence only. No automatic generation policy changes are permitted from this report.',
  }
  const output = JSON.stringify(report, null, 2)
  const outPath = arg('--out')
  if (outPath) fs.writeFileSync(path.resolve(outPath), `${output}\n`, { encoding: 'utf8', mode: 0o600 })
  else process.stdout.write(`${output}\n`)
  if (!comparison.pairedCaseCount) process.exitCode = 1
} catch (error) {
  console.error(`Quality Lab failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
}
