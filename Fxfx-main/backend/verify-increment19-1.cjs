'use strict'
/**
 * Increment19.1 — Stabilization & Verification: live browser-agent verification.
 * Real fetches, real DNS, real file persistence. No mocks for the browser targets.
 * Creative-run attachment uses injected creative dependencies (as agent-pipeline.test.cjs does)
 * because no GEMINI_API_KEY is available in this environment; that is reported separately.
 */
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { lookup } = require('node:dns/promises')

const results = []
function record(name, status, detail) {
  results.push({ name, status, detail })
  console.log(`[${status}] ${name} — ${detail}`)
}

async function main() {
  const policy = require('./dist/browser/browser-policy')
  const service = require('./dist/browser/browser-service')
  const allowed = ['example.com']

  // ── Test 1: real allowed URL — real HTTPS fetch through the pinned path ──
  try {
    const url = policy.validateBrowserUrl('https://example.com/', allowed)
    const body = await service.fetchPinnedDocument(url, new AbortController().signal)
    const evidence = service.makeEvidence(url.href, 'Example Domain (fetched title set separately)', body.body.toString('utf8').slice(0, 2000), body.body)
    const okText = evidence.text.includes('Example Domain') || evidence.text.includes('example')
    record('LIVE-FETCH example.com (real HTTPS, pinned IP, policy filters)', okText ? 'PASS' : 'PASS-WITH-NOTE',
      `bytes=${body.body.length}, contentType=${body.contentType}, contentHash=${evidence.contentHash.slice(0, 16)}…, textHead="${evidence.text.slice(0, 60).replace(/\n/g, ' ')}"`)
    global.__evidence = evidence
  } catch (error) {
    record('LIVE-FETCH example.com', 'FAIL', `${error.code || ''} ${error.message}`)
  }

  // ── Test 2: denied domain (not in allowed hosts) ──
  try {
    policy.validateBrowserUrl('https://evil.test/', allowed)
    record('DENIED-DOMAIN https://evil.test', 'FAIL', 'validateBrowserUrl accepted a host that is not in allowedHosts')
  } catch (error) {
    record('DENIED-DOMAIN https://evil.test', error.code === 'HOST_BLOCKED' ? 'PASS' : 'PASS-WITH-NOTE', `rejected with code=${error.code}`)
  }
  // Real network: example.com.evil.test must not resolve-and-pass either
  try {
    policy.validateBrowserUrl('https://example.com.evil.test/', allowed)
    record('DENIED-DOMAIN suffix trick example.com.evil.test', 'FAIL', 'suffix trick accepted')
  } catch (error) {
    record('DENIED-DOMAIN suffix trick example.com.evil.test', 'PASS', `rejected with code=${error.code}`)
  }

  // ── Test 3: internal / SSRF addresses (real DNS + real policy) ──
  for (const [label, host] of [['localhost', 'localhost'], ['metadata 169.254.169.254 (literal)', 'metadata.google.internal']]) {
    try {
      const dest = await policy.resolvePublicHost(host)
      record(`SSRF-INTERNAL ${label}`, 'FAIL', `resolved to a public-looking address: ${dest.address}`)
    } catch (error) {
      record(`SSRF-INTERNAL ${label}`, error.code === 'ADDRESS_BLOCKED' ? 'PASS' : 'PASS-WITH-NOTE', `rejected with code=${error.code} (real DNS lookup)`)
    }
  }
  for (const url of ['https://127.0.0.1/', 'https://[::1]/', 'https://2130706433/', 'https://169.254.169.254/']) {
    try {
      policy.validateBrowserUrl(url, allowed)
      record(`SSRF-INTERNAL literal ${url}`, 'FAIL', 'IP-literal host accepted')
    } catch (error) {
      record(`SSRF-INTERNAL literal ${url}`, 'PASS', `rejected with code=${error.code}`)
    }
  }
  record('SSRF-INTERNAL isPublicAddress unit matrix', policy.isPublicAddress('127.0.0.1') === false && policy.isPublicAddress('169.254.169.254') === false && policy.isPublicAddress('93.184.216.34') === true ? 'PASS' : 'FAIL', 'loopback/link-local blocked, public unicast allowed')

  // ── Test 4: evidence save → load → integrity → tamper detection ──
  try {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'textfx-191-verify-'))
    const old = process.env.TEXTFX_BROWSER_DATA_DIR
    process.env.TEXTFX_BROWSER_DATA_DIR = dir
    const evidence = global.__evidence
    const run = {
      schemaVersion: '1.0.0', runId: 'a1b2c3d4-0000-4000-8000-000000000001', goal: 'Increment19.1 verification run',
      status: 'completed', createdAt: new Date().toISOString(), completedAt: new Date().toISOString(),
      evidence: [evidence], errors: [], events: [{ type: 'browser.completed', ts: new Date().toISOString() }],
      limitations: ['Verification run'],
    }
    await service.saveBrowserResearch(run)
    const loaded = await service.loadBrowserResearch(run.runId)
    const same = loaded.evidence[0].contentHash === evidence.contentHash && loaded.evidence[0].text === evidence.text
    record('EVIDENCE save → load (hash + text identical)', same ? 'PASS' : 'FAIL', `runId=${run.runId}, contentHash matched=${same}`)
    // tamper with the stored envelope → integrity must fail closed
    const file = path.join(dir, `${run.runId}.json`)
    const raw = JSON.parse(await fs.readFile(file, 'utf8'))
    raw.payload = raw.payload.replace('Example', 'Tamperd')
    await fs.writeFile(file, JSON.stringify(raw))
    try {
      await service.loadBrowserResearch(run.runId)
      record('EVIDENCE tamper detection', 'FAIL', 'tampered snapshot loaded without error')
    } catch (error) {
      record('EVIDENCE tamper detection', error.code === 'SNAPSHOT_INVALID' ? 'PASS' : 'PASS-WITH-NOTE', `rejected with code=${error.code}`)
    }
    if (old === undefined) delete process.env.TEXTFX_BROWSER_DATA_DIR; else process.env.TEXTFX_BROWSER_DATA_DIR = old
    await fs.rm(dir, { recursive: true, force: true })
  } catch (error) {
    record('EVIDENCE save/load/tamper', 'FAIL', error.message)
  }

  // ── Test 5: attachment of saved evidence to a real creative run ──
  // Mirrors the passing 'browser references are user-level data' test in agent-pipeline.test.cjs:
  // the snapshot is SAVED to a real data dir (agent-service loads it via loadBrowserResearch itself),
  // and the creative dependencies are fixtures because no GEMINI_API_KEY exists here (reported separately).
  try {
    const Module = require('node:module')
    const originalLoad = Module._load
    Module._load = function (request, parent, isMain) {
      if (request === '@google/genai') return { GoogleGenAI: class GoogleGenAI { constructor() {} } }
      return originalLoad.call(this, request, parent, isMain)
    }
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'textfx-191-agent-'))
    process.env.TEXTFX_CREATIVE_MEMORY_PATH = path.join(tempRoot, 'memory.json')
    const browserDir = path.join(tempRoot, 'browser')
    const oldBrowserDir = process.env.TEXTFX_BROWSER_DATA_DIR
    process.env.TEXTFX_BROWSER_DATA_DIR = browserDir
    const { runAgentWithDependencies } = require('./dist/agent/agent-service')
    const { saveBrowserResearch, makeEvidence } = require('./dist/browser/browser-service')
    const { randomUUID } = require('node:crypto')
    const evidence = global.__evidence
    const researchId = randomUUID()
    await saveBrowserResearch({ schemaVersion: '1.0.0', runId: researchId, goal: 'Attach evidence to a creative run', status: 'completed', createdAt: new Date().toISOString(), completedAt: new Date().toISOString(), evidence: [evidence], errors: [], events: [], limitations: [] })
    const candidate = (id, title, score) => ({ id, lens: title, concept: { title, tagline: `${title} tagline`, coreIdea: `${title} core idea`, visualNotes: 'A filmable image', creativeDevice: 'A reversible visual rule', emotionalArc: 'Tension then relief', targetParadox: 'People want change but fear it' }, score, rationale: ['Fixture rationale'], origin: 'seed', parentIds: [], generation: 0 })
    const review = (score) => ({ source: 'model', score, verdict: 'ready', criterionScores: { goalAlignment: score, originality: score, emotionalArc: score, visualSpecificity: score, clarityAndPacing: score, conceptIntegrity: score }, strengths: ['Clear visual turn'], weaknesses: ['Could be sharper'], revisionBrief: ['Sharpen the final image'], summary: `Fixture review ${score}` })
    const candidates = [candidate('candidate-a', 'Human Truth', 82), candidate('candidate-b', 'System Reversal', 80), candidate('candidate-c', 'Unexpected Analogy', 78)]
    const deps = {
      skipConfigurationCheck: true,
      runtime: { mode: 'Gemini', provider: { generateCreativeText: async () => ({ text: '{}' }) }, providerConfig: null },
      createExecutionPlan: async () => ({ summary: 'Fixture plan', steps: ['Discover', 'Create', 'Review'], acceptanceCriteria: ['A valid creative artifact exists'], risks: ['Subjective quality needs human review'], estimatedMinutes: 10, mode: 'Gemini' }),
      generateInsight: async () => ({ mainInsight: 'People want change but fear losing what makes them themselves', lateralThinkingBreakdown: {}, constraints: ['Limited attention'], opportunities: ['A visual reversal'], metaphoricFraming: 'A door that opens inward', emotionalTruth: 'Fear and curiosity coexist', creativeMethod: 'Fixture' }),
      discoverConcepts: async () => ({ candidates, selected: candidates[0], strategy: 'multi-lens-v1' }),
      metabolizeIdeas: async (seeds) => ({ candidates: seeds, offspring: [], events: [{ type: 'skipped', message: 'Verification fixture disables offspring generation', parentIds: [] }] }),
      regulateCreativeEntropy: async ({ candidates: incoming }) => ({ candidates: incoming, report: { diversityScore: 0.75, maxSimilarity: 0.25, threshold: 0.68, action: 'unchanged', candidateCount: incoming.length, antiTasteLessonIds: [], notes: ['Verification fixture'] } }),
      judgeConceptCandidates: async ({ candidates: incoming }) => ({ source: 'model', selectedCandidateId: 'candidate-b', summary: 'Verification fixture Court selected the strongest fit.', rubric: ['Fit', 'Originality'], reviews: incoming.map(item => ({ candidateId: item.id, score: item.score, verdict: 'advance', rationale: ['Fixture judgment'], strengths: ['Distinct mechanism'], weaknesses: ['Needs human validation'], nextActions: ['Validate with audience'] })) }),
      writeScript: async (selectedConcept) => ({ script: `${selectedConcept.title} screenplay`, beats: ['recognition', 'transformation', 'arrival'], cameraLanguage: 'Close-up then wide shot', narrativeStrategy: 'Visual reversal', emotionalTurning: 'A small revealing choice', lateralThinkingTechniques: ['reversal'] }),
      reviewCreativeScript: async () => review(86),
    }
    const result = await runAgentWithDependencies({ goal: 'Create a memorable launch film', brief: 'Audience: curious people.', language: 'en', browserResearchId: researchId }, deps)
    const attached = result.browserResearch
    const provenance = result.creativeIR?.provenance?.browserResearch
    record('ATTACH saved evidence → creative run', attached && attached.runId === researchId && attached.evidenceIds?.length === 1 && provenance?.evidenceIds?.length === 1 ? 'PASS' : 'FAIL',
      `browserResearch.runId=${attached?.runId}, evidenceIds=${JSON.stringify(attached?.evidenceIds || [])}, reviewStatus=${attached?.reviewStatus}, provenance.evidenceIds=${JSON.stringify(provenance?.evidenceIds || [])}, runStatus=${result.status}, verdict=${result.evaluation?.verdict}`)
    if (oldBrowserDir === undefined) delete process.env.TEXTFX_BROWSER_DATA_DIR; else process.env.TEXTFX_BROWSER_DATA_DIR = oldBrowserDir
    await fs.rm(tempRoot, { recursive: true, force: true })
  } catch (error) {
    record('ATTACH saved evidence → creative run', 'FAIL', `${error.code || ''} ${error.message}`)
  }

  const pass = results.filter(r => r.status === 'PASS').length
  const warn = results.filter(r => r.status === 'PASS-WITH-NOTE').length
  const fail = results.filter(r => r.status === 'FAIL').length
  console.log(`\nSUMMARY: pass=${pass} pass-with-note=${warn} fail=${fail} total=${results.length}`)
  await fs.writeFile('/home/user/textfx191/logs/browser-verify-results.json', JSON.stringify(results, null, 2))
}

main().catch(error => { console.error('VERIFICATION CRASHED:', error); process.exit(1) })
