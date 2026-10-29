import { randomUUID } from 'node:crypto'
import { redactText } from './redact'

/**
 * Increment22 - Claims Gate.
 *
 * The browser agent could previously only report `status: completed|partial|failed`
 * for a whole run, which conflates "we called the tool" with "the result is true".
 * This gate makes that distinction structural: a claim can only reach `verified`
 * when an independent evidence item exists that post-dates the execution it is
 * meant to confirm. Execution success alone is capped at `succeeded`.
 */
export type ClaimState = 'requested' | 'attempted' | 'succeeded' | 'verified' | 'failed' | 'unknown'
export type EvidenceKind = 'execution' | 'observation' | 'independent-verification'
export type EvidenceSupport = 'success' | 'failure'

export interface EvidenceRecord {
  evidenceId: string
  kind: EvidenceKind
  source: string
  support: EvidenceSupport
  detail?: string
  observedAt: string
  runId: string
  independent: boolean
}

export interface ClaimTransition {
  from: ClaimState | null
  to: ClaimState
  at: string
  reason?: string
}

export interface ClaimRecord {
  claimId: string
  runId: string
  action: string
  state: ClaimState
  createdAt: string
  updatedAt: string
  evidence: EvidenceRecord[]
  history: ClaimTransition[]
  verificationRule?: string
  reason?: string
}

export interface ClaimEvaluation {
  claimId: string
  state: ClaimState
  storedState: ClaimState
  hasExecutionEvidence: boolean
  hasIndependentEvidence: boolean
  conflicting: boolean
  reason?: string
}

export class ClaimTransitionError extends Error {
  constructor(claimId: string, from: ClaimState, to: ClaimState) {
    super(redactText(`claim ${claimId} cannot move from ${from} to ${to}`))
    this.name = 'ClaimTransitionError'
  }
}

export class VerificationEvidenceError extends Error {
  constructor(message: string) {
    super(redactText(message))
    this.name = 'VerificationEvidenceError'
  }
}

const ALLOWED_TRANSITIONS: Record<ClaimState, ClaimState[]> = {
  requested: ['attempted', 'failed', 'unknown'],
  attempted: ['succeeded', 'failed', 'unknown'],
  succeeded: ['verified', 'failed', 'unknown'],
  failed: ['unknown'],
  unknown: ['attempted', 'failed'],
  verified: [],
}

export interface ClaimsGateOptions {
  now?: () => Date
}

export interface RegisterInput {
  runId: string
  action: string
  claimId?: string
  detail?: string
}

export interface ExecutionInput {
  source: string
  ok: boolean
  detail?: string
  evidenceId?: string
}

export interface EvidenceInput {
  kind: EvidenceKind
  source: string
  support: EvidenceSupport
  detail?: string
  independent?: boolean
  evidenceId?: string
}

export interface VerifyInput {
  verificationRule: string
  detail?: string
}

export class ClaimsGate {
  private readonly claims = new Map<string, ClaimRecord>()
  private readonly now: () => Date

  constructor(options: ClaimsGateOptions = {}) {
    this.now = options.now ?? (() => new Date())
  }

  register(input: RegisterInput): ClaimRecord {
    if (typeof input.runId !== 'string' || !input.runId) throw new Error('runId is required')
    if (typeof input.action !== 'string' || !input.action.trim()) throw new Error('action is required')
    const claimId = input.claimId ?? `claim_${randomUUID()}`
    if (this.claims.has(claimId)) throw new Error(`claim ${claimId} already registered`)
    const at = this.now().toISOString()
    const record: ClaimRecord = {
      claimId,
      runId: input.runId,
      action: redactText(input.action),
      state: 'requested',
      createdAt: at,
      updatedAt: at,
      evidence: [],
      history: [{ from: null, to: 'requested', at, reason: input.detail ? redactText(input.detail) : undefined }],
    }
    this.claims.set(claimId, record)
    return this.snapshot(record)
  }

  markAttempted(claimId: string, detail?: string): ClaimRecord {
    return this.transition(claimId, 'attempted', detail)
  }

  /** Records what the tool returned. Success here is execution, never verification. */
  recordExecution(claimId: string, input: ExecutionInput): ClaimRecord {
    const record = this.requireClaim(claimId)
    const at = this.now().toISOString()
    record.evidence.push({
      evidenceId: input.evidenceId ?? `ev_${randomUUID()}`,
      kind: 'execution',
      source: redactText(input.source),
      support: input.ok ? 'success' : 'failure',
      detail: input.detail ? redactText(input.detail) : undefined,
      observedAt: at,
      runId: record.runId,
      independent: false,
    })
    this.transitionInPlace(record, input.ok ? 'succeeded' : 'failed', input.detail)
    return this.snapshot(record)
  }

  addEvidence(claimId: string, input: EvidenceInput): ClaimRecord {
    const record = this.requireClaim(claimId)
    const at = this.now().toISOString()
    const executionSources = record.evidence.filter(e => e.kind === 'execution').map(e => e.source)
    const independent =
      (input.independent ?? input.kind === 'independent-verification') &&
      input.kind === 'independent-verification' &&
      !executionSources.includes(redactText(input.source))
    record.evidence.push({
      evidenceId: input.evidenceId ?? `ev_${randomUUID()}`,
      kind: input.kind,
      source: redactText(input.source),
      support: input.support,
      detail: input.detail ? redactText(input.detail) : undefined,
      observedAt: at,
      runId: record.runId,
      independent,
    })
    if (input.support === 'failure' && record.state === 'succeeded') {
      this.transitionInPlace(record, 'unknown', 'conflicting evidence recorded')
    }
    return this.snapshot(record)
  }

  verify(claimId: string, input: VerifyInput): ClaimRecord {
    const record = this.requireClaim(claimId)
    if (!input.verificationRule || !input.verificationRule.trim()) {
      throw new VerificationEvidenceError('a concrete verification rule is required')
    }
    if (record.state !== 'succeeded') {
      throw new VerificationEvidenceError(`only a succeeded claim can be verified (current state: ${record.state})`)
    }
    const independent = record.evidence.filter(
      e => e.kind === 'independent-verification' && e.independent && e.support === 'success',
    )
    if (independent.length === 0) {
      throw new VerificationEvidenceError(
        'execution success alone is not verification; an independent-verification evidence item is required',
      )
    }
    const latestExecution = record.evidence
      .filter(e => e.kind === 'execution')
      .map(e => e.observedAt)
      .sort()
      .at(-1)
    if (!independent.some(e => !latestExecution || e.observedAt >= latestExecution)) {
      throw new VerificationEvidenceError('independent evidence predates the execution it is supposed to confirm')
    }
    record.verificationRule = redactText(input.verificationRule)
    this.transitionInPlace(record, 'verified', input.detail ?? input.verificationRule)
    return this.snapshot(record)
  }

  markUnknown(claimId: string, reason: string): ClaimRecord {
    return this.transition(claimId, 'unknown', reason)
  }

  fail(claimId: string, reason: string): ClaimRecord {
    return this.transition(claimId, 'failed', reason)
  }

  getClaim(claimId: string): ClaimRecord | undefined {
    const record = this.claims.get(claimId)
    return record ? this.snapshot(record) : undefined
  }

  list(): ClaimRecord[] {
    return Array.from(this.claims.values()).map(r => this.snapshot(r))
  }

  evaluate(claimId: string): ClaimEvaluation {
    const record = this.requireClaim(claimId)
    const hasExecutionEvidence = record.evidence.some(e => e.kind === 'execution' && e.support === 'success')
    const hasIndependentEvidence = record.evidence.some(
      e => e.kind === 'independent-verification' && e.independent && e.support === 'success',
    )
    const conflicting = record.evidence.some(e => e.support === 'failure') && hasExecutionEvidence
    let state = record.state
    if (conflicting && state !== 'verified') state = 'unknown'
    if (!hasExecutionEvidence && state === 'succeeded') state = 'unknown'
    return {
      claimId,
      state,
      storedState: record.state,
      hasExecutionEvidence,
      hasIndependentEvidence,
      conflicting,
      reason: record.reason,
    }
  }

  report(): {
    generatedAt: string
    total: number
    byState: Record<ClaimState, number>
    claims: Array<ClaimRecord & { evaluation: ClaimEvaluation }>
  } {
    const byState: Record<ClaimState, number> = {
      requested: 0,
      attempted: 0,
      succeeded: 0,
      verified: 0,
      failed: 0,
      unknown: 0,
    }
    for (const record of this.claims.values()) byState[record.state] += 1
    return {
      generatedAt: this.now().toISOString(),
      total: this.claims.size,
      byState,
      claims: this.list().map(claim => ({ ...claim, evaluation: this.evaluate(claim.claimId) })),
    }
  }

  private requireClaim(claimId: string): ClaimRecord {
    const record = this.claims.get(claimId)
    if (!record) throw new Error(`unknown claim ${claimId}`)
    return record
  }

  private transition(claimId: string, to: ClaimState, reason?: string): ClaimRecord {
    const record = this.requireClaim(claimId)
    this.transitionInPlace(record, to, reason)
    return this.snapshot(record)
  }

  private transitionInPlace(record: ClaimRecord, to: ClaimState, reason?: string): void {
    if (!ALLOWED_TRANSITIONS[record.state].includes(to)) {
      throw new ClaimTransitionError(record.claimId, record.state, to)
    }
    const at = this.now().toISOString()
    const safeReason = reason ? redactText(reason) : undefined
    record.history.push({ from: record.state, to, at, reason: safeReason })
    record.state = to
    record.updatedAt = at
    if (safeReason) record.reason = safeReason
  }

  private snapshot(record: ClaimRecord): ClaimRecord {
    return {
      ...record,
      evidence: record.evidence.map(e => ({ ...e })),
      history: record.history.map(h => ({ ...h })),
    }
  }
}
