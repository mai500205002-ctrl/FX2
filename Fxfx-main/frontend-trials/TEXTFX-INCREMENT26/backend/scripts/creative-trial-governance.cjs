#!/usr/bin/env node
'use strict'
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

function readJson(file) { return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) }
function writePrivate(file, value) {
  const target = path.resolve(file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  try { fs.chmodSync(target, 0o600) } catch { /* Some filesystems do not expose POSIX permissions. */ }
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
  return value
}
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(stable(value)), 'utf8').digest('hex') }
function verifyLedger(ledger) {
  if (!ledger || ledger.ledgerVersion !== '1.0.0' || !Array.isArray(ledger.entries)) throw new Error('Invalid trial governance ledger.')
  let previousHash = 'GENESIS'
  for (let i = 0; i < ledger.entries.length; i++) {
    const entry = ledger.entries[i]
    if (entry.sequence !== i + 1) throw new Error(`Ledger sequence mismatch at entry ${i + 1}.`)
    if (entry.previousHash !== previousHash) throw new Error(`Ledger chain mismatch at entry ${i + 1}.`)
    const { recordHash, ...payload } = entry
    const expected = hash(payload)
    if (recordHash !== expected) throw new Error(`Ledger record hash mismatch at entry ${i + 1}.`)
    previousHash = recordHash
  }
  return { valid: true, entryCount: ledger.entries.length, headHash: previousHash }
}
function recordDecision({ dossier, decision, approver, rationale, rollbackCriteria = [], trialWindow = null, ledger, now = () => new Date().toISOString() }) {
  if (!['approve', 'reject', 'defer'].includes(decision)) throw new Error('Decision must be approve, reject, or defer.')
  if (typeof approver !== 'string' || !approver.trim()) throw new Error('A human approver/reviewer identifier is required.')
  if (typeof rationale !== 'string' || rationale.trim().length < 12) throw new Error('Decision rationale must contain at least 12 non-whitespace characters.')
  if (!dossier || !dossier.policy || !dossier.gateSummary) throw new Error('A valid policy review dossier is required.')
  if (!Array.isArray(rollbackCriteria)) throw new Error('rollbackCriteria must be an array of strings.')
  if (rollbackCriteria.some(item => typeof item !== 'string' || item.trim().length < 5)) throw new Error('Each rollback criterion must be a descriptive non-empty string.')
  if (decision === 'approve') {
    if (dossier.policy.automaticPolicyChange !== false || dossier.policy.humanApprovalRequired !== true) throw new Error('Dossier does not enforce the required human-approval safety boundary.')
    if (dossier.gateSummary.allPassed !== true || dossier.recommendation !== 'eligible_for_human_review_of_a_controlled_trial') throw new Error('Cannot approve a trial when the evidence dossier has failed or incomplete gates.')
    if (rollbackCriteria.length < 2) throw new Error('Approval requires at least two explicit rollback/stop criteria.')
    if (typeof trialWindow !== 'string' || trialWindow.trim().length < 3) throw new Error('Approval requires a bounded trial window (for example, 2 weeks or 20 runs).')
  }
  const current = ledger ?? { ledgerVersion: '1.0.0', entries: [] }
  const chain = verifyLedger(current)
  const payload = {
    sequence: current.entries.length + 1,
    recordedAt: now(),
    decision,
    approver: approver.trim(),
    rationale: rationale.trim(),
    experimentId: dossier.experimentId ?? null,
    benchmarkVersion: dossier.benchmarkVersion ?? null,
    baselineVersion: dossier.versions?.baseline ?? null,
    candidateVersion: dossier.versions?.candidate ?? null,
    dossierHash: hash(dossier),
    gates: dossier.gates.map(gate => ({ id: gate.id, passed: gate.passed, observed: gate.observed })),
    rollbackCriteria: rollbackCriteria.map(item => item.trim()),
    trialWindow: decision === 'approve' ? trialWindow.trim() : null,
    automaticPolicyChange: false,
    previousHash: chain.headHash,
  }
  const entry = { ...payload, recordHash: hash(payload) }
  return { ledger: { ledgerVersion: '1.0.0', entries: [...current.entries, entry] }, entry }
}
function main(argv = process.argv.slice(2)) {
  const mode = argv[0]
  const get = name => { const i = argv.indexOf(name); return i < 0 ? undefined : argv[i + 1] }
  try {
    if (mode === 'verify') {
      const ledgerPath = get('--ledger')
      if (!ledgerPath) throw new Error('Missing --ledger.')
      const result = verifyLedger(readJson(ledgerPath))
      process.stdout.write(`Ledger integrity valid: ${result.entryCount} entries; head ${result.headHash}.\n`)
      return 0
    }
    if (mode !== 'record') throw new Error('Usage: record --dossier dossier.json --decision approve|reject|defer --approver ID --rationale TEXT --ledger ledger.json [--rollback-file rollback.json --trial-window WINDOW] | verify --ledger ledger.json')
    const dossierPath = get('--dossier'), ledgerPath = get('--ledger')
    if (!dossierPath || !ledgerPath || !get('--decision') || !get('--approver') || !get('--rationale')) throw new Error('record requires --dossier, --decision, --approver, --rationale, and --ledger.')
    const rollbackFile = get('--rollback-file')
    const rollbackCriteria = rollbackFile ? readJson(rollbackFile) : []
    const ledger = fs.existsSync(path.resolve(ledgerPath)) ? readJson(ledgerPath) : undefined
    const result = recordDecision({ dossier: readJson(dossierPath), decision: get('--decision'), approver: get('--approver'), rationale: get('--rationale'), rollbackCriteria, trialWindow: get('--trial-window'), ledger })
    writePrivate(ledgerPath, result.ledger)
    process.stdout.write(`Recorded human decision '${result.entry.decision}' as ledger entry ${result.entry.sequence}.\n`)
    process.stdout.write(`Automatic policy change: false. Record hash: ${result.entry.recordHash}\n`)
    return 0
  } catch (error) {
    console.error(`Trial governance failed: ${error instanceof Error ? error.message : String(error)}`)
    return 2
  }
}
if (require.main === module) process.exitCode = main()
module.exports = { verifyLedger, recordDecision, hash }
