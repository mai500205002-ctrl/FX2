import express, { Request, Response } from 'express'
import { getAgentRun, getAgentStatus, listAgentAudit, listAgentRuns, runAgent } from './agent-service'
import type { AgentRunRequest } from './types'
import { authorizeBrowser, BrowserError } from '../browser/browser-policy'
import { getCandidateArchive } from '../modules/candidate-archive'

const router = express.Router()

router.get('/status', (_req: Request, res: Response) => {
  res.json(getAgentStatus())
})

router.get('/runs', (_req: Request, res: Response) => {
  res.json({ runs: listAgentRuns() })
})

router.get('/runs/:runId', (req: Request, res: Response) => {
  const run = getAgentRun(req.params.runId)
  if (!run) {
    return void res.status(404).json({ error: 'run not found' })
  }
  res.json({ run })
})

router.get('/runs/:runId/candidates', (req: Request, res: Response) => {
  const candidates = getCandidateArchive(req.params.runId)
  if (!candidates.length) return void res.status(404).json({ error: 'candidate history not found' })
  res.json({ runId: req.params.runId, candidates })
})

router.get('/audit', (req: Request, res: Response) => {
  const limit = Math.max(1, Math.min(50, Number(req.query.limit || 20)))
  res.json({ audit: listAgentAudit(limit) })
})

router.post('/run', async (req: Request, res: Response) => {
  const body = (req.body || {}) as AgentRunRequest
  const goal = typeof body.goal === 'string' ? body.goal.trim() : ''

  if (!goal) {
    return void res.status(400).json({ error: 'goal is required' })
  }

  try {
    if (body.browserResearchId !== undefined) {
      authorizeBrowser(req.header('authorization'))
      if (typeof body.browserResearchId !== 'string') throw new BrowserError('INVALID_ID', 'Research ID must be a string.')
      // Existing tenant IDs are caller-provided, not an authenticated security boundary.
      if (body.tenantId || req.header('x-tenant-id')) throw new BrowserError('TENANT_UNSUPPORTED', 'Browser references are local single-user only.', 403)
    }
    const tenantId =
      (typeof body.tenantId === 'string' && body.tenantId.trim()) ||
      (typeof req.header('x-tenant-id') === 'string' && req.header('x-tenant-id')!.trim()) ||
      undefined

    const result = await runAgent({
      ...body,
      goal,
      tenantId,
    })

    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agent failed'
    res.status(error instanceof BrowserError ? error.status : 500).json({ error: message })
  }
})

export default router
