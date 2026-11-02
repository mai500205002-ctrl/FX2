import type { FxService } from './contract'
import { createBackendService } from './backend-service'
import { createMockService } from './mock-service'

export * from './contract'

/**
 * Live by default: talks to the real TextFX backend through the `/fx-api` rewrite.
 * Set `NEXT_PUBLIC_FX_MODE=mock` for the offline in-browser demo.
 */
export const isMockService = process.env.NEXT_PUBLIC_FX_MODE === 'mock'

let instance: FxService | null = null
export function getFxService(): FxService {
  if (!instance) instance = isMockService ? createMockService() : createBackendService()
  return instance
}
