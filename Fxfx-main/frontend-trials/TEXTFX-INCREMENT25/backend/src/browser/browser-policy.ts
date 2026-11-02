import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { timingSafeEqual } from 'node:crypto'
import { classifyAddress, isPublicAddress as classifyIsPublic, looksLikeNonCanonicalIPv4 } from './address-policy'
import { redactText, redactUrl } from './redact'

export class BrowserError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    // Every message can reach an HTTP response, a log or a stored snapshot.
    super(redactText(message))
  }
}

export interface BrowserPolicy {
  enabled: boolean
  allowedHosts: string[]
  token: string
}

export function getBrowserPolicy(): BrowserPolicy {
  return {
    enabled: process.env.TEXTFX_BROWSER_ENABLED === 'true',
    allowedHosts: (process.env.TEXTFX_BROWSER_ALLOWED_HOSTS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean),
    token: process.env.TEXTFX_BROWSER_TOKEN || '',
  }
}

export function authorizeBrowser(authorization: string | undefined, policy = getBrowserPolicy()): void {
  if (!policy.enabled || !policy.allowedHosts.length || policy.token.length < 32) {
    throw new BrowserError(
      'BROWSER_DISABLED',
      'Browser requires opt-in, exact allowed hosts and a token of at least 32 characters.',
      503,
    )
  }
  const actual = Buffer.from(authorization || '')
  const expected = Buffer.from(`Bearer ${policy.token}`)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new BrowserError('UNAUTHORIZED', 'Browser authorization required.', 401)
  }
}

/**
 * Destination policy. Every rejection names the rule it enforced so a failed
 * navigation is auditable rather than a generic refusal.
 */
export function validateBrowserUrl(value: unknown, allowedHosts: string[]): URL {
  if (typeof value !== 'string' || value.length > 2048) {
    throw new BrowserError('INVALID_URL', 'Invalid URL.')
  }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new BrowserError('INVALID_URL', `Absolute HTTPS URL required: ${redactUrl(value)}`)
  }
  const host = url.hostname.toLowerCase()
  if (url.protocol !== 'https:') {
    throw new BrowserError('URL_BLOCKED', 'Only HTTPS destinations are allowed.')
  }
  if (url.username || url.password) {
    throw new BrowserError('CREDENTIALS_IN_URL', 'Credentials embedded in the URL are not allowed.')
  }
  if (url.port && url.port !== '443') {
    throw new BrowserError('PORT_BLOCKED', 'Only port 443 is allowed.')
  }
  if (looksLikeNonCanonicalIPv4(host.replace(/^\[|\]$/g, ''))) {
    throw new BrowserError('NON_CANONICAL_IP', 'Non-canonical address literal rejected.')
  }
  if (isIP(host.replace(/^\[|\]$/g, ''))) {
    throw new BrowserError('URL_BLOCKED', 'Address literals are not allowed; use a hostname.')
  }
  if (!allowedHosts.includes(host)) {
    throw new BrowserError('HOST_BLOCKED', 'Host is not explicitly allowed.')
  }
  if (host.endsWith('.') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new BrowserError('HOST_BLOCKED', 'Local hostnames are not allowed.')
  }
  // URL query strings often carry credentials; do not collect them in this first version.
  if (url.search) throw new BrowserError('QUERY_BLOCKED', 'Query parameters are disabled in Browser Agent v1.')
  url.hash = ''
  return url
}

/**
 * Increment22: classification is delegated to address-policy, which decodes
 * IPv4-in-IPv6 encapsulations (NAT64, 6to4, Teredo) instead of trusting the
 * outer `unicast` range as Increment19/20 did.
 */
export function isPublicAddress(address: string): boolean {
  return classifyIsPublic(address)
}

export function classifyBrowserAddress(address: string) {
  return classifyAddress(address)
}

export type ResolveHost = (host: string) => Promise<Array<{ address: string; family: number }>>

export async function resolvePublicHost(
  host: string,
  resolve: ResolveHost = h => lookup(h, { all: true }),
): Promise<{ address: string; family: number }> {
  let addresses: Array<{ address: string; family: number }>
  try {
    addresses = await resolve(host)
  } catch {
    throw new BrowserError('DNS_RESOLUTION_FAILED', 'Host could not be resolved.')
  }
  if (!Array.isArray(addresses) || !addresses.length) {
    throw new BrowserError('ADDRESS_BLOCKED', 'Host resolves to no address.')
  }
  const blocked = addresses.filter(item => !isPublicAddress(item.address))
  if (blocked.length) {
    // A single blocked answer cancels the hop: mixed public/private answers are a
    // rebinding signal, not a preference to pick the public one.
    throw new BrowserError(
      'ADDRESS_BLOCKED',
      `Host resolves to a non-public destination (${blocked.map(b => `${b.address}:${classifyAddress(b.address) ?? 'unparsable'}`).join(', ')}).`,
      400,
    )
  }
  // The first validated address becomes the pinned destination for the connection.
  return addresses[0]
}

export function parseBrowserRequest(value: unknown, allowedHosts: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BrowserError('INVALID_REQUEST', 'Request must be an object.')
  }
  const input = value as Record<string, unknown>
  if (Object.keys(input).some(key => !['goal', 'urls'].includes(key))) {
    throw new BrowserError('INVALID_REQUEST', 'Only goal and urls are supported; browser actions are not accepted.')
  }
  if (typeof input.goal !== 'string' || !input.goal.trim() || input.goal.length > 1000) {
    throw new BrowserError('INVALID_GOAL', 'A goal of 1-1000 characters is required.')
  }
  if (!Array.isArray(input.urls) || input.urls.length < 1 || input.urls.length > 3) {
    throw new BrowserError('INVALID_URLS', 'Provide 1-3 URLs.')
  }
  return {
    goal: input.goal.trim(),
    urls: [...new Set(input.urls.map(url => validateBrowserUrl(url, allowedHosts).href))],
  }
}
