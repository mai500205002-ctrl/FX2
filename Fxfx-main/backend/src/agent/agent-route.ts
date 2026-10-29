import express, { Request, Response } from 'express'
import {
  approveAgentRun,
  deleteAgentRun,
  executeConsequentialAction,
  getAgentRun,
  getAgentRunLifecycle,
  getAgentStatus,
  IdempotencyConflictError,
  listAgentAudit,
  listAgentRuns,
  runAgent,
  validateAgentRunApproval,
} from './agent-service'
import type { AgentRunRequest } from './types'
import { authorizeBrowser, BrowserError } from '../browser/browser-policy'
import { getCandidateArchive } from '../modules/candidate-archive'
import { GatewayBudgetExceededError } from '../gateway/llm-gateway'
import { authorizeApproverToken, policyCheck, redactText, sanitize, validateRunId } from '../utils/security'

const router = express.Router()

router.get('/status', (_req: Request, res: Response) => {
  res.json(getAgentStatus())
})

router.get('/runs', (_req: Request, res: Response) => {
  res.json({ runs: listAgentRuns() })
})

router.get('/runs/:runId', (req: Request, res: Response) => {
  if (!validateRunId(req.params.runId)) {
    return void res.status(400).json({ error: 'Invalid runId format' })
  }
  const run = getAgentRun(req.params.runId)
  if (!run) {
    return void res.status(404).json({ error: 'run not found' })
  }
  res.json({ run })
})

router.get('/runs/:runId/candidates', (req: Request, res: Response) => {
  if (!validateRunId(req.params.runId)) {
    return void res.status(400).json({ error: 'Invalid runId format' })
  }
  const candidates = getCandidateArchive(req.params.runId)
  if (!candidates.length) return void res.status(404).json({ error: 'candidate history not found' })
  res.json({ runId: req.params.runId, candidates })
})

router.get('/runs/:runId/events', (req: Request, res: Response) => {
  if (!validateRunId(req.params.runId)) {
    return void res.status(400).json({ error: 'Invalid runId format' })
  }
  const lifecycle = getAgentRunLifecycle(req.params.runId)
  if (!lifecycle) return void res.status(404).json({ error: 'run events not found' })
  res.json({ lifecycle })
})

router.get('/runs/:runId/approval', (req: Request, res: Response) => {
  if (!validateRunId(req.params.runId)) {
    return void res.status(400).json({ error: 'Invalid runId format' })
  }
  const run = getAgentRun(req.params.runId)
  if (!run) return void res.status(404).json({ error: 'run not found' })
  const policyVersion = typeof req.query.policyVersion === 'string' ? req.query.policyVersion : undefined
  const validation = validateAgentRunApproval(req.params.runId, policyVersion)
  res.json({
    runId: req.params.runId,
    approval: run.approval || null,
    approvalStatus: run.approvalStatus || 'unapproved',
    validation,
  })
})

router.post('/runs/:runId/approve', (req: Request, res: Response) => {
  if (!validateRunId(req.params.runId)) {
    return void res.status(400).json({ error: 'Invalid runId format' })
  }
  const auth = authorizeApproverToken(req)
  if (!auth.authorized) {
    return void res.status(401).json({ error: auth.reason || 'Unauthorized approver' })
  }
  const body = req.body || {}
  const approvedBy = typeof body.approvedBy === 'string' ? body.approvedBy.trim() : ''
  if (!approvedBy) {
    return void res.status(400).json({ error: 'approvedBy identity is required' })
  }
  const policyVersion = typeof body.policyVersion === 'string' && body.policyVersion.trim() ? body.policyVersion.trim() : undefined
  try {
    const approval = approveAgentRun(req.params.runId, approvedBy, policyVersion)
    res.json({ ok: true, approval })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Run not found')) return void res.status(404).json({ error: msg })
    res.status(400).json({ error: redactText(msg) })
  }
})

router.post('/runs/:runId/execute-action', (req: Request, res: Response) => {
  if (!validateRunId(req.params.runId)) {
    return void res.status(400).json({ error: 'Invalid runId format' })
  }
  const body = req.body || {}
  const action = typeof body.action === 'string' ? body.action.trim() : ''
  if (!action) {
    return void res.status(400).json({ error: 'action is required' })
  }
  const policyVersion = typeof body.policyVersion === 'string' && body.policyVersion.trim() ? body.policyVersion.trim() : undefined
  try {
    const result = executeConsequentialAction({ runId: req.params.runId, action, policyVersion })
    res.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Run not found')) return void res.status(404).json({ error: msg })
    if (msg.includes('blocked') || msg.includes('approval required')) {
      return void res.status(403).json({ error: redactText(msg) })
    }
    res.status(400).json({ error: redactText(msg) })
  }
})

router.delete('/runs/:runId', (req: Request, res: Response) => {
  if (!validateRunId(req.params.runId)) {
    return void res.status(400).json({ error: 'Invalid runId format' })
  }
  const deleted = deleteAgentRun(req.params.runId)
  if (!deleted) {
    return void res.status(404).json({ error: 'run not found' })
  }
  res.status(204).end()
})

router.get('/audit', (req: Request, res: Response) => {
  const limit = Math.max(1, Math.min(50, Number(req.query.limit || 20)))
  res.json({ audit: listAgentAudit(limit) })
})

router.post('/run', async (req: Request, res: Response) => {
  const body = (req.body || {}) as AgentRunRequest
  const goal = typeof body.goal === 'string' ? body.goal.trim() : ''
  const headerIdempotencyKey = req.header('idempotency-key')?.trim()
  if (body.idempotencyKey !== undefined && typeof body.idempotencyKey !== 'string') return void res.status(400).json({ error: 'idempotencyKey must be a string' })
  const bodyIdempotencyKey = body.idempotencyKey?.trim()
  if (headerIdempotencyKey && bodyIdempotencyKey && headerIdempotencyKey !== bodyIdempotencyKey) return void res.status(400).json({ error: 'Conflicting idempotency keys' })

  if (!goal) {
    return void res.status(400).json({ error: 'goal is required' })
  }
  if (goal.length > 2000) {
    return void res.status(400).json({ error: 'goal exceeds maximum length of 2000 characters' })
  }

  const sanGoal = sanitize(goal)
  if (!sanGoal.ok) return void res.status(400).json({ error: sanGoal.reason })
  const polGoal = policyCheck(goal)
  if (!polGoal.allowed) return void res.status(403).json({ error: `Policy blocked: ${polGoal.reason}` })

  if (body.brief !== undefined) {
    if (typeof body.brief !== 'string') return void res.status(400).json({ error: 'brief must be a string' })
    if (body.brief.length > 8000) return void res.status(400).json({ error: 'brief exceeds maximum length of 8000 characters' })
    const sanBrief = sanitize(body.brief)
    if (!sanBrief.ok) return void res.status(400).json({ error: sanBrief.reason })
    const polBrief = policyCheck(body.brief)
    if (!polBrief.allowed) return void res.status(403).json({ error: `Policy blocked: ${polBrief.reason}` })
  }

  if (body.archetype !== undefined && (typeof body.archetype !== 'string' || body.archetype.length > 100)) {
    return void res.status(400).json({ error: 'archetype must be a string of at most 100 characters' })
  }
  if (body.language !== undefined && (typeof body.language !== 'string' || body.language.length > 10)) {
    return void res.status(400).json({ error: 'language must be a string code of at most 10 characters' })
  }

  try {
    if (body.browserResearchId !== undefined) {
      authorizeBrowser(req.header('x-textfx-browser-token') || req.header('authorization'))
      if (typeof body.browserResearchId !== 'string') throw new BrowserError('INVALID_ID', 'Research ID must be a string.')
      if (body.tenantId || req.header('x-tenant-id')) throw new BrowserError('TENANT_UNSUPPORTED', 'Browser references are local single-user only.', 403)
    }
    const tenantId =
      (typeof body.tenantId === 'string' && body.tenantId.trim()) ||
      (typeof req.header('x-tenant-id') === 'string' && req.header('x-tenant-id')!.trim()) ||
      undefined

    const result = await runAgent({
      ...body,
      goal,
      idempotencyKey: headerIdempotencyKey || bodyIdempotencyKey,
      tenantId,
    })

    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agent failed'
    if (error instanceof GatewayBudgetExceededError || error instanceof IdempotencyConflictError) {
      res.status(error.status).json({ error: message, code: error.code })
      return
    }
    res.status(error instanceof BrowserError ? error.status : 500).json({ error: redactText(message) })
  }
})

export default router
