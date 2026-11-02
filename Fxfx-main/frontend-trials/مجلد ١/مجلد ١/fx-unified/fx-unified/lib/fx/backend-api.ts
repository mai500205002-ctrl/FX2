/**
 * Typed client for the real TextFX backend (Express, /api/*).
 * All calls go through the Next.js rewrite `/fx-api/* -> <backend>/api/*`,
 * so there is no CORS to configure and no backend URL leaks to the browser.
 */
export const API_BASE = process.env.NEXT_PUBLIC_FX_API_URL || '/fx-api'

export class BackendError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'BackendError'
  }
}

export async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {}
  let res: Response
  try {
    res = await fetch(`${API_BASE.replace(/\/$/, '')}${path}`, {
      ...rest,
      headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...rest.headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    })
  } catch {
    throw new BackendError('unreachable', 0)
  }
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) {
    const msg = (body as { error?: string } | null)?.error ?? `HTTP ${res.status}`
    throw new BackendError(msg, res.status)
  }
  return body as T
}

// ── Shapes mirrored from the backend source ────────────────────────────────
export interface BackendInsight {
  mainInsight: string
  constraints: string[]
  opportunities: string[]
  metaphoricFraming: string
  emotionalTruth: string
  creativeMethod: string
  lateralThinkingBreakdown?: unknown
}
export interface BackendConcept {
  title: string
  tagline: string
  coreIdea: string
  visualNotes: string
  creativeDevice: string
  emotionalArc: string
  targetParadox: string
  lateralThinkingTechniques: string[]
}
export interface BackendScript {
  script: string
  beats: string[]
  cameraLanguage: string
  narrativeStrategy: string
  emotionalTurning: string
  lateralThinkingTechniques: string[]
}

export type AgentPhase = 'queued' | 'planning' | 'insight' | 'concept' | 'script' | 'evaluating' | 'done' | 'failed'
export interface AgentTraceItem { phase: AgentPhase; message: string; ts: string; meta?: Record<string, unknown> }
export interface AgentRun {
  runId: string
  goal: string
  brief: string
  mode: 'OpenAI' | 'VertexAI' | 'Mock'
  status: AgentPhase
  createdAt: string
  updatedAt: string
  trace: AgentTraceItem[]
  plan?: { summary: string; steps: string[]; acceptanceCriteria: string[]; risks: string[]; estimatedMinutes: number }
  insight?: BackendInsight
  concept?: BackendConcept
  script?: BackendScript
  evaluation?: {
    score: number
    verdict: 'ready' | 'needs-review' | 'blocked'
    strengths: string[]
    weaknesses: string[]
    nextActions: string[]
  }
  error?: string
}
export interface AgentStatus {
  ok: boolean
  mode: AgentRun['mode']
  capabilities: string[]
  counts: { totalRuns: number; activeRuns: number; auditEvents: number }
  recentRuns: Array<{ runId: string; goal: string; status: AgentPhase; mode: string; score?: number; verdict?: string; updatedAt: string }>
}
export interface SaaSPlan {
  id: 'starter' | 'pro' | 'studio'
  name: string
  priceMonthlyUsd: number
  description: string
  limits: { seats: number; projects: number; agentRunsPerMonth: number; aiCallsPerMonth: number }
  features: string[]
  recommended?: boolean
}
export interface Tenant { tenantId: string; companyName: string; workspaceSlug: string; planId: SaaSPlan['id']; apiKey: string; createdAt: string }
export interface Usage { agentRuns: number; aiCallsEstimate: number; lastRunAt?: string; notes: string[] }
export interface Metrics {
  uptime: { ms: number; since: string }
  totals: { requests: number; errors: number; errorRate: number }
  providerMode: string
  routes: Record<string, { requests: number; errors: number; avgMs: number; p95Ms: number }>
  gateway?: { totalCalls: number; cacheHitRate: number; providers: Record<string, { healthy: boolean; totalCalls: number; totalFailures: number; totalTokens: number; estimatedCostUsd: number }> }
}

export const backend = {
  health: async () => { const r = await fetch('/healthz'); if (!r.ok) throw new BackendError('down', r.status); return (await r.json()) as { ok: boolean; ts: string } },
  metrics: () => api<Metrics>('/metrics'),
  keyStatus: () => api<{ configured: boolean; reason?: string }>('/key-status'),
  setKey: (value: string) => api<{ ok: true }>('/set-key', { method: 'POST', json: { service: 'fx-openai', account: 'default', value } }),
  deleteKey: () => api<{ ok: true }>('/set-key', { method: 'DELETE' }),
  agentStatus: () => api<AgentStatus>('/agent/status'),
  agentRuns: () => api<{ runs: AgentRun[] }>('/agent/runs'),
  agentRun: (input: { goal: string; brief?: string; language?: 'ar' | 'en'; tenantId?: string }) =>
    api<AgentRun>('/agent/run', { method: 'POST', json: input }),
  audit: (limit = 20) => api<{ audit: AgentTraceItem[] }>(`/agent/audit?limit=${limit}`),
  saasPlans: () => api<{ plans: SaaSPlan[] }>('/saas/plans'),
  register: (companyName: string, planId: SaaSPlan['id']) =>
    api<{ tenant: Tenant; usage: Usage }>('/saas/register', { method: 'POST', json: { companyName, planId } }),
  usage: (tenantId: string) => api<{ tenant: Tenant; usage: Usage }>(`/saas/usage/${encodeURIComponent(tenantId)}`),
}
