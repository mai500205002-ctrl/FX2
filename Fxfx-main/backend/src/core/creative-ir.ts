import type { AgentExecutionPlan, AgentEvaluation } from '../agent/types'
import type { generateInsight } from '../modules/insight-generator'
import type { mapConcept } from '../modules/concept-mapper'
import type { writeScript } from '../modules/script-writer'
import type { CreativeCourtDecision } from '../modules/creative-court'
import type { CreativeScriptReview } from '../modules/creative-reviewer'
import type { ScriptRevisionRecord } from '../modules/creative-reviewer'
import type { ArtifactApproval } from '../agent/approval-integrity'
import type { CounterfactualReplay } from '../modules/counterfactual-replay'
import type { getCreativeMemoryStatus } from '../modules/creative-memory'

export const CREATIVE_IR_VERSION = '1.0.0' as const

/** ── Increment20 core contracts (additive, optional, backward compatible) ─────
 * EvidenceReference: browser evidence keeps its source IDs and review status.
 * 'unreviewed' is the only review status this system may assign — promoting
 * evidence to verified truth is a later-increment capability requiring human review.
 * Run state (AgentRunRecord.status: AgentPhase) and idea state (candidate verdicts
 * 'advance' | 'revise' | 'reject' on candidates and court reviews) are separate
 * namespaces: a rejected idea never changes the run phase, and a run phase never
 * overwrites an idea verdict. */
export interface EvidenceReference {
  runId: string
  evidenceIds: string[]
  reviewStatus: 'unreviewed'
}

type Insight = Awaited<ReturnType<typeof generateInsight>>
type Concept = Awaited<ReturnType<typeof mapConcept>>
type Script = Awaited<ReturnType<typeof writeScript>>

/** Canonical representation of one creative run. Modules may compile outputs from this object,
 * but should not invent competing versions of the same underlying idea. */
export interface CreativeCandidate {
  id: string
  lens: string
  concept: Concept
  score: number
  rationale: string[]
  origin?: 'seed' | 'mutation' | 'crossover'
  parentIds?: string[]
  generation?: number
  lensId?: string
  version?: number
  runId?: string
  promptVersion?: string
}

export interface CreativeIR {
  schemaVersion: typeof CREATIVE_IR_VERSION
  id: string
  createdAt: string
  updatedAt: string
  language: 'ar' | 'en'
  intent: { goal: string; brief: string }
  plan: AgentExecutionPlan
  insight: Insight
  concept: Concept
  discovery?: { strategy: 'multi-lens-v1' | 'multi-lens-metabolism-v1' | 'multi-lens-metabolism-entropy-v1' | 'five-technique-v1' | 'five-technique-metabolism-entropy-v2'; candidates: CreativeCandidate[]; selectedCandidateId: string; failedLenses?: Array<{ lensId: string; error: string }>; metabolism?: { offspringIds: string[]; events: Array<{ type: 'mutation' | 'crossover' | 'skipped'; message: string; parentIds: string[] }> }; entropy?: { diversityScore: number; maxSimilarity: number; threshold: number; action: 'unchanged' | 'diversified' | 'attempt-failed' | 'not-needed'; candidateCount: number; mostSimilarPair?: [string, string]; antiTasteLessonIds: string[]; notes: string[] } }
  court?: CreativeCourtDecision
  script: Script
  scriptReview?: CreativeScriptReview
  revisionHistory?: ScriptRevisionRecord[]
  counterfactual?: CounterfactualReplay
  learning?: { retrievedLessonIds: string[]; learnedLessonIds: string[]; memoryStatus: ReturnType<typeof getCreativeMemoryStatus> }
  evaluation?: AgentEvaluation
  lineage: { parentId?: string; revision: number; events: string[] }
  provenance: { provider: string; generatedAt: string; promptVersion?: string; rubricVersions?: { court: string; scriptReview: string }; modelRoutingVersion?: string; modelCalls?: import('../gateway/llm-gateway').GatewayCallProvenance[]; approval?: ArtifactApproval; approvalStatus?: 'current' | 'invalidated'; browserResearch?: EvidenceReference }
}

export function createCreativeIR(input: Omit<CreativeIR, 'schemaVersion' | 'createdAt' | 'updatedAt' | 'lineage'> & {
  createdAt?: string
  updatedAt?: string
  lineage?: CreativeIR['lineage']
}): CreativeIR {
  const createdAt = input.createdAt ?? new Date().toISOString()
  const ir: CreativeIR = {
    ...input,
    schemaVersion: CREATIVE_IR_VERSION,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    lineage: input.lineage ?? { revision: 1, events: ['creative-ir.created'] },
  }
  validateCreativeIR(ir)
  return ir
}

/** Runtime contract validation without introducing a new runtime dependency into the working app. */
export function validateCreativeIR(value: unknown): asserts value is CreativeIR {
  if (!value || typeof value !== 'object') throw new Error('CreativeIR must be an object.')
  const ir = value as Partial<CreativeIR>
  if (ir.schemaVersion !== CREATIVE_IR_VERSION) throw new Error('CreativeIR schemaVersion is missing or unsupported.')
  if (typeof ir.id !== 'string' || !ir.id.trim()) throw new Error('CreativeIR requires a non-empty id.')
  if (ir.language !== 'ar' && ir.language !== 'en') throw new Error('CreativeIR language must be ar or en.')
  if (!ir.intent || typeof ir.intent.goal !== 'string' || !ir.intent.goal.trim() || typeof ir.intent.brief !== 'string' || !ir.intent.brief.trim()) {
    throw new Error('CreativeIR intent requires a goal and brief.')
  }
  if (!ir.plan || !Array.isArray(ir.plan.steps) || !ir.insight || typeof ir.insight.mainInsight !== 'string' || !ir.insight.mainInsight.trim()) {
    throw new Error('CreativeIR is missing a valid plan or insight.')
  }
  if (!ir.concept || typeof ir.concept.title !== 'string' || !ir.concept.title.trim() || typeof ir.concept.coreIdea !== 'string' || !ir.concept.coreIdea.trim()) {
    throw new Error('CreativeIR is missing a valid concept.')
  }
  if (!ir.script || typeof ir.script.script !== 'string' || !ir.script.script.trim() || !Array.isArray(ir.script.beats) || ir.script.beats.length < 3) {
    throw new Error('CreativeIR is missing a valid script with at least three beats.')
  }
  if (!ir.lineage || !Array.isArray(ir.lineage.events) || !Number.isInteger(ir.lineage.revision) || ir.lineage.revision < 1) {
    throw new Error('CreativeIR lineage is invalid.')
  }
  if (ir.discovery) {
    if (!Array.isArray(ir.discovery.candidates) || !ir.discovery.candidates.length) throw new Error('CreativeIR discovery requires candidates.')
    const candidateIds = new Set<string>()
    for (const candidate of ir.discovery.candidates) {
      if (!candidate || typeof candidate.id !== 'string' || !candidate.id.trim() || candidateIds.has(candidate.id)) {
        throw new Error('CreativeIR discovery candidate IDs must be non-empty and unique.')
      }
      candidateIds.add(candidate.id)
      if (typeof candidate.lens !== 'string' || !candidate.lens.trim() || !Number.isFinite(candidate.score) || candidate.score < 0 || candidate.score > 100 || !candidate.concept || typeof candidate.concept.title !== 'string' || !candidate.concept.title.trim()) {
        throw new Error(`CreativeIR discovery candidate ${candidate.id} is invalid.`)
      }
      if (candidate.version !== undefined && (!Number.isInteger(candidate.version) || candidate.version < 1)) throw new Error(`CreativeIR candidate ${candidate.id} has an invalid version.`)
      if (candidate.lensId !== undefined && (typeof candidate.lensId !== 'string' || !candidate.lensId.trim())) throw new Error(`CreativeIR candidate ${candidate.id} has an invalid lensId.`)
      if (candidate.runId !== undefined && (typeof candidate.runId !== 'string' || !candidate.runId.trim())) throw new Error(`CreativeIR candidate ${candidate.id} has an invalid runId.`)
      if (candidate.promptVersion !== undefined && (typeof candidate.promptVersion !== 'string' || !candidate.promptVersion.trim())) throw new Error(`CreativeIR candidate ${candidate.id} has an invalid promptVersion.`)
    }
    if (typeof ir.discovery.selectedCandidateId !== 'string' || !candidateIds.has(ir.discovery.selectedCandidateId)) throw new Error('CreativeIR selectedCandidateId must refer to a candidate in the pool.')
    if (ir.discovery.failedLenses !== undefined && (!Array.isArray(ir.discovery.failedLenses) || ir.discovery.failedLenses.some(item => !item || typeof item.lensId !== 'string' || !item.lensId.trim() || typeof item.error !== 'string' || !item.error.trim()))) {
      throw new Error('CreativeIR discovery failedLenses is invalid.')
    }
  }
  if (ir.revisionHistory !== undefined) {
    if (!Array.isArray(ir.revisionHistory) || ir.revisionHistory.some((item, index) =>
      !item || typeof item.candidateId !== 'string' || !item.candidateId.trim() ||
      !Number.isInteger(item.candidateVersion) || item.candidateVersion < 1 ||
      item.artifactVersion !== index + 1 || !item.script || typeof item.script.script !== 'string' ||
      !item.review || !Array.isArray(item.review.objections) || typeof item.recordedAt !== 'string'
    )) throw new Error('CreativeIR revision history is invalid.')
  }
  // Increment20 boundary check: evidence references may only carry 'unreviewed' at the system
  // boundary. Promoting unreviewed evidence to verified truth is not a capability of this system.
  if (ir.provenance?.browserResearch) {
    const ref = ir.provenance.browserResearch
    if (typeof ref.runId !== 'string' || !ref.runId.trim() || !Array.isArray(ref.evidenceIds) || ref.evidenceIds.some(id => typeof id !== 'string' || !id.trim())) {
      throw new Error('CreativeIR provenance.browserResearch requires a runId and evidenceIds.')
    }
    if (ref.reviewStatus !== 'unreviewed') throw new Error('Evidence references must stay unreviewed at the system boundary.')
  }
}

export function summarizeCreativeIR(ir: CreativeIR) {
  return {
    id: ir.id,
    schemaVersion: ir.schemaVersion,
    language: ir.language,
    conceptTitle: ir.concept.title,
    candidateCount: ir.discovery?.candidates.length ?? 1,
    offspringCount: ir.discovery?.metabolism?.offspringIds.length ?? 0,
    conceptGenerations: Math.max(0, ...(ir.discovery?.candidates.map(candidate => candidate.generation ?? 0) ?? [0])),
    selectedCandidateId: ir.discovery?.selectedCandidateId,
    courtSource: ir.court?.source,
    courtReviews: ir.court?.reviews.length ?? 0,
    memoryLessonsRetrieved: ir.learning?.retrievedLessonIds.length ?? 0,
    memoryLessonsLearned: ir.learning?.learnedLessonIds.length ?? 0,
    counterfactualStatus: ir.counterfactual?.status,
    counterfactualScoreDelta: ir.counterfactual?.scoreDelta,
    scriptReviewSource: ir.scriptReview?.source,
    scriptReviewScore: ir.scriptReview?.score,
    scriptRevisionCount: ir.lineage.events.filter(event => event === 'script.revised').length,
    scriptBeats: ir.script.beats.length,
    revision: ir.lineage.revision,
    eventCount: ir.lineage.events.length,
  }
}
