import type { FxService } from './contract'
import { createHttpService } from './http-service'
import { createMockService } from './mock-service'

export * from './contract'

let instance: FxService | null = null

/**
 * Returns the active FX service. Set `NEXT_PUBLIC_FX_API_URL` to route all
 * generation and persistence through the existing FX backend; otherwise the
 * in-browser mock is used.
 */
export function getFxService(): FxService {
  if (!instance) {
    const baseUrl = process.env.NEXT_PUBLIC_FX_API_URL
    instance = baseUrl ? createHttpService(baseUrl) : createMockService()
  }
  return instance
}

export const isMockService = !process.env.NEXT_PUBLIC_FX_API_URL
