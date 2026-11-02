/**
 * TEXTFX API client — talks to the real TEXTFX backend.
 *
 * The backend is a Node + Express server (from the original repository) that
 * binds to 127.0.0.1. Configure its origin with VITE_TEXTFX_API_URL; it
 * defaults to http://127.0.0.1:3001 to match the backend's default PORT.
 *
 * Every request/response shape here mirrors the actual backend contracts in
 * backend/src/index.ts + the module outputs. No responses are fabricated —
 * if the backend is unreachable, calls throw and the UI surfaces the error.
 */

const BASE = (import.meta.env.VITE_TEXTFX_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://127.0.0.1:3001';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 35000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    const text = await res.text();
    let body: unknown = undefined;
    if (text) {
      try { body = JSON.parse(text); } catch { body = text; }
    }
    if (!res.ok) {
      const msg = typeof body === 'object' && body && 'error' in body
        ? String((body as Record<string, unknown>).error)
        : `Request failed (${res.status})`;
      throw new ApiError(res.status, msg);
    }
    return body as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, 'Request timed out — is the TEXTFX backend running?');
    }
    throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
  } finally {
    clearTimeout(timer);
  }
}

// ── Response types (mirror backend module outputs) ────────────────────────────

export interface LateralThinkingTechnique {
  technique: string;
  insight?: string;
  opportunity?: string;
  metaphor?: string;
  sourceField?: string;
  randomWord?: string;
  unexpectedAngle?: string;
  visualMetaphor?: string;
  paradox?: string;
  desirableMiddle?: string;
  provocation?: string;
  reversal?: string;
}

export interface LateralThinkingBreakdown {
  synthesizedInsight: string;
  creativeBreakthrough: string;
  provocation: { provocation: string; opportunity: string };
  analogies?: Array<{ sourceField: string; metaphor: string }>;
  randomStimulus?: { randomWord: string; unexpectedAngle: string; visualMetaphor?: string };
  oppositeThinking?: { paradox: string; desirableMiddle: string };
  constraintReversal?: { reversal: string; opportunity: string };
}

export interface InsightResponse {
  mainInsight: string;
  lateralThinkingBreakdown: LateralThinkingBreakdown;
  constraints: string[];
  opportunities: string[];
  metaphoricFraming: string;
  emotionalTruth: string;
  creativeMethod: string;
}

export interface ConceptResponse {
  title: string;
  tagline: string;
  coreIdea: string;
  visualNotes: string;
  creativeDevice: string;
  emotionalArc: string;
  targetParadox: string;
  lateralThinkingTechniques: string[];
}

export interface ScriptResponse {
  script: string;
  beats: string[];
  cameraLanguage: string;
  narrativeStrategy: string;
  emotionalTurning: string;
  lateralThinkingTechniques: string[];
}

export interface FullPipelineResponse {
  brief: string;
  insight: InsightResponse;
  concept: ConceptResponse;
  script: ScriptResponse;
  pipelineStatus: string;
}

export interface SystemPromptResponse {
  systemPrompt: string;
}

export interface MetricsResponse {
  [route: string]: unknown;
  gateway?: {
    totalCalls: number;
    cacheHits: number;
    cacheHitRate: number;
    dedupHits: number;
    queuedCalls: number;
    activeConcurrent: number;
    cacheSize: number;
    inflight: number;
    providers?: Record<string, unknown>;
  };
}

export interface KeyStatusResponse {
  configured: boolean;
  reason?: string;
}

// ── Agent types (mirror agent/types.ts) ───────────────────────────────────────

export type AgentMode = 'OpenAI' | 'VertexAI' | 'Mock';
export type AgentPhase = 'queued' | 'planning' | 'insight' | 'concept' | 'script' | 'evaluating' | 'done' | 'failed';

export interface AgentTraceItem {
  phase: AgentPhase;
  message: string;
  ts: string;
  meta?: Record<string, unknown>;
}

export interface AgentEvaluation {
  score: number;
  verdict: 'ready' | 'needs-review' | 'blocked';
  strengths: string[];
  weaknesses: string[];
  nextActions: string[];
}

export interface AgentExecutionPlan {
  summary: string;
  steps: string[];
  acceptanceCriteria: string[];
  risks: string[];
  estimatedMinutes: number;
  mode: AgentMode;
}

export interface AgentRunRecord {
  runId: string;
  goal: string;
  brief: string;
  tenantId?: string;
  mode: AgentMode;
  status: AgentPhase;
  createdAt: string;
  updatedAt: string;
  trace: AgentTraceItem[];
  runtime: { mode: AgentMode; tenantId?: string; timestamp: string };
  plan?: AgentExecutionPlan;
  insight?: InsightResponse;
  concept?: ConceptResponse;
  script?: ScriptResponse;
  evaluation?: AgentEvaluation;
  error?: string;
}

export interface AgentStatusResponse {
  ok: boolean;
  mode: AgentMode;
  readyForSaaS: boolean;
  capabilities: string[];
  counts: { totalRuns: number; activeRuns: number; auditEvents: number };
  recentRuns: Array<{
    runId: string;
    goal: string;
    status: AgentPhase;
    mode: AgentMode;
    score?: number;
    verdict?: AgentEvaluation['verdict'];
    updatedAt: string;
  }>;
  recentAudit: AgentTraceItem[];
}

export interface AgentRunRequest {
  goal: string;
  brief?: string;
  archetype?: string;
  language?: 'en' | 'ar';
  tenantId?: string;
}

// ── SaaS types ────────────────────────────────────────────────────────────────

export interface SaaSPlan {
  id: string;
  name: string;
  price: number;
  limits: Record<string, number>;
  features: string[];
}

export interface SaaSTenant {
  tenantId: string;
  companyName: string;
  planId: string;
  createdAt: string;
}

export interface SaaSUsage {
  tenantId: string;
  planId: string;
  usage: Record<string, number>;
  limits: Record<string, number>;
}

export interface SaaSStatusResponse {
  ok: boolean;
  enabled: boolean;
  tenants: number;
  plans: number;
}

// ── API surface ───────────────────────────────────────────────────────────────

export const api = {
  base: BASE,

  health: () => request<{ status: string; ts: string }>('/health'),

  getSystemPrompt: () => request<SystemPromptResponse>('/api/system-prompt'),

  generateInsight: (body: { brief: string; archetype?: string; brandVoice?: string; language?: 'en' | 'ar' }) =>
    request<InsightResponse>('/api/insight', { method: 'POST', body: JSON.stringify(body) }),

  mapConcept: (body: { insight: unknown; archetype?: string; brandVoice?: string; language?: 'en' | 'ar' }) =>
    request<ConceptResponse>('/api/concept', { method: 'POST', body: JSON.stringify(body) }),

  writeScript: (body: { concept: unknown; archetype?: string; brandVoice?: string; language?: 'en' | 'ar' }) =>
    request<ScriptResponse>('/api/script', { method: 'POST', body: JSON.stringify(body) }),

  fullPipeline: (body: { brief: string; archetype?: string; brandVoice?: string; language?: 'en' | 'ar' }) =>
    request<FullPipelineResponse>('/api/full-pipeline', { method: 'POST', body: JSON.stringify(body) }, 100000),

  getMetrics: () => request<MetricsResponse>('/api/metrics'),

  getKeyStatus: () => request<KeyStatusResponse>('/api/key-status'),
  setKey: (value: string) =>
    request<{ ok: boolean }>('/api/set-key', { method: 'POST', body: JSON.stringify({ service: 'fx-openai', account: 'default', value }) }),
  deleteKey: () => request<{ ok: boolean }>('/api/set-key', { method: 'DELETE' }),

  // Agent
  agentStatus: () => request<AgentStatusResponse>('/api/agent/status'),
  agentRuns: () => request<{ runs: AgentRunRecord[] }>('/api/agent/runs'),
  agentRun: (runId: string) => request<{ run: AgentRunRecord }>(`/api/agent/runs/${encodeURIComponent(runId)}`),
  agentAudit: (limit = 20) => request<{ audit: AgentTraceItem[] }>(`/api/agent/audit?limit=${limit}`),
  agentRunCreate: (body: AgentRunRequest) =>
    request<AgentRunRecord>('/api/agent/run', { method: 'POST', body: JSON.stringify(body) }, 100000),

  // SaaS
  saasStatus: () => request<SaaSStatusResponse>('/api/saas/status'),
  saasPlans: () => request<{ plans: SaaSPlan[] }>('/api/saas/plans'),
  saasRegister: (companyName: string, planId = 'starter') =>
    request<{ tenant: SaaSTenant; usage: SaaSUsage; plans: SaaSPlan[] }>('/api/saas/register', { method: 'POST', body: JSON.stringify({ companyName, planId }) }),
  saasUsage: (tenantId: string) =>
    request<{ tenant: SaaSTenant; usage: SaaSUsage }>(`/api/saas/usage/${encodeURIComponent(tenantId)}`),
};

export type Api = typeof api;
