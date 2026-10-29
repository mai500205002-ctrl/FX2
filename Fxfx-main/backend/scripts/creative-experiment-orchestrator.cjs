#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

function arg(argv, name) {
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : undefined
}
function readJson(file) { return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) }
function writePrivate(file, value) {
  const target = path.resolve(file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  try { fs.chmodSync(target, 0o600) } catch { /* Some filesystems do not implement POSIX modes. */ }
}
function hashArtifact(text) { return crypto.createHash('sha256').update(text, 'utf8').digest('hex') }
function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
  return value
}
function hashValue(value) { return hashArtifact(JSON.stringify(stableValue(value))) }
const PROVENANCE_KEYS = new Set(['modelProvider', 'modelId', 'promptTemplateHash', 'generationConfigHash', 'sourceRevision', 'temperature', 'topP', 'seed'])
function normalizeProvenance(input) {
  if (input === undefined || input === null) return {}
  if (typeof input !== 'object' || Array.isArray(input)) throw new Error('provenance must be an object when provided.')
  const unknown = Object.keys(input).filter(key => !PROVENANCE_KEYS.has(key))
  if (unknown.length) throw new Error(`Unsupported provenance field(s): ${unknown.join(', ')}. Do not store secrets or arbitrary metadata in provenance.`)
  const result = {}
  for (const key of ['modelProvider', 'modelId', 'sourceRevision']) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'string' || !input[key].trim()) throw new Error(`provenance.${key} must be a non-empty string.`)
      result[key] = input[key].trim()
    }
  }
  for (const key of ['promptTemplateHash', 'generationConfigHash']) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'string' || !/^[a-f0-9]{64}$/i.test(input[key])) throw new Error(`provenance.${key} must be a 64-character SHA-256 hex digest.`)
      result[key] = input[key].toLowerCase()
    }
  }
  if (input.temperature !== undefined) {
    if (!Number.isFinite(input.temperature) || input.temperature < 0 || input.temperature > 2) throw new Error('provenance.temperature must be between 0 and 2.')
    result.temperature = input.temperature
  }
  if (input.topP !== undefined) {
    if (!Number.isFinite(input.topP) || input.topP < 0 || input.topP > 1) throw new Error('provenance.topP must be between 0 and 1.')
    result.topP = input.topP
  }
  if (input.seed !== undefined) {
    if (!((typeof input.seed === 'string' && input.seed.trim()) || (Number.isSafeInteger(input.seed) && input.seed >= 0))) throw new Error('provenance.seed must be a non-negative safe integer or non-empty string.')
    result.seed = input.seed
  }
  return result
}
function shuffle(items, random = Math.random) {
  const output = [...items]
  for (let i = output.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[output[i], output[j]] = [output[j], output[i]]
  }
  return output
}
function validateArtifactInput(input, benchmark) {
  if (!Array.isArray(input) || input.length === 0) throw new Error('Artifacts input must be a non-empty array.')
  const caseById = new Map(benchmark.cases.map(item => [item.id, item]))
  const seenPairs = new Set()
  const seenVersions = new Set()
  const casesByVersion = new Map()
  for (const item of input) {
    if (!item || typeof item !== 'object') throw new Error('Every artifact entry must be an object.')
    if (!caseById.has(item.caseId)) throw new Error(`Unknown benchmark case: ${item.caseId}`)
    if (typeof item.engineVersion !== 'string' || !item.engineVersion.trim()) throw new Error('Every artifact needs engineVersion.')
    const content = typeof item.artifact === 'string' ? item.artifact : item.text
    if (typeof content !== 'string' || !content.trim()) throw new Error(`Artifact for ${item.caseId} / ${item.engineVersion} must include non-empty artifact text.`)
    normalizeProvenance(item.provenance)
    const pair = `${item.caseId}\u0000${item.engineVersion}`
    if (seenPairs.has(pair)) throw new Error(`Duplicate artifact for case ${item.caseId} and version ${item.engineVersion}.`)
    seenPairs.add(pair)
    seenVersions.add(item.engineVersion)
    const versionCases = casesByVersion.get(item.engineVersion) ?? new Set()
    versionCases.add(item.caseId)
    casesByVersion.set(item.engineVersion, versionCases)
  }
  if (seenVersions.size < 2) throw new Error('A controlled version comparison requires at least two engine versions.')
  const versionEntries = [...casesByVersion.entries()]
  const referenceCases = [...versionEntries[0][1]].sort().join('\u0000')
  for (const [version, caseSet] of versionEntries.slice(1)) {
    if ([...caseSet].sort().join('\u0000') !== referenceCases) {
      throw new Error(`Unpaired benchmark coverage: version ${version} must include exactly the same case IDs as every other version.`)
    }
  }
  return { caseById, versions: [...seenVersions].sort() }
}
function prepareExperiment({ artifacts, benchmark, experimentId, random = Math.random, now = () => new Date().toISOString() }) {
  if (!benchmark || !Array.isArray(benchmark.cases) || !benchmark.scoringProtocol?.criteria?.length) throw new Error('Benchmark must define cases and scoring criteria.')
  const { caseById, versions } = validateArtifactInput(artifacts, benchmark)
  const id = experimentId || `creative-exp-${crypto.randomUUID()}`
  const publicItems = []
  const privateItems = []
  for (const item of artifacts) {
    const artifact = typeof item.artifact === 'string' ? item.artifact : item.text
    const artifactId = `blind-${crypto.randomUUID()}`
    const benchmarkCase = caseById.get(item.caseId)
    const contentHash = hashArtifact(artifact)
    const provenance = normalizeProvenance(item.provenance)
    const provenanceHash = hashValue(provenance)
    publicItems.push({
      artifactId,
      caseId: item.caseId,
      goal: benchmarkCase.goal,
      brief: benchmarkCase.brief,
      artifact,
      contentHash,
      scoring: { scale: '1-5', criteria: benchmark.scoringProtocol.criteria.map(({ id: criterionId, weight }) => ({ id: criterionId, weight })) },
    })
    privateItems.push({ artifactId, caseId: item.caseId, engineVersion: item.engineVersion, contentHash, provenance, provenanceHash })
  }
  const randomized = shuffle(publicItems, random)
  const packet = {
      packetVersion: '1.0.0',
      experimentId: id,
      benchmarkVersion: benchmark.benchmarkVersion,
      createdAt: now(),
      instructions: 'Blind scoring packet. Do not infer or discuss engine versions. Score each artifact independently on every criterion from 1 to 5. Keep artifactId unchanged. Submit ratings as { reviewerId, artifactId, scores }. Do not add version labels.',
      reviewerCountTarget: benchmark.scoringProtocol.reviewersPerArtifact || 3,
      criteria: benchmark.scoringProtocol.criteria.map(({ id: criterionId, weight }) => ({ id: criterionId, weight })),
      artifacts: randomized,
    }
  const mapping = {
      mappingVersion: '1.0.0',
      experimentId: id,
      benchmarkVersion: benchmark.benchmarkVersion,
      createdAt: now(),
      engineVersions: versions,
      warning: 'Confidential: keep this mapping hidden until all blind ratings are finalized.',
      artifacts: privateItems,
    }
  const manifest = {
    manifestVersion: '1.0.0',
    experimentId: id,
    benchmarkVersion: benchmark.benchmarkVersion,
    createdAt: now(),
    runtime: { node: process.version, platform: process.platform },
    hashes: {
      benchmark: hashValue(benchmark),
      scoringProtocol: hashValue(benchmark.scoringProtocol),
      blindPacket: hashValue(packet),
      privateMapping: hashValue(mapping),
    },
    artifactCount: packet.artifacts.length,
    reviewerCountTarget: packet.reviewerCountTarget,
    criteria: packet.criteria,
    artifacts: packet.artifacts.map(item => ({ artifactId: item.artifactId, caseId: item.caseId, contentHash: item.contentHash })),
    provenance: {
      artifactCountWithModelId: privateItems.filter(item => item.provenance.modelId).length,
      artifactCountWithPromptTemplateHash: privateItems.filter(item => item.provenance.promptTemplateHash).length,
      artifactCountWithGenerationConfigHash: privateItems.filter(item => item.provenance.generationConfigHash).length,
      hashes: privateItems.map(item => ({ artifactId: item.artifactId, provenanceHash: item.provenanceHash })),
    },
    integrityPolicy: 'Any content or mapping change after preparation invalidates this manifest. Keep the private mapping confidential until blind ratings are finalized.',
  }
  return { packet, mapping, manifest }
}
function verifyExperimentIntegrity({ packet, mapping, manifest, benchmark }) {
  if (!packet || !mapping || !manifest) throw new Error('Packet, private mapping, and manifest are all required for integrity verification.')
  if (packet.experimentId !== manifest.experimentId || mapping.experimentId !== manifest.experimentId) throw new Error('Experiment ID mismatch between packet, mapping, and manifest.')
  if (hashValue(packet) !== manifest.hashes?.blindPacket) throw new Error('Blind packet hash mismatch; packet changed after preparation.')
  if (hashValue(mapping) !== manifest.hashes?.privateMapping) throw new Error('Private mapping hash mismatch; mapping changed after preparation.')
  if (benchmark && hashValue(benchmark) !== manifest.hashes?.benchmark) throw new Error('Benchmark hash mismatch; benchmark changed after preparation.')
  if (benchmark && hashValue(benchmark.scoringProtocol) !== manifest.hashes?.scoringProtocol) throw new Error('Scoring protocol hash mismatch; protocol changed after preparation.')
  const packetItems = new Map((packet.artifacts || []).map(item => [item.artifactId, item]))
  const mapItems = new Map((mapping.artifacts || []).map(item => [item.artifactId, item]))
  const manifestItems = new Map((manifest.artifacts || []).map(item => [item.artifactId, item]))
  if (packetItems.size !== manifest.artifactCount || mapItems.size !== manifest.artifactCount || manifestItems.size !== manifest.artifactCount) throw new Error('Artifact count mismatch across experiment files.')
  for (const [artifactId, item] of packetItems) {
    const privateItem = mapItems.get(artifactId)
    const manifestItem = manifestItems.get(artifactId)
    const manifestProvenance = new Map((manifest.provenance?.hashes || []).map(value => [value.artifactId, value.provenanceHash])).get(artifactId)
    if (!privateItem || !manifestItem || item.contentHash !== hashArtifact(item.artifact) || item.contentHash !== privateItem.contentHash || item.contentHash !== manifestItem.contentHash) throw new Error(`Artifact integrity mismatch: ${artifactId}`)
    if (item.caseId !== privateItem.caseId || item.caseId !== manifestItem.caseId) throw new Error(`Artifact case mismatch: ${artifactId}`)
    if (privateItem.provenanceHash !== hashValue(privateItem.provenance || {}) || privateItem.provenanceHash !== manifestProvenance) throw new Error(`Provenance integrity mismatch: ${artifactId}`)
  }
  return { valid: true, experimentId: manifest.experimentId, artifactCount: manifest.artifactCount, hashesVerified: ['blindPacket', 'privateMapping', 'artifactContent'] }
}
function finalizeRatings({ ratings, mapping, integrityVerification = null }) {
  if (!mapping || !Array.isArray(mapping.artifacts)) throw new Error('Invalid private mapping file.')
  if (!Array.isArray(ratings) || ratings.length === 0) throw new Error('Ratings input must be a non-empty array.')
  const byId = new Map(mapping.artifacts.map(item => [item.artifactId, item]))
  const seen = new Set()
  const finalized = ratings.map((rating, index) => {
    if (!rating || typeof rating !== 'object') throw new Error(`Rating ${index + 1} must be an object.`)
    if (typeof rating.reviewerId !== 'string' || !rating.reviewerId.trim()) throw new Error(`Rating ${index + 1} needs reviewerId.`)
    if (typeof rating.artifactId !== 'string' || !byId.has(rating.artifactId)) throw new Error(`Rating ${index + 1} references an unknown artifactId.`)
    if (!rating.scores || typeof rating.scores !== 'object' || Array.isArray(rating.scores)) throw new Error(`Rating ${index + 1} needs a scores object.`)
    const artifact = byId.get(rating.artifactId)
    if (rating.caseId && rating.caseId !== artifact.caseId) throw new Error(`Rating ${index + 1} caseId does not match the blind mapping.`)
    if (rating.engineVersion) throw new Error('Blind ratings must not include engineVersion before finalization.')
    const duplicateKey = `${rating.artifactId}\u0000${rating.reviewerId}`
    if (seen.has(duplicateKey)) throw new Error(`Duplicate rating by reviewer ${rating.reviewerId} for artifact ${rating.artifactId}.`)
    seen.add(duplicateKey)
    return { caseId: artifact.caseId, artifactId: artifact.artifactId, engineVersion: artifact.engineVersion, reviewerId: rating.reviewerId, scores: rating.scores, provenance: artifact.provenance || {}, provenanceHash: artifact.provenanceHash || hashValue({}) }
  })
  return {
    ratingsVersion: '1.0.0',
    experimentId: mapping.experimentId,
    benchmarkVersion: mapping.benchmarkVersion,
    finalizedAt: new Date().toISOString(),
    ratings: finalized,
    audit: {
      ratingCount: finalized.length,
      distinctArtifactCount: new Set(finalized.map(item => item.artifactId)).size,
      distinctReviewerCount: new Set(finalized.map(item => item.reviewerId)).size,
      versionMappingAppliedAfterBlindScoring: true,
      integrityVerification: integrityVerification ? { valid: integrityVerification.valid === true, artifactCount: integrityVerification.artifactCount, hashesVerified: integrityVerification.hashesVerified } : null,
      note: 'This file is now unblinded and should not be sent back to reviewers as a blind packet.',
    },
  }
}
function usage() {
  console.error('Prepare: node scripts/creative-experiment-orchestrator.cjs prepare --artifacts artifacts.json --packet-out blind-packet.json --mapping-out private-mapping.json [--manifest-out manifest.json] [--experiment-id ID]')
  console.error('Finalize: node scripts/creative-experiment-orchestrator.cjs finalize --ratings blind-ratings.json --mapping private-mapping.json --out finalized-ratings.json [--packet blind-packet.json --manifest manifest.json [--benchmark benchmark.json]]')
}
function main(argv = process.argv.slice(2)) {
  const mode = argv[0]
  try {
    if (mode === 'prepare') {
      const artifactsPath = arg(argv, '--artifacts')
      const packetOut = arg(argv, '--packet-out')
      const mappingOut = arg(argv, '--mapping-out')
      const manifestOut = arg(argv, '--manifest-out') || `${packetOut || 'blind-packet.json'}.manifest.json`
      if (!artifactsPath || !packetOut || !mappingOut) { usage(); return 2 }
      const outputPaths = [packetOut, mappingOut, manifestOut].map(value => path.resolve(value))
      if (new Set(outputPaths).size !== outputPaths.length) throw new Error('Packet, private mapping, and manifest must use different output paths.')
      const benchmark = readJson(path.resolve(__dirname, '../tests/fixtures/creative-benchmark.json'))
      const result = prepareExperiment({ artifacts: readJson(artifactsPath), benchmark, experimentId: arg(argv, '--experiment-id') })
      writePrivate(packetOut, result.packet)
      writePrivate(mappingOut, result.mapping)
      writePrivate(manifestOut, result.manifest)
      process.stdout.write(`Prepared ${result.packet.artifacts.length} blind artifacts for ${result.packet.experimentId}.\n`)
      process.stdout.write(`Blind packet: ${path.resolve(packetOut)}\nPrivate mapping (keep confidential): ${path.resolve(mappingOut)}\nIntegrity manifest: ${path.resolve(manifestOut)}\n`)
      return 0
    }
    if (mode === 'finalize') {
      const ratingsPath = arg(argv, '--ratings')
      const mappingPath = arg(argv, '--mapping')
      const outputPath = arg(argv, '--out')
      const packetPath = arg(argv, '--packet')
      const manifestPath = arg(argv, '--manifest')
      const benchmarkPath = arg(argv, '--benchmark') || path.resolve(__dirname, '../tests/fixtures/creative-benchmark.json')
      if (!ratingsPath || !mappingPath || !outputPath) { usage(); return 2 }
      if (Boolean(packetPath) !== Boolean(manifestPath)) throw new Error('Pass both --packet and --manifest to verify experiment integrity, or neither for legacy files.')
      const mapping = readJson(mappingPath)
      let integrity = null
      if (packetPath && manifestPath) {
        integrity = verifyExperimentIntegrity({ packet: readJson(packetPath), mapping, manifest: readJson(manifestPath), benchmark: readJson(benchmarkPath) })
        process.stdout.write(`Integrity verified for ${integrity.experimentId} (${integrity.artifactCount} artifacts).\n`)
      }
      const result = finalizeRatings({ ratings: readJson(ratingsPath), mapping, integrityVerification: integrity })
      writePrivate(outputPath, result)
      process.stdout.write(`Finalized ${result.audit.ratingCount} ratings; version labels were applied after blind scoring.\n`)
      process.stdout.write(`Output: ${path.resolve(outputPath)}\n`)
      return 0
    }
    usage()
    return 2
  } catch (error) {
    console.error(`Creative Experiment Orchestrator failed: ${error instanceof Error ? error.message : String(error)}`)
    return 2
  }
}
if (require.main === module) process.exitCode = main()
module.exports = { prepareExperiment, finalizeRatings, validateArtifactInput, verifyExperimentIntegrity, normalizeProvenance, hashValue, shuffle }
