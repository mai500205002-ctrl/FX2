'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const express = require('express')

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'textfx-candidate-archive-'))
process.env.TEXTFX_CANDIDATE_ARCHIVE_PATH = path.join(tempRoot, 'candidates.json')
process.env.TEXTFX_AGENT_DATA_DIR = path.join(tempRoot, 'agent-state')

function loadArchiveModule() {
  const modulePath = require.resolve('../dist/modules/candidate-archive.js')
  delete require.cache[modulePath]
  return require(modulePath)
}

const candidate = { id: 'candidate-1', lens: 'Provocation', lensId: 'provocation', version: 1, runId: 'run-1', promptVersion: '1.2.0', score: 80, rationale: ['fixture'], concept: { title: 'A', tagline: 'A', coreIdea: 'A', visualNotes: 'A', creativeDevice: 'A', emotionalArc: 'A', targetParadox: 'A' } }

test('candidate archive preserves versioned decisions across reload and deduplicates retries', async t => {
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }))
  let archive = loadArchiveModule()
  const generated = archive.recordCandidateDecision({ runId: 'run-1', candidate, decision: 'generated', reason: 'Created from provocation.', source: 'discovery' })
  const duplicate = archive.recordCandidateDecision({ runId: 'run-1', candidate, decision: 'generated', reason: 'Retry.', source: 'discovery' })
  assert.equal(duplicate.entryId, generated.entryId)
  assert.equal(archive.getCandidateArchive('run-1').length, 1)

  const revised = { ...candidate, version: 2, concept: { ...candidate.concept, title: 'B' } }
  archive.recordCandidateDecision({ runId: 'run-1', candidate: revised, decision: 'accepted', reason: 'Court advanced this version.', source: 'creative-court' })
  archive = loadArchiveModule()
  const history = archive.getCandidateArchive('run-1')
  assert.deepEqual(history.map(item => [item.version, item.decision]), [[1, 'generated'], [2, 'accepted']])
  assert.equal(history[1].candidate.concept.title, 'B')
  assert.equal(history[1].promptVersion, '1.2.0')

  const router = require('../dist/agent/agent-route.js').default
  const app = express()
  app.use('/api/agent', router)
  const server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => { server.closeAllConnections(); server.close() })
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/agent/runs/run-1/candidates`)
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.runId, 'run-1')
  assert.equal(payload.candidates.length, 2)
})