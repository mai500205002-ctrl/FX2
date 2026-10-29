import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { CreativeCandidate } from '../core/creative-ir'

export type CandidateDecision = 'generated' | 'revision-requested' | 'revised' | 'accepted' | 'rejected' | 'blocked' | 'not-selected'

export interface CandidateArchiveEntry {
  entryId: string
  runId: string
  candidateId: string
  version: number
  decision: CandidateDecision
  reason: string
  source: 'discovery' | 'metabolism' | 'entropy' | 'creative-court'
  promptVersion: string
  createdAt: string
  candidate: CreativeCandidate
}

interface ArchiveState {
  schemaVersion: 1
  entries: CandidateArchiveEntry[]
}

const memoryPath = process.env.TEXTFX_CREATIVE_MEMORY_PATH
const defaultDirectory = memoryPath ? dirname(resolve(memoryPath)) : resolve(process.cwd(), 'data')
const archivePath = resolve(process.env.TEXTFX_CANDIDATE_ARCHIVE_PATH || `${defaultDirectory}/creative-candidates.json`)
let entries: CandidateArchiveEntry[] = []
let loadError: string | undefined

function isArchiveEntry(value: unknown): value is CandidateArchiveEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<CandidateArchiveEntry>
  return typeof entry.entryId === 'string' && typeof entry.runId === 'string' &&
    typeof entry.candidateId === 'string' && Number.isInteger(entry.version) &&
    ['generated', 'revision-requested', 'revised', 'accepted', 'rejected', 'blocked', 'not-selected'].includes(String(entry.decision)) &&
    typeof entry.reason === 'string' && typeof entry.createdAt === 'string' &&
    !!entry.candidate && typeof entry.candidate === 'object'
}

function loadArchive(): void {
  if (!existsSync(archivePath)) return
  try {
    const parsed = JSON.parse(readFileSync(archivePath, 'utf8')) as Partial<ArchiveState>
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.entries) || !parsed.entries.every(isArchiveEntry)) {
      throw new Error('unsupported archive schema')
    }
    entries = parsed.entries
  } catch {
    loadError = 'Candidate archive is invalid; the original file was preserved.'
  }
}

function persistArchive(): void {
  if (loadError) throw new Error(loadError)
  mkdirSync(dirname(archivePath), { recursive: true })
  const temporaryPath = `${archivePath}.${process.pid}.tmp`
  writeFileSync(temporaryPath, JSON.stringify({ schemaVersion: 1, entries } satisfies ArchiveState, null, 2), { encoding: 'utf8', mode: 0o600 })
  renameSync(temporaryPath, archivePath)
}

loadArchive()

/** Append one immutable candidate version/decision; retries of the same event are idempotent. */
export function recordCandidateDecision(args: {
  runId: string
  candidate: CreativeCandidate
  decision: CandidateDecision
  reason: string
  source: CandidateArchiveEntry['source']
}): CandidateArchiveEntry {
  const candidateId = args.candidate.id
  const version = args.candidate.version ?? 1
  if (!args.runId.trim() || !candidateId.trim() || !Number.isInteger(version) || version < 1) {
    throw new Error('Candidate archive requires a run ID, candidate ID, and positive integer version.')
  }
  const entryId = createHash('sha256')
    .update([args.runId, candidateId, version, args.decision].join(':'))
    .digest('hex')
  const existing = entries.find(entry => entry.entryId === entryId)
  if (existing) return structuredClone(existing)

  const entry: CandidateArchiveEntry = {
    entryId,
    runId: args.runId,
    candidateId,
    version,
    decision: args.decision,
    reason: args.reason.replace(/\s+/g, ' ').trim().slice(0, 1000),
    source: args.source,
    promptVersion: args.candidate.promptVersion || '1.0.0',
    createdAt: new Date().toISOString(),
    candidate: JSON.parse(JSON.stringify({ ...args.candidate, runId: args.runId, version })),
  }
  entries.push(entry)
  try {
    persistArchive()
  } catch (error) {
    entries.pop()
    throw error
  }
  return structuredClone(entry)
}

export function getCandidateArchive(runId?: string): CandidateArchiveEntry[] {
  return entries
    .filter(entry => !runId || entry.runId === runId)
    .map(entry => structuredClone(entry))
}

export function deleteCandidateArchive(runId: string): number {
  if (!runId) return 0
  const beforeCount = entries.length
  entries = entries.filter(entry => entry.runId !== runId)
  const deletedCount = beforeCount - entries.length
  if (deletedCount > 0) {
    try {
      persistArchive()
    } catch {
      // Non-fatal if persistence fails during purge
    }
  }
  return deletedCount
}