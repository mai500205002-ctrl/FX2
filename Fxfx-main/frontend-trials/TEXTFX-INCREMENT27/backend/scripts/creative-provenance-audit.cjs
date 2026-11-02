#!/usr/bin/env node
'use strict'
const fs = require('node:fs')
const path = require('node:path')
const FIELDS = ['modelProvider', 'modelId', 'promptTemplateHash', 'generationConfigHash', 'temperature', 'topP', 'sourceRevision']
function readJson(file) { return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) }
function writeJson(file, value) {
  const target = path.resolve(file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  try { fs.chmodSync(target, 0o600) } catch { /* Windows may not support POSIX permissions. */ }
}
function auditProvenance({ ratingsDocument, baselineVersion, candidateVersion }) {
  const ratings = Array.isArray(ratingsDocument) ? ratingsDocument : ratingsDocument?.ratings
  if (!Array.isArray(ratings) || ratings.length === 0) throw new Error('A non-empty finalized ratings array is required.')
  if (typeof baselineVersion !== 'string' || !baselineVersion.trim() || typeof candidateVersion !== 'string' || !candidateVersion.trim() || baselineVersion === candidateVersion) throw new Error('Two distinct baseline and candidate versions are required.')
  const artifacts = new Map()
  for (const [index, rating] of ratings.entries()) {
    if (!rating || typeof rating.artifactId !== 'string' || typeof rating.engineVersion !== 'string') throw new Error(`Rating ${index + 1} needs artifactId and engineVersion.`)
    const provenance = rating.provenance && typeof rating.provenance === 'object' && !Array.isArray(rating.provenance) ? rating.provenance : {}
    const current = artifacts.get(rating.artifactId)
    const normalized = JSON.stringify(Object.fromEntries(FIELDS.filter(field => provenance[field] !== undefined).map(field => [field, provenance[field]]).sort(([a], [b]) => a.localeCompare(b))))
    if (current && (current.engineVersion !== rating.engineVersion || current.provenanceJson !== normalized)) throw new Error(`Conflicting provenance for artifact ${rating.artifactId}.`)
    if (!current) artifacts.set(rating.artifactId, { artifactId: rating.artifactId, engineVersion: rating.engineVersion, provenance, provenanceJson: normalized })
  }
  const versions = [...new Set([...artifacts.values()].map(item => item.engineVersion))]
  if (!versions.includes(baselineVersion) || !versions.includes(candidateVersion)) throw new Error('Both requested versions must exist in finalized ratings.')
  function profile(version) {
    const items = [...artifacts.values()].filter(item => item.engineVersion === version)
    const fields = {}
    for (const field of FIELDS) {
      const values = [...new Set(items.map(item => item.provenance[field]).filter(value => value !== undefined).map(value => JSON.stringify(value)))].sort()
      fields[field] = { distinctValues: values.map(value => JSON.parse(value)), missingArtifactCount: items.filter(item => item.provenance[field] === undefined).length, stableWithinVersion: values.length <= 1 }
    }
    return { engineVersion: version, artifactCount: items.length, artifactsWithAnyProvenance: items.filter(item => Object.keys(item.provenance).length > 0).length, fields }
  }
  const baseline = profile(baselineVersion), candidate = profile(candidateVersion)
  const fieldComparison = {}
  for (const field of FIELDS) {
    const a = baseline.fields[field].distinctValues
    const b = candidate.fields[field].distinctValues
    const hasMissing = baseline.fields[field].missingArtifactCount > 0 || candidate.fields[field].missingArtifactCount > 0
    const same = JSON.stringify(a) === JSON.stringify(b) && a.length === 1 && b.length === 1 && !hasMissing
    fieldComparison[field] = { status: same ? 'matching' : (a.length === 0 || b.length === 0 || hasMissing) ? 'missing_or_incomplete' : 'different_or_variable', baselineValues: a, candidateValues: b, baselineMissingCount: baseline.fields[field].missingArtifactCount, candidateMissingCount: candidate.fields[field].missingArtifactCount }
  }
  const modelSettings = ['modelProvider', 'modelId', 'generationConfigHash', 'temperature', 'topP']
  const modelSettingsMatch = modelSettings.every(field => fieldComparison[field].status === 'matching')
  const promptTemplateStatus = fieldComparison.promptTemplateHash.status
  let interpretation
  if (!modelSettingsMatch) interpretation = 'Model/runtime provenance is missing, variable, or differs between versions; treat the quality comparison as a bundled-system comparison with configuration confounds.'
  else if (promptTemplateStatus !== 'matching') interpretation = 'Core model/runtime settings match, but prompt-template provenance differs or is incomplete; the comparison cannot isolate prompt changes from other version changes.'
  else interpretation = 'Recorded model/runtime and prompt-template settings match. This improves reproducibility but does not prove causality or audience impact.'
  return {
    reportVersion: '1.0.0', generatedAt: new Date().toISOString(), baselineVersion, candidateVersion,
    input: { ratingCount: ratings.length, distinctArtifactCount: artifacts.size, versions },
    baseline, candidate, fieldComparison,
    modelSettingsMatch, promptTemplateStatus, interpretation,
    warnings: [
      'Provenance is supplied by the generation workflow and is only as trustworthy as that instrumentation.',
      'Missing hashes mean the corresponding prompt/configuration cannot be independently reproduced from this report alone.',
      'Different source revisions are expected when comparing engine releases and are reported as provenance, not automatically treated as a defect.',
      'A provenance match improves comparability but does not establish statistical significance, causality, or creative quality.',
    ],
  }
}
function main(argv = process.argv.slice(2)) {
  const get = name => { const i = argv.indexOf(name); return i < 0 ? undefined : argv[i + 1] }
  const ratings = get('--ratings'), baseline = get('--baseline'), candidate = get('--candidate'), out = get('--out')
  if (!ratings || !baseline || !candidate || !out) {
    console.error('Usage: node scripts/creative-provenance-audit.cjs --ratings finalized-ratings.json --baseline v1 --candidate v2 --out provenance-report.json')
    return 2
  }
  try {
    const report = auditProvenance({ ratingsDocument: readJson(ratings), baselineVersion: baseline, candidateVersion: candidate })
    writeJson(out, report)
    process.stdout.write(`Provenance audit: model settings ${report.modelSettingsMatch ? 'match' : 'differ or are incomplete'}; prompt provenance ${report.promptTemplateStatus}.\n`)
    process.stdout.write(`Report: ${path.resolve(out)}\n`)
    return 0
  } catch (error) {
    console.error(`Creative provenance audit failed: ${error instanceof Error ? error.message : String(error)}`)
    return 2
  }
}
if (require.main === module) process.exitCode = main()
module.exports = { auditProvenance }
