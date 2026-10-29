import { createHash, randomUUID } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AgentPhase, AgentRunRecord, AgentTraceItem } from './types'

export interface AgentRunEvent {
  schemaVersion: 1
  eventId: string
  eventType: 'run.phase.changed' | 'run.interrupted' | 'run.approval.created' | 'run.approval.invalidated'
  actor: 'agent-service' | 'human'
  timestamp: string
  runId: string
  phase: AgentPhase
  correlationId: string
  artifactRef?: string
  artifactVersion?: number
  metadataHash?: string
  detail?: string
}

export interface IdempotencyRecord {
  schemaVersion: 1
  keyHash: string
  requestHash: string
  runId: string
  createdAt: string
}

const dataDirectory = resolve(process.env.TEXTFX_AGENT_DATA_DIR || resolve(process.cwd(), 'data', 'agent-state'))
const runsDirectory = resolve(dataDirectory, 'runs')
const eventLogPath = resolve(dataDirectory, 'events.jsonl')
const idempotencyLogPath = resolve(dataDirectory, 'idempotency.jsonl')
let eventLogError: string | undefined

function ensureDirectory(): void {
  mkdirSync(runsDirectory, { recursive: true, mode: 0o700 })
  try { mkdirSync(dataDirectory, { recursive: true, mode: 0o700 }) } catch { /* runsDirectory creates its parent */ }
}

function runFilePath(runId: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId)) throw new Error('Invalid run ID for persistence.')
  return resolve(runsDirectory, `${runId}.json`)
}

export function persistAgentRun(record: AgentRunRecord): void {
  ensureDirectory()
  const target = runFilePath(record.runId)
  const temporary = `${target}.${randomUUID()}.tmp`
  try {
    writeFileSync(temporary, JSON.stringify(record), { encoding: 'utf8', mode: 0o600, flag: 'wx' })
    renameSync(temporary, target)
  } finally {
    try { require('node:fs').rmSync(temporary, { force: true }) } catch { /* Preserve the prior snapshot if cleanup fails. */ }
  }
}

export function loadAgentRuns(): AgentRunRecord[] {
  if (!existsSync(runsDirectory)) return []
  const records: AgentRunRecord[] = []
  for (const fileName of readdirSync(runsDirectory).filter(name => /^[0-9a-f-]+\.json$/i.test(name))) {
    try {
      const record = JSON.parse(readFileSync(resolve(runsDirectory, fileName), 'utf8')) as AgentRunRecord
      if (record.runId === fileName.slice(0, -5) && typeof record.goal === 'string' && typeof record.status === 'string' && Array.isArray(record.trace)) records.push(record)
    } catch {
      // Invalid snapshots are left untouched and excluded from recovery.
    }
  }
  return records.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function appendAgentRunEvent(args: {
  runId: string
  phase: AgentPhase
  previousPhase?: AgentPhase
  trace?: AgentTraceItem
  actor?: AgentRunEvent['actor']
  eventType?: AgentRunEvent['eventType']
  detail?: string
  artifactRef?: string
  artifactVersion?: number
}): AgentRunEvent {
  if (eventLogError) throw new Error(eventLogError)
  ensureDirectory()
  const event: AgentRunEvent = {
    schemaVersion: 1,
    eventId: randomUUID(),
    eventType: args.eventType || 'run.phase.changed',
    actor: args.actor || 'agent-service',
    timestamp: args.trace?.ts || new Date().toISOString(),
    runId: args.runId,
    phase: args.phase,
    correlationId: args.runId,
    artifactRef: args.artifactRef || (args.trace?.meta && typeof args.trace.meta.creativeIR === 'object' ? args.runId : undefined),
    artifactVersion: args.artifactVersion,
    metadataHash: args.trace?.meta ? createHash('sha256').update(JSON.stringify(args.trace.meta)).digest('hex') : undefined,
    detail: args.detail || (args.previousPhase ? `${args.previousPhase} -> ${args.phase}` : undefined),
  }
  appendFileSync(eventLogPath, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 })
  return event
}

export function loadAgentRunEvents(limit = 2000): AgentRunEvent[] {
  if (!existsSync(eventLogPath)) return []
  const lines = readFileSync(eventLogPath, 'utf8').split('\n').filter(Boolean)
  const result: AgentRunEvent[] = []
  for (const line of lines.slice(-Math.max(1, limit))) {
    try {
      const event = JSON.parse(line) as AgentRunEvent
      if (event.schemaVersion === 1 && typeof event.eventId === 'string' && typeof event.runId === 'string' && typeof event.phase === 'string') result.push(event)
    } catch {
      eventLogError = 'Agent event log contains an invalid record; the original log was preserved.'
    }
  }
  return result
}

export function reconstructAgentRunLifecycle(runId: string): { runId: string; status: AgentPhase; createdAt: string; updatedAt: string; events: AgentRunEvent[] } | undefined {
  const events = loadAgentRunEvents(100_000).filter(event => event.runId === runId)
  if (!events.length) return undefined
  return { runId, status: events[events.length - 1].phase, createdAt: events[0].timestamp, updatedAt: events[events.length - 1].timestamp, events }
}

export function appendIdempotencyRecord(record: IdempotencyRecord): void {
  ensureDirectory()
  appendFileSync(idempotencyLogPath, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 })
}

export function loadIdempotencyRecords(): IdempotencyRecord[] {
  if (!existsSync(idempotencyLogPath)) return []
  const latest = new Map<string, IdempotencyRecord>()
  for (const line of readFileSync(idempotencyLogPath, 'utf8').split('\n').filter(Boolean)) {
    try {
      const item = JSON.parse(line) as IdempotencyRecord
      if (item.schemaVersion === 1 && typeof item.keyHash === 'string' && typeof item.requestHash === 'string' && typeof item.runId === 'string') latest.set(item.keyHash, item)
    } catch { /* Preserve but ignore malformed idempotency records. */ }
  }
  return [...latest.values()]
}

export function deletePersistedAgentRun(runId: string): boolean {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId)) {
    throw new Error('Invalid run ID for deletion.')
  }
  const target = resolve(runsDirectory, `${runId}.json`)
  if (existsSync(target)) {
    try {
      rmSync(target, { force: true })
      return true
    } catch {
      return false
    }
  }
  return false
}

export function pruneExpiredAgentRuns(retentionDays = 30): number {
  if (!existsSync(runsDirectory) || retentionDays <= 0) return 0
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000
  const now = Date.now()
  let prunedCount = 0
  for (const fileName of readdirSync(runsDirectory).filter(name => /^[0-9a-f-]+\.json$/i.test(name))) {
    const fullPath = resolve(runsDirectory, fileName)
    try {
      const stats = statSync(fullPath)
      if (now - stats.mtimeMs > maxAgeMs) {
        rmSync(fullPath, { force: true })
        prunedCount++
      }
    } catch {
      // Continue pruning remaining files
    }
  }
  return prunedCount
}