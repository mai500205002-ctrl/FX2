'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { createArtifactApproval, validateArtifactApproval } = require('../dist/agent/approval-integrity.js')

const artifact = { concept: { title: 'A single visible idea' }, script: { beats: ['one', 'two', 'three'] } }
const basis = { artifact, artifactVersion: 2, policyVersion: 'creative-policy-3', evidenceIds: ['evidence-b', 'evidence-a'] }

test('approval binds to exact artifact, version, policy, and order-independent evidence set', () => {
  const approval = createArtifactApproval({ approvedBy: 'operator-1', basis, approvedAt: '2026-10-25T00:00:00.000Z' })
  assert.equal(approval.artifactHash.length, 64)
  assert.equal(approval.evidenceSetHash.length, 64)
  assert.equal(validateArtifactApproval(approval, { ...basis, evidenceIds: ['evidence-a', 'evidence-b'] }).valid, true)
})

test('artifact edits, version changes, policy updates, or evidence changes invalidate approval', () => {
  const approval = createArtifactApproval({ approvedBy: 'operator-1', basis })
  assert.match(validateArtifactApproval(approval, { ...basis, artifact: { ...artifact, script: { beats: ['changed'] } } }).reason, /content changed/)
  assert.match(validateArtifactApproval(approval, { ...basis, artifactVersion: 3 }).reason, /version changed/)
  assert.match(validateArtifactApproval(approval, { ...basis, policyVersion: 'creative-policy-4' }).reason, /policy version changed/)
  assert.match(validateArtifactApproval(approval, { ...basis, evidenceIds: ['evidence-a'] }).reason, /evidence set changed/)
})

test('approval creation rejects missing approver identity and invalid evidence sets', () => {
  assert.throws(() => createArtifactApproval({ approvedBy: ' ', basis }), /approver identity/)
  assert.throws(() => createArtifactApproval({ approvedBy: 'operator-1', basis: { ...basis, evidenceIds: ['e1', 'e1'] } }), /unique/)
})