'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const benchmark = require('./fixtures/creative-benchmark.json')
const { analyzeInterRaterAgreement } = require('../scripts/creative-inter-rater-agreement.cjs')

const ratings = [
  { caseId: 'human-tension-01', artifactId: 'a1', reviewerId: 'r1', scores: { brief_alignment: 5, originality: 4 } },
  { caseId: 'human-tension-01', artifactId: 'a1', reviewerId: 'r2', scores: { brief_alignment: 5, originality: 2 } },
  { caseId: 'human-tension-01', artifactId: 'a1', reviewerId: 'r3', scores: { brief_alignment: 4, originality: 5 } },
]

test('computes exact and linearly weighted agreement for overlapping ratings', () => {
  const report = analyzeInterRaterAgreement({ ratingsDocument: ratings, benchmark })
  const alignment = report.cells.find(cell => cell.criterionId === 'brief_alignment')
  const originality = report.cells.find(cell => cell.criterionId === 'originality')
  assert.equal(alignment.exactAgreementRate, 0.333)
  assert.equal(alignment.linearlyWeightedAgreement, 0.833)
  assert.equal(originality.needsDiscussion, true)
  assert.equal(report.input.ratingCount, 3)
})

test('flags missing criterion scores and fewer than two observations', () => {
  const report = analyzeInterRaterAgreement({ ratingsDocument: [ratings[0]], benchmark })
  assert.ok(report.alerts.some(item => item.reason.includes('Fewer than two')))
  assert.ok(report.alerts.some(item => item.reason.includes('did not score this criterion')))
})

test('rejects duplicate reviewer submissions for one artifact', () => {
  assert.throws(() => analyzeInterRaterAgreement({ ratingsDocument: [ratings[0], ratings[0]], benchmark }), /Duplicate reviewer/)
})

test('rejects unknown criteria and out-of-range scores', () => {
  assert.throws(() => analyzeInterRaterAgreement({ ratingsDocument: [{ ...ratings[0], scores: { mystery: 3 } }], benchmark }), /Unknown criterion/)
  assert.throws(() => analyzeInterRaterAgreement({ ratingsDocument: [{ ...ratings[0], scores: { originality: 6 } }], benchmark }), /between 1 and 5/)
})

test('does not describe agreement as formal chance-corrected reliability', () => {
  const report = analyzeInterRaterAgreement({ ratingsDocument: ratings, benchmark })
  assert.match(report.overall.interpretation, /not a formal Krippendorff alpha/)
  assert.ok(report.limitations.some(item => item.includes('chance agreement')))
})
