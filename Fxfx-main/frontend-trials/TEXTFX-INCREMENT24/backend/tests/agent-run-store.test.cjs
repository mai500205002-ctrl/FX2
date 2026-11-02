'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { randomUUID, createHash } = require('node:crypto')

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'textfx-agent-store-'))
process.env.TEXTFX_AGENT_DATA_DIR = tempRoot

function loadStore() {
  const modulePath = require.resolve('../dist/agent/agent-run-store.js')
  delete require.cache[modulePath]
  return require(modulePath)
}

test('run snapshots, append-only events, and hashed idempotency mappings survive module reload', t => {
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }))
  const runId = randomUUID()
  let store = loadStore()
  const record = { runId, goal: 'Persisted run', brief: 'Fixture brief', status: 'script', trace: [], createdAt: '2026-10-25T00:00:00.000Z', updatedAt: '2026-10-25T00:01:00.000Z' }
  store.persistAgentRun(record)
  store.appendAgentRunEvent({ runId, previousPhase: 'concept', phase: 'script', trace: { phase: 'script', message: 'script started', ts: record.updatedAt, meta: { prompt: 'must-not-be-written-to-event-log' } }, artifactRef: runId, artifactVersion: 2 })
  store.appendAgentRunEvent({ runId, previousPhase: 'script', phase: 'done', detail: 'run completed' })
  const keyHash = createHash('sha256').update('caller-idempotency-secret').digest('hex')
  store.appendIdempotencyRecord({ schemaVersion: 1, keyHash, requestHash: 'request-hash', runId, createdAt: record.updatedAt })

  store = loadStore()
  assert.equal(store.loadAgentRuns()[0].runId, runId)
  assert.equal(store.loadAgentRuns()[0].status, 'script')
  const [event] = store.loadAgentRunEvents()
  assert.equal(event.eventType, 'run.phase.changed')
  assert.equal(event.correlationId, runId)
  assert.equal(event.metadataHash.length, 64)
  assert.equal(event.artifactRef, runId)
  assert.equal(event.artifactVersion, 2)
  const lifecycle = store.reconstructAgentRunLifecycle(runId)
  assert.equal(lifecycle.status, 'done')
  assert.deepEqual(lifecycle.events.map(item => item.phase), ['script', 'done'])
  const eventLog = fs.readFileSync(path.join(tempRoot, 'events.jsonl'), 'utf8')
  assert.ok(!eventLog.includes('must-not-be-written-to-event-log'))
  const idempotencyRecords = store.loadIdempotencyRecords()
  assert.equal(idempotencyRecords[0].keyHash, keyHash)
  assert.ok(!JSON.stringify(idempotencyRecords).includes('caller-idempotency-secret'))
})