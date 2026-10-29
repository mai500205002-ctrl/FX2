import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'
import type { Request, Response } from 'express'

const SESSION_COOKIE = 'textfx_session'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000
const MAX_SESSIONS = 1_000
const sessions = new Map<string, number>()

function configuredOrigins(): Set<string> {
  return new Set((process.env.CORS_ORIGIN || 'http://localhost:5000')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
    .map(value => {
      try { return new URL(value).origin } catch { return '' }
    })
    .filter(Boolean))
}

export function isTrustedApiOrigin(req: Request): boolean {
  const origin = req.header('origin')
  if (!origin) return false
  try { return configuredOrigins().has(new URL(origin).origin) } catch { return false }
}

function sessionToken(req: Request): string | undefined {
  const cookie = req.header('cookie') || ''
  const value = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))
  if (!value) return undefined
  try { return decodeURIComponent(value.slice(SESSION_COOKIE.length + 1)) } catch { return undefined }
}

function validSession(req: Request): boolean {
  const token = sessionToken(req)
  const expiresAt = token ? sessions.get(token) : undefined
  if (!token || !expiresAt) return false
  if (expiresAt <= Date.now()) {
    sessions.delete(token)
    return false
  }
  return true
}

function secureRequest(req: Request): boolean {
  return req.secure
}

function safeSecretEqual(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest()
  const rightHash = createHash('sha256').update(right).digest()
  return timingSafeEqual(leftHash, rightHash)
}

function cookieValue(req: Request, token: string, maxAgeSeconds: number): string {
  const secure = secureRequest(req)
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/api; HttpOnly; SameSite=${secure ? 'None' : 'Strict'}; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`
}

export function getApiSessionStatus(req: Request): { authRequired: boolean; authenticated: boolean } {
  const authRequired = !!process.env.TEXTFX_API_KEY?.trim()
  const authorization = req.header('authorization')?.trim() || ''
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  const configuredKey = process.env.TEXTFX_API_KEY?.trim() || ''
  return {
    authRequired,
    authenticated: !authRequired || validSession(req) || (!!bearer && !!configuredKey && safeSecretEqual(bearer, configuredKey)),
  }
}

export function createApiSession(req: Request, res: Response, suppliedKey: unknown): boolean {
  const configuredKey = process.env.TEXTFX_API_KEY?.trim()
  if (!configuredKey || typeof suppliedKey !== 'string' || !isTrustedApiOrigin(req)) return false
  const origin = new URL(req.header('origin')!)
  const isLoopback = origin.hostname === 'localhost' || origin.hostname === '127.0.0.1' || origin.hostname === '[::1]'
  if (!isLoopback && !secureRequest(req)) return false
  if (!safeSecretEqual(suppliedKey, configuredKey)) return false

  const now = Date.now()
  for (const [token, expiresAt] of sessions) if (expiresAt <= now) sessions.delete(token)
  if (sessions.size >= MAX_SESSIONS) return false
  const token = randomBytes(32).toString('base64url')
  sessions.set(token, now + SESSION_TTL_MS)
  res.setHeader('Set-Cookie', cookieValue(req, token, SESSION_TTL_MS / 1000))
  return true
}

export function destroyApiSession(req: Request, res: Response): void {
  const token = sessionToken(req)
  if (token) sessions.delete(token)
  res.setHeader('Set-Cookie', cookieValue(req, '', 0))
}

export function hasApiSession(req: Request): boolean {
  return validSession(req)
}