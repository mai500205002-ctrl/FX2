import {
  applyRefinement,
  buildIdeas,
  buildReplacementIdea,
  buildScript,
  buildStrategy,
  estimateTokens,
} from '../mock-content'
import type { FxService, RequestOptions } from './contract'
import { progressSteps } from './contract'

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

async function simulateSteps(stepCount: number, opts: RequestOptions | undefined, perStep = 900) {
  for (let i = 0; i < stepCount; i++) {
    opts?.onProgress?.(i)
    await wait(perStep + Math.random() * 400, opts?.signal)
  }
}

/** In-browser stand-in for the FX backend. Latency and progress mimic real generation. */
export function createMockService(): FxService {
  return {
    async generateStrategy(req, opts) {
      await simulateSteps(progressSteps.strategy.length, opts)
      const data = buildStrategy(req.brief, req.locale)
      return { data, usage: { tokens: estimateTokens(req.brief, data) } }
    },

    async generateIdeas(req, opts) {
      await simulateSteps(progressSteps.ideas.length, opts)
      const data = buildIdeas(req.brief, req.locale, req.engines, req.count)
      return { data, usage: { tokens: estimateTokens(req.strategy, data) } }
    },

    async regenerateIdea(req, opts) {
      await simulateSteps(progressSteps.regenerateIdea.length, opts, 700)
      const data = buildReplacementIdea(
        req.brief,
        req.locale,
        req.engines,
        req.excludeEngines,
        req.idea,
      )
      return { data, usage: { tokens: estimateTokens(req.strategy, data) } }
    },

    async refineIdea(req, opts) {
      await simulateSteps(progressSteps.refineIdea.length, opts, 700)
      const data = applyRefinement(req.idea, req.instruction, req.locale)
      return { data, usage: { tokens: estimateTokens(req.idea, req.instruction) } }
    },

    async generateScript(req, opts) {
      await simulateSteps(progressSteps.script.length, opts, 1000)
      const data = buildScript(req.brief, req.idea, req.locale)
      return { data, usage: { tokens: estimateTokens(req.idea, data) } }
    },

    async saveProject(_project, opts) {
      await wait(450, opts?.signal)
      return { savedAt: new Date().toISOString() }
    },
  }
}
