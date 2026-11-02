/**
 * Increment22 - secret hygiene for browser errors, events and claim evidence.
 * The browser agent holds a bearer token and may surface upstream error text,
 * so every string that can reach a log, an HTTP response or a stored snapshot
 * is passed through redactText first.
 */
export const REDACTED = '[REDACTED]'

const SENSITIVE_WORDS = ['authorization', 'cookie', 'apikey', 'secret', 'token', 'password', 'credential', 'privatekey']
const SENSITIVE_KEY = /^(authorization|cookie|set-cookie|proxy-authorization|x-api-key|api[-_]?key|token|secret|password|client[-_]?secret)$/i

/**
 * Header/key names are compared on their normalised letters only, so prefixed
 * or suffixed variants (`x-client-secret`, `X-Api-Key`, `proxy_authorization`)
 * cannot slip a credential past the filter. Unknown names fail closed when they
 * contain a credential word.
 */
export function isSensitiveKey(key: string): boolean {
  const raw = String(key).trim()
  if (!raw) return false
  if (SENSITIVE_KEY.test(raw)) return true
  const normalised = raw.toLowerCase().replace(/[^a-z0-9]/g, '')
  return SENSITIVE_WORDS.some(word => normalised.includes(word))
}
const PATTERNS: Array<[RegExp, string]> = [
  [/Bearer\s+[A-Za-z0-9._~+/-]{8,}=*/gi, `Bearer ${REDACTED}`],
  [/\b(api[-_]?key|access[-_]?token|token|secret|password|sig|signature)=([^&\s"']+)/gi, `$1=${REDACTED}`],
  [/\b[A-Za-z0-9_-]{32,}\b/g, REDACTED],
  [/(https?:\/\/)([^\s/@:]+):([^\s/@]+)@/gi, `$1$2:${REDACTED}@`],
]


export function redactText(input: string): string {
  if (typeof input !== 'string' || input === '') return input
  let out = input
  for (const [pattern, replacement] of PATTERNS) out = out.replace(pattern, replacement as string)
  return out
}

export function redactUrl(raw: string): string {
  if (typeof raw !== 'string') return ''
  try {
    const url = new URL(raw)
    if (url.username || url.password) {
      url.username = url.username ? REDACTED : ''
      url.password = url.password ? REDACTED : ''
    }
    if (url.search) url.search = '?[QUERY REDACTED]'
    return redactText(url.toString())
  } catch {
    return redactText(raw)
  }
}

/** Masks values of sensitive headers. Used for diagnostics only. */
export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers || {})) {
    out[key] = isSensitiveKey(key) ? REDACTED : redactText(String(value))
  }
  return out
}

/** Removes credential-bearing headers entirely so a transport never sees them. */
export function stripSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers || {})) {
    if (!isSensitiveKey(key)) out[key] = value
  }
  return out
}

export function redactUnknown(value: unknown): unknown {
  if (typeof value === 'string') return redactText(value)
  if (Array.isArray(value)) return value.map(redactUnknown)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? REDACTED : redactUnknown(inner)
    }
    return out
  }
  return value
}
