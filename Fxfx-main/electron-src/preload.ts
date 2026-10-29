/**
 * TextFX v5 — Electron Preload
 * contextIsolation: true | nodeIntegration: false | sandbox: true
 *
 * Exposes a minimal, whitelist-only bridge on window.fx
 */

import { contextBridge, ipcRenderer } from 'electron'

// ── Allowed IPC channels (renderer → main) ────────────────────────────────────
const ALLOWED_CHANNELS = new Set<string>([
  'fx:get-backend-info',
])

interface BackendInfo {
  port:            number
  certFingerprint: string
  protocol:        string
  host:            string
}

interface BackendRequest {
  requestId: string
  path: string
  method: 'GET' | 'POST' | 'DELETE'
  headers: Record<string, string>
  body?: string
}

// ── Exposed API ───────────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('fx', {
  /**
   * Returns { port, certFingerprint, protocol, host } for the local backend.
   * The renderer uses this to construct https://127.0.0.1:<port> requests and
   * optionally pin the TLS certificate.
   */
  getBackendInfo: (): Promise<BackendInfo> =>
    ipcRenderer.invoke('fx:get-backend-info'),

  backendFetch: (request: BackendRequest): Promise<{ status: number; headers: Record<string, string>; body: string }> =>
    ipcRenderer.invoke('fx:backend-fetch', request),

  cancelBackendFetch: (requestId: string): void =>
    ipcRenderer.send('fx:backend-cancel', requestId),

  /**
   * Generic IPC request router.
   * Only channels listed in ALLOWED_CHANNELS are permitted.
   */
  request: (channel: string, payload?: unknown): Promise<unknown> => {
    if (!ALLOWED_CHANNELS.has(channel)) {
      return Promise.reject(new Error(`IPC channel not permitted: ${channel}`))
    }
    return ipcRenderer.invoke(channel, payload)
  },
})

// ── TypeScript global augmentation (for renderer type safety) ─────────────────
// Add this to your renderer tsconfig/types:
//
// interface Window {
//   fx: {
//     getBackendInfo(): Promise<{ port: number; certFingerprint: string; protocol: string; host: string }>
//     request(channel: string, payload?: unknown): Promise<unknown>
//   }
// }
