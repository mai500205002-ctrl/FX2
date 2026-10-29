import { createHash, randomUUID } from 'node:crypto'

export interface ArtifactApproval {
  approvalId: string
  approvedBy: string
  approvedAt: string
  artifactHash: string
  artifactVersion: number
  policyVersion: string
  evidenceSetHash: string
}

export interface ApprovalBasis {
  artifact: unknown
  artifactVersion: number
  policyVersion: string
  evidenceIds: string[]
}

export interface ApprovalValidation {
  valid: boolean
  reason?: string
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue((value as Record<string, unknown>)[key])]))
  return value
}

function hashValue(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex')
}

function evidenceSetHash(evidenceIds: string[]): string {
  if (!Array.isArray(evidenceIds) || evidenceIds.some(id => typeof id !== 'string' || !id.trim()) || new Set(evidenceIds).size !== evidenceIds.length) {
    throw new Error('Approval evidence IDs must be unique, non-empty strings.')
  }
  return hashValue([...evidenceIds].sort())
}

export function createArtifactApproval(args: {
  approvedBy: string
  basis: ApprovalBasis
  approvedAt?: string
}): ArtifactApproval {
  if (typeof args.approvedBy !== 'string' || !args.approvedBy.trim()) throw new Error('A trusted approver identity is required.')
  if (!Number.isInteger(args.basis.artifactVersion) || args.basis.artifactVersion < 1) throw new Error('Approval artifact version must be a positive integer.')
  if (typeof args.basis.policyVersion !== 'string' || !args.basis.policyVersion.trim()) throw new Error('Approval policy version is required.')
  return {
    approvalId: randomUUID(),
    approvedBy: args.approvedBy.trim(),
    approvedAt: args.approvedAt || new Date().toISOString(),
    artifactHash: hashValue(args.basis.artifact),
    artifactVersion: args.basis.artifactVersion,
    policyVersion: args.basis.policyVersion,
    evidenceSetHash: evidenceSetHash(args.basis.evidenceIds),
  }
}

export function validateArtifactApproval(approval: ArtifactApproval, current: ApprovalBasis): ApprovalValidation {
  if (approval.artifactVersion !== current.artifactVersion) return { valid: false, reason: 'Artifact version changed after approval.' }
  if (approval.policyVersion !== current.policyVersion) return { valid: false, reason: 'Approval policy version changed.' }
  if (approval.artifactHash !== hashValue(current.artifact)) return { valid: false, reason: 'Artifact content changed after approval.' }
  if (approval.evidenceSetHash !== evidenceSetHash(current.evidenceIds)) return { valid: false, reason: 'Approval evidence set changed.' }
  return { valid: true }
}