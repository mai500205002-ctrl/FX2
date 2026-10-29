"use strict";
/**
 * TextFX v5 — Electron Preload
 * contextIsolation: true | nodeIntegration: false | sandbox: true
 *
 * Exposes a minimal, whitelist-only bridge on window.fx
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// ── Allowed IPC channels (renderer → main) ────────────────────────────────────
const ALLOWED_CHANNELS = new Set([
    'fx:get-backend-info',
]);
// ── Exposed API ───────────────────────────────────────────────────────────────
electron_1.contextBridge.exposeInMainWorld('fx', {
    /**
     * Returns { port, certFingerprint, protocol, host } for the local backend.
     * The renderer uses this to construct https://127.0.0.1:<port> requests and
     * optionally pin the TLS certificate.
     */
    getBackendInfo: () => electron_1.ipcRenderer.invoke('fx:get-backend-info'),
    /**
     * Generic IPC request router.
     * Only channels listed in ALLOWED_CHANNELS are permitted.
     */
    request: (channel, payload) => {
        if (!ALLOWED_CHANNELS.has(channel)) {
            return Promise.reject(new Error(`IPC channel not permitted: ${channel}`));
        }
        return electron_1.ipcRenderer.invoke(channel, payload);
    },
});
// ── TypeScript global augmentation (for renderer type safety) ─────────────────
// Add this to your renderer tsconfig/types:
//
// interface Window {
//   fx: {
//     getBackendInfo(): Promise<{ port: number; certFingerprint: string; protocol: string; host: string }>
//     request(channel: string, payload?: unknown): Promise<unknown>
//   }
// }
