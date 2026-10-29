import type { NextFunction, Request, Response } from 'express'
import { redactText } from '../browser/redact'
import { hasApiSession, isTrustedApiOrigin } from './api-session'

// Prompt injection and harmful script regexes
const DENY_RE = [
  /ignore previous instructions/i,
  /ignore all previous instructions/i,
  /system:\s*you are/i,
  /\bprompt injection\b/i,
  /<script[\s>]/i,
  /javascript:/i,
]

export function sanitize(s: string): { ok: boolean; reason?: string } {
  if (!s || typeof s !== 'string') return { ok: false, reason: 'empty input' }
  if (s.length > 8_000) return { ok: false, reason: 'input too long' }
  for (const re of DENY_RE) {
    if (re.test(s)) return { ok: false, reason: 'sanitizer: injection pattern detected' }
  }
  return { ok: true }
}

const POLICY_BLOCK = ['bomb', 'weapon', 'malware', 'exploit', 'ransomware', 'ddos']

export function policyCheck(s: string): { allowed: boolean; reason?: string } {
  if (!s || typeof s !== 'string') return { allowed: true }
  const lower = s.toLowerCase()
  for (const w of POLICY_BLOCK) {
    if (lower.includes(w)) return { allowed: false, reason: `blocked term: ${w}` }
  }
  return { allowed: true }
}

export function validateRunId(runId: unknown): boolean {
  if (typeof runId !== 'string') return false
  return /^[a-zA-Z0-9_-]{1,64}$/.test(runId)
}

export function authenticateApi(req: Request): boolean {
  const apiKey = process.env.TEXTFX_API_KEY?.trim()
  if (!apiKey) return true // Default loopback/dev mode when no TEXTFX_API_KEY configured
  const authHeader = req.header('authorization')?.trim()
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader
  return token === apiKey
}

export function apiAuthenticationMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (
    req.path === '/health' || req.path === '/healthz' || req.path === '/key-status' ||
    req.path === '/session' || req.path === '/browser' || req.path.startsWith('/browser/')
  ) return next()
  if (authenticateApi(req)) return next()
  if (hasApiSession(req)) {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !isTrustedApiOrigin(req)) {
      res.status(403).json({ error: 'Request origin is not allowed' })
      return
    }
    return next()
  }
  res.status(401).json({ error: 'Unauthorized: valid API key required' })
}

export function authorizeApproverToken(req: Request): { authorized: boolean; reason?: string } {
  const approverToken = process.env.TEXTFX_APPROVER_TOKEN?.trim() || process.env.TEXTFX_ADMIN_TOKEN?.trim()
  const apiKey = process.env.TEXTFX_API_KEY?.trim()
  const requiredToken = approverToken || apiKey
  if (!requiredToken) {
    return { authorized: false, reason: 'Approver authentication not configured on server (TEXTFX_APPROVER_TOKEN required).' }
  }
  const authHeader = req.header('authorization')?.trim()
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader
  if (!token || token !== requiredToken) {
    return { authorized: false, reason: 'Unauthorized approver credentials.' }
  }
  return { authorized: true }
}

export { redactText }
