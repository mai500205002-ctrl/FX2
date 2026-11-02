import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { timingSafeEqual } from 'node:crypto'
import ipaddr from 'ipaddr.js'

export class BrowserError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message) }
}

export interface BrowserPolicy {
  enabled: boolean
  allowedHosts: string[]
  token: string
}

export function getBrowserPolicy(): BrowserPolicy {
  return {
    enabled: process.env.TEXTFX_BROWSER_ENABLED === 'true',
    allowedHosts: (process.env.TEXTFX_BROWSER_ALLOWED_HOSTS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
    token: process.env.TEXTFX_BROWSER_TOKEN || '',
  }
}

export function authorizeBrowser(authorization: string | undefined, policy = getBrowserPolicy()): void {
  if (!policy.enabled || !policy.allowedHosts.length || policy.token.length < 32) {
    throw new BrowserError('BROWSER_DISABLED', 'Browser requires opt-in, exact allowed hosts and a token of at least 32 characters.', 503)
  }
  const actual = Buffer.from(authorization || '')
  const expected = Buffer.from(`Bearer ${policy.token}`)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new BrowserError('UNAUTHORIZED', 'Browser authorization required.', 401)
  }
}

export function validateBrowserUrl(value: unknown, allowedHosts: string[]): URL {
  if (typeof value !== 'string' || value.length > 2048) throw new BrowserError('INVALID_URL', 'Invalid URL.')
  let url: URL
  try { url = new URL(value) } catch { throw new BrowserError('INVALID_URL', 'Absolute HTTPS URL required.') }
  const host = url.hostname.toLowerCase()
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || isIP(host.replace(/^\[|\]$/g, ''))) {
    throw new BrowserError('URL_BLOCKED', 'Only credential-free HTTPS URLs on port 443 with domain hosts are allowed.')
  }
  if (!allowedHosts.includes(host) || host.endsWith('.') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new BrowserError('HOST_BLOCKED', 'Host is not explicitly allowed.')
  }
  // URL query strings often carry credentials; do not collect them in this first version.
  if (url.search) throw new BrowserError('QUERY_BLOCKED', 'Query parameters are disabled in Browser Agent v1.')
  url.hash = ''
  return url
}

export function isPublicAddress(address: string): boolean {
  try { return ipaddr.process(address).range() === 'unicast' } catch { return false }
}

export type ResolveHost = (host: string) => Promise<Array<{ address: string; family: number }>>
export async function resolvePublicHost(host: string, resolve: ResolveHost = h => lookup(h, { all: true })): Promise<{ address: string; family: number }> {
  const addresses = await resolve(host)
  if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) {
    throw new BrowserError('ADDRESS_BLOCKED', 'Host resolves to a non-public destination.')
  }
  return addresses[0]
}

export function parseBrowserRequest(value: unknown, allowedHosts: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BrowserError('INVALID_REQUEST', 'Request must be an object.')
  const input = value as Record<string, unknown>
  if (Object.keys(input).some(key => !['goal', 'urls'].includes(key))) throw new BrowserError('INVALID_REQUEST', 'Only goal and urls are supported; browser actions are not accepted.')
  if (typeof input.goal !== 'string' || !input.goal.trim() || input.goal.length > 1000) throw new BrowserError('INVALID_GOAL', 'A goal of 1–1000 characters is required.')
  if (!Array.isArray(input.urls) || input.urls.length < 1 || input.urls.length > 3) throw new BrowserError('INVALID_URLS', 'Provide 1–3 URLs.')
  return { goal: input.goal.trim(), urls: [...new Set(input.urls.map(url => validateBrowserUrl(url, allowedHosts).href))] }
}
