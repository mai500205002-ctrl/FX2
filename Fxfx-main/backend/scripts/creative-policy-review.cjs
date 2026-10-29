#!/usr/bin/env node
'use strict'
const fs = require('node:fs')
const path = require('node:path')

function readJson(file) { return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) }
function writeJson(file, value) {
  const target = path.resolve(file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  try { fs.chmodSync(target, 0o600) } catch { /* Windows filesystems may not expose POSIX permissions. */ }
}
function evaluatePolicyEvidence({ qualityReport, agreementReport, finalizedRatings, minimumPairedCases = 5, minimumReviewersPerArtifact = 3, minimumWeightedAgreement = 0.6, maximumDisagreementAlerts = 5 }) {
  if (!qualityReport?.comparison || !Array.isArray(qualityReport.summaries)) throw new Error('A valid Creative Quality Lab report is required.')
  if (!agreementReport?.overall || !Array.isArray(agreementReport.alerts)) throw new Error('A valid inter-rater agreement report is required.')
  if (!finalizedRatings || !Array.isArray(finalizedRatings.ratings)) throw new Error('Finalized ratings are required.')
  for (const [name, value] of Object.entries({ minimumPairedCases, minimumReviewersPerArtifact, minimumWeightedAgreement, maximumDisagreementAlerts })) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative finite number.`)
  }
  const comparison = qualityReport.comparison
  const integrity = finalizedRatings.audit?.integrityVerification
  const completeSummaries = qualityReport.summaries.filter(item => item.complete && item.weightedScore !== null)
  const lowReviewerArtifacts = completeSummaries.filter(item => item.reviewerCount < minimumReviewersPerArtifact)
  const gates = [
    { id: 'integrity_verified', passed: integrity?.valid === true, observed: integrity?.valid === true ? 'verified' : 'missing/unverified', requirement: 'Finalize ratings only after packet, mapping, and benchmark integrity checks pass.' },
    { id: 'paired_case_coverage', passed: comparison.pairedCaseCount >= minimumPairedCases, observed: comparison.pairedCaseCount, requirement: `At least ${minimumPairedCases} complete paired benchmark cases.` },
    { id: 'reviewer_coverage', passed: lowReviewerArtifacts.length === 0 && completeSummaries.length > 0, observed: { completeArtifactSummaries: completeSummaries.length, belowReviewerThreshold: lowReviewerArtifacts.length }, requirement: `Every complete artifact summary used for comparison must have at least ${minimumReviewersPerArtifact} reviewers.` },
    { id: 'reviewer_agreement', passed: Number.isFinite(agreementReport.overall.linearlyWeightedAgreement) && agreementReport.overall.linearlyWeightedAgreement >= minimumWeightedAgreement, observed: agreementReport.overall.linearlyWeightedAgreement ?? null, requirement: `Overall linearly weighted agreement must be at least ${minimumWeightedAgreement}.` },
    { id: 'disagreement_review', passed: agreementReport.alerts.length <= maximumDisagreementAlerts, observed: agreementReport.alerts.length, requirement: `At most ${maximumDisagreementAlerts} agreement alerts; unresolved disagreements require documented review.` },
    { id: 'paired_delta_available', passed: Number.isFinite(comparison.meanDelta), observed: comparison.meanDelta ?? null, requirement: 'A descriptive paired mean delta must be available.' },
  ]
  const passed = gates.filter(item => item.passed).length
  const allPassed = passed === gates.length
  return {
    dossierVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    experimentId: finalizedRatings.experimentId ?? null,
    benchmarkVersion: qualityReport.benchmarkVersion ?? finalizedRatings.benchmarkVersion ?? null,
    versions: { baseline: comparison.baselineVersion, candidate: comparison.candidateVersion },
    evidence: {
      pairedCaseCount: comparison.pairedCaseCount,
      meanDelta: comparison.meanDelta,
      medianDelta: comparison.medianDelta,
      wins: comparison.wins,
      losses: comparison.losses,
      ties: comparison.ties,
      weightedAgreement: agreementReport.overall.linearlyWeightedAgreement ?? null,
      exactAgreement: agreementReport.overall.exactAgreementRate ?? null,
      agreementAlertCount: agreementReport.alerts.length,
      ratingCount: finalizedRatings.ratings.length,
      integrityVerified: integrity?.valid === true,
    },
    gates,
    gateSummary: { passed, total: gates.length, allPassed },
    recommendation: allPassed ? 'eligible_for_human_review_of_a_controlled_trial' : 'insufficient_evidence',
    requiredHumanActions: allPassed
      ? ['Review the paired case deltas and disagreement alerts.', 'Confirm the benchmark cases represent the intended creative work.', 'Approve or reject a separately documented controlled trial.', 'Record the approver, rationale, and rollback criteria before any policy change.']
      : ['Resolve failed evidence gates and rerun the review.', 'Do not change generation strategy based on this dossier.'],
    policy: { automaticPolicyChange: false, humanApprovalRequired: true, thisIsNotProofOfCausality: true },
    limitations: [
      'A small benchmark can miss regressions in creative domains not represented by its cases.',
      'Reviewer agreement is descriptive and is not chance-corrected reliability.',
      'Paired score differences do not establish statistical significance, causality, or audience impact.',
      'Passing all gates only permits a human to consider a controlled trial; it does not authorize a policy change.',
    ],
  }
}
function main(argv = process.argv.slice(2)) {
  const get = name => { const i = argv.indexOf(name); return i < 0 ? undefined : argv[i + 1] }
  const qualityPath = get('--quality'), agreementPath = get('--agreement'), ratingsPath = get('--ratings'), out = get('--out')
  if (!qualityPath || !agreementPath || !ratingsPath || !out) {
    console.error('Usage: node scripts/creative-policy-review.cjs --quality quality-report.json --agreement agreement-report.json --ratings finalized-ratings.json --out policy-dossier.json [--min-paired-cases 5] [--min-weighted-agreement 0.6]')
    return 2
  }
  try {
    const dossier = evaluatePolicyEvidence({
      qualityReport: readJson(qualityPath), agreementReport: readJson(agreementPath), finalizedRatings: readJson(ratingsPath),
      minimumPairedCases: Number(get('--min-paired-cases') || 5),
      minimumReviewersPerArtifact: Number(get('--min-reviewers') || 3),
      minimumWeightedAgreement: Number(get('--min-weighted-agreement') || 0.6),
      maximumDisagreementAlerts: Number(get('--max-disagreement-alerts') || 5),
    })
    writeJson(out, dossier)
    process.stdout.write(`Policy review: ${dossier.recommendation}; ${dossier.gateSummary.passed}/${dossier.gateSummary.total} gates passed.\n`)
    process.stdout.write(`No automatic policy change: ${dossier.policy.automaticPolicyChange === false}. Report: ${path.resolve(out)}\n`)
    return 0
  } catch (error) {
    console.error(`Creative policy review failed: ${error instanceof Error ? error.message : String(error)}`)
    return 2
  }
}
if (require.main === module) process.exitCode = main()
module.exports = { evaluatePolicyEvidence }
