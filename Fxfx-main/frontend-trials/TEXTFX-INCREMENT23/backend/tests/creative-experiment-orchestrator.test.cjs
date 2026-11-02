'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const benchmark = require('./fixtures/creative-benchmark.json')
const { prepareExperiment, finalizeRatings, validateArtifactInput, verifyExperimentIntegrity } = require('../scripts/creative-experiment-orchestrator.cjs')

const artifacts = [
  { caseId: 'human-tension-01', engineVersion: 'v1.0', artifact: 'A small, quiet film about practicing in private.' },
  { caseId: 'human-tension-01', engineVersion: 'v1.1', artifact: 'A different concept using a public lost-and-found for unfinished attempts.' },
  { caseId: 'category-reversal-02', engineVersion: 'v1.0', artifact: 'A commuter bottle concept for the morning train.' },
  { caseId: 'category-reversal-02', engineVersion: 'v1.1', artifact: 'A repairable bottle framed as a pocket-sized refill station.' },
]

test('prepare creates blind randomized packet and separate version mapping', () => {
  const result = prepareExperiment({ artifacts, benchmark, experimentId: 'test-exp', random: () => 0, now: () => '2026-01-01T00:00:00.000Z' })
  assert.equal(result.packet.artifacts.length, 4)
  assert.deepEqual(result.mapping.engineVersions, ['v1.0', 'v1.1'])
  assert.equal(JSON.stringify(result.packet).includes('engineVersion'), false)
  assert.equal(JSON.stringify(result.packet).includes('v1.0'), false)
  assert.equal(JSON.stringify(result.packet).includes('v1.1'), false)
  assert.ok(result.packet.artifacts.every(item => item.artifactId.startsWith('blind-') && item.contentHash.length === 64))
  assert.equal(result.packet.experimentId, result.mapping.experimentId)
})

test('prepare rejects duplicate case/version artifacts and one-version experiments', () => {
  assert.throws(() => validateArtifactInput([artifacts[0], artifacts[0]], benchmark), /Duplicate artifact/)
  assert.throws(() => validateArtifactInput([artifacts[0]], benchmark), /at least two engine versions/)
  assert.throws(() => validateArtifactInput([artifacts[0], artifacts[1], artifacts[2]], benchmark), /Unpaired benchmark coverage/)
  assert.throws(() => prepareExperiment({ artifacts: [{ ...artifacts[0], caseId: 'not-a-case' }, artifacts[1]], benchmark }), /Unknown benchmark case/)
})

test('finalize applies hidden version mapping only after blind ratings and records audit', () => {
  const prepared = prepareExperiment({ artifacts, benchmark, experimentId: 'test-exp' })
  const chosen = prepared.packet.artifacts[0]
  const result = finalizeRatings({
    mapping: prepared.mapping,
    ratings: [{ reviewerId: 'reviewer-a', artifactId: chosen.artifactId, caseId: chosen.caseId, scores: { originality: 4 } }],
  })
  assert.equal(result.ratings[0].engineVersion, prepared.mapping.artifacts.find(item => item.artifactId === chosen.artifactId).engineVersion)
  assert.equal(result.audit.versionMappingAppliedAfterBlindScoring, true)
  assert.equal(result.audit.ratingCount, 1)
})

test('finalize rejects unknown IDs, duplicate reviewer submissions, and premature version labels', () => {
  const prepared = prepareExperiment({ artifacts, benchmark })
  const chosen = prepared.packet.artifacts[0]
  const rating = { reviewerId: 'reviewer-a', artifactId: chosen.artifactId, scores: { originality: 4 } }
  assert.throws(() => finalizeRatings({ mapping: prepared.mapping, ratings: [{ ...rating, artifactId: 'unknown' }] }), /unknown artifactId/)
  assert.throws(() => finalizeRatings({ mapping: prepared.mapping, ratings: [rating, rating] }), /Duplicate rating/)
  assert.throws(() => finalizeRatings({ mapping: prepared.mapping, ratings: [{ ...rating, engineVersion: 'v1.0' }] }), /must not include engineVersion/)
  assert.throws(() => finalizeRatings({ mapping: prepared.mapping, ratings: [{ ...rating, caseId: 'wrong-case' }] }), /caseId does not match/)
})


test('experiment manifest verifies packet, private mapping, and artifact content hashes', () => {
  const prepared = prepareExperiment({ artifacts, benchmark, experimentId: 'integrity-exp' })
  const result = verifyExperimentIntegrity({ packet: prepared.packet, mapping: prepared.mapping, manifest: prepared.manifest })
  assert.equal(result.valid, true)
  assert.equal(result.artifactCount, artifacts.length)
  const tamperedPacket = structuredClone(prepared.packet)
  tamperedPacket.artifacts[0].artifact += ' tampered'
  assert.throws(() => verifyExperimentIntegrity({ packet: tamperedPacket, mapping: prepared.mapping, manifest: prepared.manifest }), /packet hash mismatch/)
})

test('experiment manifest does not reveal engine version labels', () => {
  const prepared = prepareExperiment({ artifacts, benchmark, experimentId: 'blind-manifest-exp' })
  const serialized = JSON.stringify(prepared.manifest)
  assert.equal(serialized.includes('v1.0'), false)
  assert.equal(serialized.includes('v1.1'), false)
  assert.equal(prepared.manifest.hashes.scoringProtocol.length, 64)
})


test('provenance is kept out of blind packet and retained privately for final audit', () => {
  const provenance = { modelProvider: 'provider-x', modelId: 'model-y', promptTemplateHash: 'a'.repeat(64), generationConfigHash: 'b'.repeat(64), temperature: 0.7, topP: 0.9, seed: 42 }
  const withProvenance = artifacts.map(item => ({ ...item, provenance }))
  const prepared = prepareExperiment({ artifacts: withProvenance, benchmark, experimentId: 'provenance-exp' })
  assert.equal(JSON.stringify(prepared.packet).includes('model-y'), false)
  assert.equal(JSON.stringify(prepared.packet).includes('generationConfigHash'), false)
  assert.equal(prepared.mapping.artifacts[0].provenance.modelId, 'model-y')
  assert.equal(prepared.manifest.provenance.artifactCountWithModelId, artifacts.length)
  assert.equal(JSON.stringify(prepared.manifest).includes('model-y'), false)
  assert.equal(verifyExperimentIntegrity({ packet: prepared.packet, mapping: prepared.mapping, manifest: prepared.manifest, benchmark }).valid, true)
  const target = prepared.mapping.artifacts[0]
  const result = finalizeRatings({ mapping: prepared.mapping, ratings: [{ reviewerId: 'reviewer-a', artifactId: target.artifactId, scores: { originality: 4 } }] })
  assert.equal(result.ratings[0].provenance.modelId, 'model-y')
  assert.equal(result.ratings[0].provenanceHash, target.provenanceHash)
})

test('provenance input rejects unsupported secret-like fields and invalid hashes', () => {
  assert.throws(() => prepareExperiment({ artifacts: artifacts.map(item => ({ ...item, provenance: { apiKey: 'secret' } })), benchmark }), /Unsupported provenance field/)
  assert.throws(() => prepareExperiment({ artifacts: artifacts.map(item => ({ ...item, provenance: { promptTemplateHash: 'not-a-hash' } })), benchmark }), /64-character SHA-256/)
})
