'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { verifyLedger, recordDecision } = require('../scripts/creative-trial-governance.cjs')
function dossier(overrides = {}) {
  return {
    experimentId: 'exp-1', benchmarkVersion: '1.0.0', versions: { baseline: 'v1', candidate: 'v2' },
    recommendation: 'eligible_for_human_review_of_a_controlled_trial',
    gateSummary: { allPassed: true, passed: 6, total: 6 },
    gates: [{ id: 'integrity_verified', passed: true, observed: 'verified' }],
    policy: { automaticPolicyChange: false, humanApprovalRequired: true }, ...overrides,
  }
}
const common = { approver: 'creative-review-board', rationale: 'Evidence reviewed; approve a bounded controlled trial with explicit rollback triggers.' }

test('approval requires passed gates, bounded trial window, and rollback criteria', () => {
  const result = recordDecision({ dossier: dossier(), decision: 'approve', ...common, trialWindow: '20 runs maximum', rollbackCriteria: ['Mean paired score falls by 0.5 or more', 'Any integrity check fails'] })
  assert.equal(result.entry.automaticPolicyChange, false)
  assert.equal(result.entry.sequence, 1)
  assert.equal(verifyLedger(result.ledger).valid, true)
})

test('failed evidence gates block approval but can be recorded as defer', () => {
  const weak = dossier({ recommendation: 'insufficient_evidence', gateSummary: { allPassed: false, passed: 4, total: 6 } })
  assert.throws(() => recordDecision({ dossier: weak, decision: 'approve', ...common, trialWindow: '10 runs', rollbackCriteria: ['Score drops by 0.5', 'Any integrity failure'] }), /Cannot approve/)
  const deferred = recordDecision({ dossier: weak, decision: 'defer', ...common })
  assert.equal(deferred.entry.decision, 'defer')
})

test('rejects missing rationale, invalid rollback criteria, and automatic-change dossier', () => {
  assert.throws(() => recordDecision({ dossier: dossier(), decision: 'reject', approver: 'reviewer', rationale: 'short' }), /at least 12/)
  assert.throws(() => recordDecision({ dossier: dossier(), decision: 'approve', ...common, trialWindow: '20 runs', rollbackCriteria: ['tiny', 'Another valid rollback criterion'] }), /descriptive/)
  assert.throws(() => recordDecision({ dossier: dossier({ policy: { automaticPolicyChange: true, humanApprovalRequired: false } }), decision: 'approve', ...common, trialWindow: '20 runs', rollbackCriteria: ['Score drops by 0.5', 'Integrity fails'] }), /safety boundary/)
})

test('ledger detects altered records and chain links', () => {
  const first = recordDecision({ dossier: dossier(), decision: 'defer', ...common })
  const second = recordDecision({ dossier: dossier(), decision: 'reject', ...common, ledger: first.ledger })
  assert.equal(verifyLedger(second.ledger).entryCount, 2)
  const tampered = structuredClone(second.ledger)
  tampered.entries[0].rationale = 'modified after signing'
  assert.throws(() => verifyLedger(tampered), /record hash mismatch/)
  const brokenChain = structuredClone(second.ledger)
  brokenChain.entries[1].previousHash = 'broken'
  assert.throws(() => verifyLedger(brokenChain), /chain mismatch/)
})

test('ledger appends decisions without changing previous records', () => {
  const first = recordDecision({ dossier: dossier(), decision: 'defer', ...common })
  const snapshot = JSON.stringify(first.ledger.entries[0])
  const second = recordDecision({ dossier: dossier(), decision: 'approve', ...common, trialWindow: '20 runs maximum', rollbackCriteria: ['Mean paired score drops by 0.5', 'Any integrity check fails'], ledger: first.ledger })
  assert.equal(JSON.stringify(second.ledger.entries[0]), snapshot)
  assert.equal(second.ledger.entries[1].previousHash, first.ledger.entries[0].recordHash)
})
