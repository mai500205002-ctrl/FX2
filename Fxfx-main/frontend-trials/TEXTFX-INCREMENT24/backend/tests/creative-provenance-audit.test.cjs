'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { auditProvenance } = require('../scripts/creative-provenance-audit.cjs')
const sha = 'a'.repeat(64)
function ratingsFor(prov1 = {}, prov2 = {}) {
  return [
    { artifactId: 'a1', engineVersion: 'v1', reviewerId: 'r1', provenance: prov1 },
    { artifactId: 'a1', engineVersion: 'v1', reviewerId: 'r2', provenance: prov1 },
    { artifactId: 'a2', engineVersion: 'v2', reviewerId: 'r1', provenance: prov2 },
    { artifactId: 'a2', engineVersion: 'v2', reviewerId: 'r2', provenance: prov2 },
  ]
}
const common = { modelProvider: 'provider-x', modelId: 'model-y', promptTemplateHash: sha, generationConfigHash: 'b'.repeat(64), temperature: 0.7, topP: 0.9 }

test('reports matching model/runtime and prompt provenance without claiming causality', () => {
  const report = auditProvenance({ ratingsDocument: ratingsFor(common, { ...common, sourceRevision: 'rev2' }), baselineVersion: 'v1', candidateVersion: 'v2' })
  assert.equal(report.modelSettingsMatch, true)
  assert.equal(report.promptTemplateStatus, 'matching')
  assert.match(report.interpretation, /does not prove causality/)
})

test('flags model or generation configuration differences as confounds', () => {
  const report = auditProvenance({ ratingsDocument: ratingsFor(common, { ...common, modelId: 'model-z' }), baselineVersion: 'v1', candidateVersion: 'v2' })
  assert.equal(report.modelSettingsMatch, false)
  assert.equal(report.fieldComparison.modelId.status, 'different_or_variable')
})

test('flags missing provenance instead of assuming settings match', () => {
  const report = auditProvenance({ ratingsDocument: ratingsFor({}, {}), baselineVersion: 'v1', candidateVersion: 'v2' })
  assert.equal(report.modelSettingsMatch, false)
  assert.equal(report.fieldComparison.modelId.status, 'missing_or_incomplete')
})

test('rejects inconsistent provenance across reviewers for one artifact', () => {
  const data = ratingsFor(common, common)
  data[1].provenance = { ...common, temperature: 0.2 }
  assert.throws(() => auditProvenance({ ratingsDocument: data, baselineVersion: 'v1', candidateVersion: 'v2' }), /Conflicting provenance/)
})

test('requires distinct versions present in the finalized ratings', () => {
  assert.throws(() => auditProvenance({ ratingsDocument: ratingsFor(common, common), baselineVersion: 'v1', candidateVersion: 'v3' }), /Both requested versions/)
})
