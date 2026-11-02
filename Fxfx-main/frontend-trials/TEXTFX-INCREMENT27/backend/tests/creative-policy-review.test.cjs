'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { evaluatePolicyEvidence } = require('../scripts/creative-policy-review.cjs')

function fixtures(overrides = {}) {
  const qualityReport = {
    benchmarkVersion: '1.0.0',
    summaries: Array.from({ length: 10 }, (_, i) => ({ caseId: `c${i}`, artifactId: `a${i}`, complete: true, weightedScore: 4, reviewerCount: 3 })),
    comparison: { baselineVersion: 'v1', candidateVersion: 'v2', pairedCaseCount: 5, meanDelta: 0.4, medianDelta: 0.2, wins: 3, losses: 1, ties: 1 },
  }
  const agreementReport = { overall: { linearlyWeightedAgreement: 0.8, exactAgreementRate: 0.6 }, alerts: [] }
  const finalizedRatings = { experimentId: 'exp-1', benchmarkVersion: '1.0.0', ratings: Array.from({ length: 30 }, (_, i) => ({ reviewerId: `r${i % 3}`, artifactId: `a${Math.floor(i / 3)}` })), audit: { integrityVerification: { valid: true, artifactCount: 10, hashesVerified: ['blindPacket', 'privateMapping', 'benchmark', 'artifactContent'] } } }
  return { qualityReport, agreementReport, finalizedRatings, ...overrides }
}

test('all evidence gates passed only makes dossier eligible for human review', () => {
  const report = evaluatePolicyEvidence(fixtures())
  assert.equal(report.gateSummary.allPassed, true)
  assert.equal(report.recommendation, 'eligible_for_human_review_of_a_controlled_trial')
  assert.equal(report.policy.automaticPolicyChange, false)
  assert.equal(report.policy.humanApprovalRequired, true)
})

test('missing integrity verification blocks policy review eligibility', () => {
  const input = fixtures()
  input.finalizedRatings.audit.integrityVerification = null
  const report = evaluatePolicyEvidence(input)
  assert.equal(report.gates.find(g => g.id === 'integrity_verified').passed, false)
  assert.equal(report.recommendation, 'insufficient_evidence')
})

test('insufficient paired cases and low reviewer agreement fail the gates', () => {
  const input = fixtures()
  input.qualityReport.comparison.pairedCaseCount = 2
  input.agreementReport.overall.linearlyWeightedAgreement = 0.3
  const report = evaluatePolicyEvidence(input)
  assert.equal(report.gates.find(g => g.id === 'paired_case_coverage').passed, false)
  assert.equal(report.gates.find(g => g.id === 'reviewer_agreement').passed, false)
})

test('disagreement alerts remain visible and can block eligibility', () => {
  const input = fixtures()
  input.agreementReport.alerts = Array.from({ length: 6 }, (_, i) => ({ reason: `alert-${i}` }))
  const report = evaluatePolicyEvidence(input)
  assert.equal(report.gates.find(g => g.id === 'disagreement_review').passed, false)
  assert.equal(report.evidence.agreementAlertCount, 6)
})

test('invalid report structures and negative thresholds are rejected', () => {
  assert.throws(() => evaluatePolicyEvidence({ ...fixtures(), qualityReport: {} }), /Quality Lab report/)
  assert.throws(() => evaluatePolicyEvidence({ ...fixtures(), minimumPairedCases: -1 }), /non-negative/)
})
