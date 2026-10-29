import type { LateralThinkingContext } from '../modules/lateral-thinking-agent'
import type { CreativeIR } from '../core/creative-ir'
import type { ProviderLabel } from '../gateway/provider-adapters'

export type AgentMode = ProviderLabel | `${ProviderLabel} (not configured)` | `Auto (${string})` | 'Auto (no provider configured)'
export type AgentPhase = 'queued' | 'planning' | 'insight' | 'discovery' | 'metabolism' | 'entropy' | 'court' | 'concept' | 'script' | 'reviewing' | 'revising' | 'evaluating' | 'done' | 'failed' | 'interrupted'

/** Idea-level verdicts live on candidates and court reviews only (see CreativeCandidate
 * and CourtCandidateReview); they never overwrite run phases, and run phases never
 * overwrite idea verdicts. Run state and idea state are separate namespaces. */
export type IdeaVerdict = 'advance' | 'revise' | 'reject'

export interface AgentRunRequest {
  goal: string
  browserResearchId?: string
  brief?: string
  archetype?: string
  language?: 'en' | 'ar'
  brandVoice?: LateralThinkingContext['brandVoice']
  tenantId?: string
  idempotencyKey?: string
}

export interface AgentExecutionPlan {
  summary: string
  steps: string[]
  acceptanceCriteria: string[]
  risks: string[]
  estimatedMinutes: number
  mode: AgentMode
}

export interface AgentEvaluation {
  source?: 'creative-review' | 'heuristic-fallback'
  score: number
  verdict: 'ready' | 'needs-review' | 'blocked'
  strengths: string[]
  weaknesses: string[]
  nextActions: string[]
}

export interface AgentTraceItem {
  phase: AgentPhase
  message: string
  ts: string
  meta?: Record<string, unknown>
}

export interface AgentRunRecord {
  runId: string
  goal: string
  brief: string
  tenantId?: string
  mode: AgentMode
  status: AgentPhase
  createdAt: string
  updatedAt: string
  trace: AgentTraceItem[]
  runtime: {
    mode: AgentMode
    tenantId?: string
    timestamp: string
  }
  plan?: AgentExecutionPlan
  insight?: Awaited<ReturnType<typeof import('../modules/insight-generator').generateInsight>>
  concept?: Awaited<ReturnType<typeof import('../modules/concept-mapper').mapConcept>>
  script?: Awaited<ReturnType<typeof import('../modules/script-writer').writeScript>>
  scriptReview?: import('../modules/creative-reviewer').CreativeScriptReview
  revisionHistory?: import('../modules/creative-reviewer').ScriptRevisionRecord[]
  modelCalls?: import('../gateway/llm-gateway').GatewayCallProvenance[]
  learning?: import('../core/creative-ir').CreativeIR['learning']
  evaluation?: AgentEvaluation
  browserResearch?: import('../core/creative-ir').EvidenceReference
  creativeIR?: CreativeIR
  error?: string
  errorDisposition?: 'retryable' | 'permanent' | 'interrupted'
  approval?: import('./approval-integrity').ArtifactApproval
  approvalStatus?: 'current' | 'invalidated'
}

export interface AgentRunResponse extends AgentRunRecord {}

export interface AgentStatusResponse {
  ok: boolean
  mode: AgentMode
  readyForSaaS: boolean
  capabilities: string[]
  counts: {
    totalRuns: number
    activeRuns: number
    auditEvents: number
  }
  recentRuns: Array<{
    runId: string
    goal: string
    status: AgentPhase
    mode: AgentMode
    score?: number
    verdict?: AgentEvaluation['verdict']
    updatedAt: string
  }>
  recentAudit: AgentTraceItem[]
}
