import type { FxService, RequestOptions } from './contract'
import { FxServiceError, progressSteps } from './contract'

/**
 * Transport adapter for the existing FX backend.
 * Endpoints are expected to accept the request payloads defined in `contract.ts`
 * and respond with `{ data, usage: { tokens } }`.
 */
export function createHttpService(baseUrl: string): FxService {
  const root = baseUrl.replace(/\/$/, '')

  async function post<T>(
    path: string,
    body: unknown,
    opts: RequestOptions | undefined,
    stepCount: number,
  ): Promise<T> {
    opts?.onProgress?.(0)
    // Advance the visible progress while the request is in flight; the backend
    // does not stream intermediate steps yet.
    let step = 0
    const ticker =
      stepCount > 1
        ? setInterval(() => {
            step = Math.min(step + 1, stepCount - 1)
            opts?.onProgress?.(step)
          }, 1400)
        : undefined

    try {
      const res = await fetch(`${root}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
        signal: opts?.signal,
      })
      if (!res.ok) {
        throw new FxServiceError(`FX request failed: ${res.status}`, res.status)
      }
      return (await res.json()) as T
    } finally {
      if (ticker) clearInterval(ticker)
    }
  }

  return {
    generateStrategy: (req, opts) =>
      post('/strategy', req, opts, progressSteps.strategy.length),
    generateIdeas: (req, opts) => post('/ideas', req, opts, progressSteps.ideas.length),
    regenerateIdea: (req, opts) =>
      post('/ideas/regenerate', req, opts, progressSteps.regenerateIdea.length),
    refineIdea: (req, opts) =>
      post('/ideas/refine', req, opts, progressSteps.refineIdea.length),
    generateScript: (req, opts) => post('/script', req, opts, progressSteps.script.length),
    saveProject: (project, opts) =>
      post<{ savedAt: string }>(`/projects/${encodeURIComponent(project.id)}`, project, opts, 1),
  }
}
