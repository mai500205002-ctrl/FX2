import express, { type Request, type Response, type NextFunction } from 'express'
import { authorizeBrowser, BrowserError, getBrowserPolicy } from './browser-policy'
import { BROWSER_LIMITS, deleteBrowserResearch, loadBrowserResearch, runBrowserResearch } from './browser-service'

const router = express.Router()
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
router.use((req: Request, res: Response, next: NextFunction) => {
  try { authorizeBrowser(req.header('x-textfx-browser-token') || req.header('authorization')); next() }
  catch (error) { sendError(res, error) }
})
function sendError(res: Response, error: unknown) {
  if (error instanceof BrowserError) return void res.status(error.status).json({ code: error.code, error: error.message })
  res.status(500).json({ code: 'BROWSER_ERROR', error: 'Browser operation failed.' })
}
router.get('/status', (_req, res) => res.json({ enabled: true, mode: 'read-only', allowedHosts: getBrowserPolicy().allowedHosts, limits: BROWSER_LIMITS, llmCalls: 0, multiTenantReady: false }))
router.post('/research', async (req, res) => {
  try { res.status(201).json({ research: await runBrowserResearch(req.body, getBrowserPolicy()) }) }
  catch (error) { sendError(res, error) }
})
router.get('/runs/:runId', async (req, res) => {
  try { res.json({ research: await loadBrowserResearch(req.params.runId) }) }
  catch (error) { sendError(res, error) }
})
router.delete('/runs/:runId', async (req, res) => {
  try { await deleteBrowserResearch(req.params.runId); res.status(204).end() }
  catch (error) { sendError(res, error) }
})
export default router
