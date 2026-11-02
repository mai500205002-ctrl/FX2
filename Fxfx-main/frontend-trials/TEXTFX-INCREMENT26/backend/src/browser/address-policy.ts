import ipaddr from 'ipaddr.js'

/**
 * Increment22 - single source of truth for address classification.
 *
 * The Increment19/20 implementation delegated to `ipaddr.range() === 'unicast'`.
 * Measurement in this session shows that rule DID already reject the tested
 * encapsulations (NAT64, 6to4, Teredo, v4-mapped) because ipaddr reports them as
 * non-unicast, so no bypass was proven against Increment20.
 *
 * What this module adds is precision rather than a closed hole: ipaddr collapses
 * those forms into an undifferentiated 'reserved'/uncast answer, which cannot name
 * what the literal actually points at. Decoding the embedded IPv4 means a refusal
 * can state `nat64` vs `metadata` vs `loopback`, and any future relaxation of the
 * public-only rule (for example an explicit private-network escape hatch) can never
 * treat `::ffff:169.254.169.254` as "some reserved block".
 */
export type AddressClass =
  | 'public'
  | 'loopback'
  | 'private'
  | 'link-local'
  | 'metadata'
  | 'carrier-grade-nat'
  | 'unique-local'
  | 'multicast'
  | 'unspecified'
  | 'reserved'
  | 'nat64'
  | 'six-to-four'
  | 'teredo'

/** Ranges that are never routable as a public destination. */
function classifyV4(o: number[]): AddressClass {
  const [a, b] = o
  if (a === 0) return 'unspecified'
  if (a === 10) return 'private'
  if (a === 127) return 'loopback'
  if (a === 100 && b >= 64 && b <= 127) return 'carrier-grade-nat'
  if (a === 169 && b === 254) return o[2] === 169 && o[3] === 254 ? 'metadata' : 'link-local'
  if (a === 172 && b >= 16 && b <= 31) return 'private'
  if (a === 192 && b === 168) return 'private'
  if (a === 192 && b === 0 && o[2] === 0) return 'reserved'
  if (a === 192 && b === 0 && o[2] === 2) return 'reserved'
  if (a === 198 && (b === 18 || b === 19)) return 'reserved'
  if (a === 198 && b === 51 && o[2] === 100) return 'reserved'
  if (a === 203 && b === 0 && o[2] === 113) return 'reserved'
  if (a === 192 && b === 88 && o[2] === 99) return 'reserved'
  if (a >= 224 && a <= 239) return 'multicast'
  if (a >= 240) return 'reserved'
  return 'public'
}

function v4FromHextets(hi: number, lo: number): number[] {
  return [hi >> 8, hi & 0xff, lo >> 8, lo & 0xff]
}

function classifyV6(parts: number[]): AddressClass {
  const allZero = parts.every(p => p === 0)
  if (allZero) return 'unspecified'
  if (parts.slice(0, 7).every(p => p === 0) && parts[7] === 1) return 'loopback'

  // ::ffff:0:0/96 - IPv4-mapped. Classify the embedded address, never the wrapper.
  if (parts.slice(0, 5).every(p => p === 0) && parts[5] === 0xffff) {
    return classifyV4(v4FromHextets(parts[6], parts[7]))
  }
  // 64:ff9b::/96 - NAT64. Maps to arbitrary IPv4 on a NAT64 gateway.
  if (parts[0] === 0x64 && parts[1] === 0xff9b && parts.slice(2, 6).every(p => p === 0)) return 'nat64'
  // 2002::/16 - 6to4. Embeds IPv4 in hextets 1-2.
  if (parts[0] === 0x2002) return 'six-to-four'
  // 2001::/32 - Teredo. Embeds the client IPv4 (obfuscated) and a relay address.
  if (parts[0] === 0x2001 && parts[1] === 0x0000) return 'teredo'
  if (parts[0] === 0x2001 && parts[1] === 0x0db8) return 'reserved'
  if (parts[0] === 0x0100 && parts.slice(1, 4).every(p => p === 0)) return 'reserved'
  if ((parts[0] & 0xfe00) === 0xfc00) return 'unique-local'
  if ((parts[0] & 0xffc0) === 0xfe80) return 'link-local'
  if ((parts[0] & 0xffc0) === 0xfec0) return 'reserved'
  if ((parts[0] & 0xff00) === 0xff00) return 'multicast'
  return 'public'
}

/** Classifies a literal IP. Returns null when the input is not a valid address. */
export function classifyAddress(ip: string): AddressClass | null {
  if (typeof ip !== 'string') return null
  const candidate = ip.trim().replace(/^\[/, '').replace(/\]$/, '')
  if (!candidate) return null
  const zone = candidate.indexOf('%')
  const bare = zone === -1 ? candidate : candidate.slice(0, zone)
  try {
    const parsed = ipaddr.parse(bare)
    if (parsed.kind() === 'ipv4') return classifyV4((parsed as ipaddr.IPv4).octets as number[])
    return classifyV6((parsed as ipaddr.IPv6).parts as number[])
  } catch {
    return null
  }
}

export function isPublicAddress(ip: string): boolean {
  return classifyAddress(ip) === 'public'
}

/**
 * Rejects textual IPv4 forms that some parsers accept but users cannot read:
 * decimal, hex, octal and zero-padded dotted forms. The WHATWG URL parser
 * normalises most of them, so this is a defence-in-depth check on the literal
 * that reaches the policy after parsing.
 */
export function looksLikeNonCanonicalIPv4(host: string): boolean {
  if (typeof host !== 'string' || host === '') return false
  if (/^\d+$/.test(host)) return true
  if (/^0x[0-9a-f]+$/i.test(host)) return true
  const dotted = host.split('.')
  if (dotted.length === 4 && dotted.every(part => /^\d+$/.test(part))) {
    return dotted.some(part => part.length > 1 && part.startsWith('0'))
  }
  return false
}
