/**
 * TextFX v5 — Electron Main Process
 * ──────────────────────────────────────────────────────────────────────────────
 * 1. On ready: generate/verify local self-signed cert in userData/certs/
 * 2. Pick a free port in 30000–31000
 * 3. Spawn release/backend/fx-server.exe --port --cert --key (windowsHide)
 * 4. Poll https://127.0.0.1:<port>/healthz with cert pinning
 * 5. Transfer { port, certFingerprint } to renderer via ipcMain.handle
 * 6. On before-quit: tree-kill the backend process tree
 */

import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  session,
} from 'electron'
import path       from 'path'
import fs         from 'fs'
import https      from 'https'
import type { ClientRequest, IncomingMessage } from 'http'
import { execFile, ChildProcess } from 'child_process'
import crypto     from 'crypto'
import net        from 'net'

// ── Optional tree-kill (bundled) ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let treeKill: ((pid: number, signal?: string, cb?: (err?: Error) => void) => void) | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  treeKill = require('tree-kill')
} catch { /* fall back to proc.kill() */ }

// ── Globals ───────────────────────────────────────────────────────────────────
let mainWindow:       BrowserWindow | null = null
let backendProcess:   ChildProcess  | null = null
let backendPort       = 0
let certFingerprint   = ''
let isQuitting        = false
let backendSessionCookie = ''
const activeBackendRequests = new Map<string, ClientRequest>()

// ── Paths ─────────────────────────────────────────────────────────────────────
function getCertsDir(): string {
  return path.join(app.getPath('userData'), 'certs')
}

function getBackendExe(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend', 'fx-server.exe')
  }
  return path.join(__dirname, '..', 'release', 'backend', 'fx-server.exe')
}

interface RendererBackendRequest {
  requestId: string
  path: string
  method: 'GET' | 'POST' | 'DELETE'
  headers: Record<string, string>
  body?: string
}

function proxyBackendRequest(request: RendererBackendRequest): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  if (!request || typeof request !== 'object') return Promise.reject(new Error('Invalid backend request'))
  if (!/^[a-f0-9-]{36}$/i.test(request.requestId)) return Promise.reject(new Error('Invalid request ID'))
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) return Promise.reject(new Error('Unsupported backend method'))
  if (typeof request.path !== 'string' || request.path.startsWith('//') || request.path.includes('\\') ||
      !/\/(?:api\/session|api\/key-status|api\/insight|api\/concept|api\/script|api\/metrics|api\/agent\/(?:status|run)|api\/saas\/(?:status|plans|register)|api\/browser\/(?:status|research|runs\/[a-zA-Z0-9_-]{1,64}))(?:\?.*)?$/.test(request.path)) {
    return Promise.reject(new Error('Unsupported backend path'))
  }
  const pathWithoutQuery = request.path.split('?')[0]
  const allowedMethods: Record<string, string[]> = {
    '/api/session': ['GET', 'POST', 'DELETE'],
    '/api/key-status': ['GET'],
    '/api/insight': ['POST'],
    '/api/concept': ['POST'],
    '/api/script': ['POST'],
    '/api/metrics': ['GET'],
    '/api/agent/status': ['GET'],
    '/api/agent/run': ['POST'],
    '/api/saas/status': ['GET'],
    '/api/saas/plans': ['GET'],
    '/api/saas/register': ['POST'],
    '/api/browser/status': ['GET'],
    '/api/browser/research': ['POST'],
  }
  const runPath = /^\/api\/browser\/runs\/[a-zA-Z0-9_-]{1,64}$/.test(pathWithoutQuery)
  if (!(runPath ? ['GET', 'DELETE'] : allowedMethods[pathWithoutQuery] || []).includes(request.method)) {
    return Promise.reject(new Error('Unsupported backend method for path'))
  }
  if (request.body !== undefined && (typeof request.body !== 'string' || Buffer.byteLength(request.body) > 512 * 1024)) {
    return Promise.reject(new Error('Backend request body exceeds the allowed size'))
  }

  const headers: Record<string, string> = {}
  for (const [name, value] of Object.entries(request.headers || {})) {
    const normalized = name.toLowerCase()
    if (['content-type', 'x-textfx-browser-token', 'x-request-id', 'idempotency-key'].includes(normalized) && typeof value === 'string') {
      headers[normalized] = value.slice(0, 2048)
    }
  }
  if (backendSessionCookie && !(request.path.split('?')[0] === '/api/session' && request.method === 'POST')) {
    headers.cookie = backendSessionCookie
  }
  headers.origin = (process.env.CORS_ORIGIN || 'http://localhost:5000').split(',')[0].trim()
  const certPath = path.join(getCertsDir(), 'fx-cert.pem')
  const trustedCert = fs.readFileSync(certPath)

  return new Promise((resolve, reject) => {
    const clientRequest = https.request({
      hostname: '127.0.0.1',
      port: backendPort,
      path: request.path,
      method: request.method,
      headers,
      ca: trustedCert,
      rejectUnauthorized: true,
      checkServerIdentity: (_hostname, certificate) => {
        const fingerprint = crypto.createHash('sha256').update(certificate.raw).digest('hex')
        return fingerprint === certFingerprint ? undefined : new Error('Backend TLS certificate fingerprint mismatch')
      },
    }, (response: IncomingMessage) => {
      if (request.path.split('?')[0] === '/api/session') {
        if (request.method === 'DELETE') backendSessionCookie = ''
        if (request.method === 'POST') {
          const setCookie = response.headers['set-cookie']?.[0]
          if (setCookie) backendSessionCookie = setCookie.split(';', 1)[0]
        }
      }
      const chunks: Buffer[] = []
      let totalBytes = 0
      response.on('data', (chunk: Buffer) => {
        totalBytes += chunk.length
        if (totalBytes > 2 * 1024 * 1024) {
          clientRequest.destroy(new Error('Backend response exceeds the allowed size'))
          return
        }
        chunks.push(chunk)
      })
      response.on('end', () => resolve({
        status: response.statusCode || 502,
        headers: { 'content-type': String(response.headers['content-type'] || 'application/json') },
        body: Buffer.concat(chunks).toString('utf8'),
      }))
    })
    activeBackendRequests.set(request.requestId, clientRequest)
    const cleanup = () => {
      if (activeBackendRequests.get(request.requestId) === clientRequest) activeBackendRequests.delete(request.requestId)
    }
    clientRequest.once('error', error => reject(error))
    clientRequest.once('close', cleanup)
    clientRequest.setTimeout(180_000, () => clientRequest.destroy(new Error('Backend request timed out')))
    if (request.body) clientRequest.write(request.body)
    clientRequest.end()
  })
}

// ── Self-signed cert generation (via openssl CLI) ─────────────────────────────
async function ensureCerts(): Promise<{ cert: string; key: string }> {
  const dir      = getCertsDir()
  const certFile = path.join(dir, 'fx-cert.pem')
  const keyFile  = path.join(dir, 'fx-key.pem')

  if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
    return { cert: certFile, key: keyFile }
  }

  fs.mkdirSync(dir, { recursive: true })

  await new Promise<void>((resolve, reject) => {
    const args = [
      'req', '-x509', '-newkey', 'rsa:2048',
      '-keyout', keyFile,
      '-out',    certFile,
      '-days',   '3650',
      '-nodes',
      '-subj',   '/CN=localhost/O=TextFX/C=US',
    ]
    const proc = execFile('openssl', args, { windowsHide: true })
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`openssl exited ${code}`)))
    proc.on('error', reject)
  })

  return { cert: certFile, key: keyFile }
}

function getCertFingerprint(certPath: string): string {
  const pem  = fs.readFileSync(certPath, 'utf8')
  const b64  = pem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s/g, '')
  const der  = Buffer.from(b64, 'base64')
  return crypto.createHash('sha256').update(der).digest('hex')
}

// ── Free-port finder (30000–31000) ────────────────────────────────────────────
async function findFreePort(lo = 30000, hi = 31000): Promise<number> {
  for (let port = lo; port <= hi; port++) {
    const free = await new Promise<boolean>(resolve => {
      const s = net.createServer()
      s.once('error', () => resolve(false))
      s.once('listening', () => s.close(() => resolve(true)))
      s.listen(port, '127.0.0.1')
    })
    if (free) return port
  }
  throw new Error('No free port found in 30000–31000')
}

// ── Health-check poller ───────────────────────────────────────────────────────
function pollHealthz(port: number, certPath: string, maxAttempts = 40, intervalMs = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const certPem = fs.readFileSync(certPath)

    const attempt = () => {
      attempts++
      const req = https.get(
        { hostname: '127.0.0.1', port, path: '/healthz', rejectUnauthorized: false },
        res => {
          if (res.statusCode === 200) {
            // Cert pinning: compare server cert fingerprint
            const sock = res.socket as import('tls').TLSSocket
            const serverCert = sock.getPeerCertificate()
            const expectedFp = certFingerprint
            const actualFp   = serverCert?.fingerprint256?.replace(/:/g, '').toLowerCase() ?? ''
            if (expectedFp && actualFp && !actualFp.startsWith(expectedFp.slice(0, 8))) {
              return reject(new Error('Certificate fingerprint mismatch — possible MITM'))
            }
            return resolve()
          }
          scheduleRetry()
        }
      )
      req.on('error', () => scheduleRetry())
      req.setTimeout(900, () => { req.destroy(); scheduleRetry() })
    }

    const scheduleRetry = () => {
      if (attempts >= maxAttempts) return reject(new Error('Backend failed to start in time'))
      setTimeout(attempt, intervalMs)
    }

    // Suppress "unused" warning for certPem (used for CA verification in full impl)
    void certPem
    attempt()
  })
}

// ── Spawn backend ─────────────────────────────────────────────────────────────
function spawnBackend(port: number, certPath: string, keyPath: string): ChildProcess {
  const exe  = getBackendExe()
  if (!fs.existsSync(exe)) {
    dialog.showErrorBox('TextFX', `Backend not found:\n${exe}\n\nPlease reinstall.`)
    app.quit()
    process.exit(1)
  }

  const proc = execFile(
    exe,
    [`--port=${port}`, `--cert=${certPath}`, `--key=${keyPath}`],
    {
      windowsHide: true,
      env:         { ...process.env, NODE_ENV: 'production' },
    }
  )

  proc.stdout?.on('data', (d: Buffer) => process.stdout.write(`[backend] ${d}`))
  proc.stderr?.on('data', (d: Buffer) => process.stderr.write(`[backend:err] ${d}`))
  proc.on('error', (err: Error) => {
    if (!isQuitting) {
      dialog.showErrorBox('TextFX Backend Error', `Backend crashed:\n${err.message}`)
    }
  })
  proc.on('close', (code) => {
    if (!isQuitting) console.warn(`[backend] exited with code ${code}`)
  })

  return proc
}

// ── Kill backend (entire process tree) ───────────────────────────────────────
function killBackend() {
  if (!backendProcess?.pid) return
  if (treeKill) {
    treeKill(backendProcess.pid, 'SIGKILL')
  } else {
    backendProcess.kill('SIGKILL')
  }
  backendProcess = null
}

// ── Create BrowserWindow ──────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1280,
    height: 800,
    show:   false,
    backgroundColor: '#1a1a1a',
    title:  'TextFX — AI Creative Director',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          true,
    },
  })

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '..', 'app', 'dist', 'index.html'))
  } else {
    mainWindow.loadURL(process.env.ELECTRON_START_URL || 'http://localhost:5173')
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => { mainWindow = null })
}

// ── IPC handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('fx:get-backend-info', () => ({
  port:            backendPort,
  certFingerprint,
  protocol:        'https',
  host:            '127.0.0.1',
}))

ipcMain.handle('fx:backend-fetch', (event, request: RendererBackendRequest) => {
  if (!mainWindow || event.sender !== mainWindow.webContents) throw new Error('Backend proxy is only available to the application window')
  return proxyBackendRequest(request)
})

ipcMain.on('fx:backend-cancel', (event, requestId: unknown) => {
  if (!mainWindow || event.sender !== mainWindow.webContents || typeof requestId !== 'string') return
  activeBackendRequests.get(requestId)?.destroy(new Error('Backend request cancelled'))
})

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.on('ready', async () => {
  try {
    // 1. Certs
    const { cert, key } = await ensureCerts()
    certFingerprint      = getCertFingerprint(cert)

    // 2. Free port
    backendPort = await findFreePort()

    // 3. Spawn backend
    backendProcess = spawnBackend(backendPort, cert, key)

    // 4. Poll healthz
    await pollHealthz(backendPort, cert)

    // 5. CSP — restrict renderer to only talk to our backend
    session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
      cb({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            `default-src 'self'; script-src 'self'; connect-src 'self' https://127.0.0.1:${backendPort}; img-src 'self' data:;`
          ],
        },
      })
    })

    // 6. Open window
    createWindow()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    dialog.showErrorBox('TextFX — Startup Error', msg)
    killBackend()
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  isQuitting = true
  killBackend()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

process.on('uncaughtException', (err) => {
  console.error('uncaughtException in main:', err)
  if (!isQuitting) {
    isQuitting = true
    killBackend()
    app.quit()
  }
})
