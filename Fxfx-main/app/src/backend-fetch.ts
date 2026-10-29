export interface ElectronBackendRequest {
  requestId: string
  path: string
  method: 'GET' | 'POST' | 'DELETE'
  headers: Record<string, string>
  body?: string
}

export interface ElectronBackendResponse {
  status: number
  headers: Record<string, string>
  body: string
}

declare global {
  interface Window {
    fx?: {
      getBackendInfo(): Promise<{ port: number; certFingerprint: string; protocol: string; host: string }>
      request(channel: string, payload?: unknown): Promise<unknown>
      backendFetch(request: ElectronBackendRequest): Promise<ElectronBackendResponse>
      cancelBackendFetch(requestId: string): void
    }
  }
}

function abortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError')
}

export async function backendFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  if (!window.fx?.backendFetch) {
    return fetch(input, { ...init, credentials: 'include' })
  }

  if (init.signal?.aborted) throw abortError()
  const inputUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const url = new URL(inputUrl, window.location.href)
  const method = (init.method || 'GET').toUpperCase()
  if (!['GET', 'POST', 'DELETE'].includes(method)) throw new Error('Unsupported backend method')
  if (init.body !== undefined && typeof init.body !== 'string') throw new Error('Electron backend requests require a string body')

  const requestId = crypto.randomUUID()
  const headers: Record<string, string> = {}
  new Headers(init.headers).forEach((value, name) => { headers[name] = value })
  const pending = window.fx.backendFetch({
    requestId,
    path: `${url.pathname}${url.search}`,
    method: method as ElectronBackendRequest['method'],
    headers,
    body: init.body as string | undefined,
  })
  const cancel = () => window.fx?.cancelBackendFetch(requestId)
  init.signal?.addEventListener('abort', cancel, { once: true })

  try {
    const result = await pending
    if (init.signal?.aborted) throw abortError()
    const body = [204, 205, 304].includes(result.status) ? null : result.body
    return new Response(body, { status: result.status, headers: result.headers })
  } catch (error) {
    if (init.signal?.aborted) throw abortError()
    throw error
  } finally {
    init.signal?.removeEventListener('abort', cancel)
  }
}