import { assertLanguageMatch, parseJsonObject } from '../utils/generation'
import type { LateralThinkingContext } from './lateral-thinking-agent'
import { withGatewayTask } from '../gateway/llm-gateway'

/** Versioned script-review rubric: recorded in every run's provenance via rubricVersions.scriptReview.
 * Criterion changes bump this version independently of schema and prompt changes. */
export const REVIEW_RUBRIC_VERSION = '1.0.0' as const

export type ReviewCriterion = 'goalAlignment' | 'originality' | 'emotionalArc' | 'visualSpecificity' | 'clarityAndPacing' | 'conceptIntegrity'

export interface CreativeObjection {
  candidateId: string
  candidateVersion: number
  criterion: ReviewCriterion
  rubricVersion: string
  defect: string
  rationale: string
  suggestedFix: string
  verificationTest: string
  source: 'model' | 'legacy-derived' | 'structural-fallback'
}

export interface CreativeScriptReview {
  source: 'model' | 'heuristic-fallback'
  score: number
  verdict: 'ready' | 'revise' | 'blocked'
  criterionScores: {
    goalAlignment: number
    originality: number
    emotionalArc: number
    visualSpecificity: number
    clarityAndPacing: number
    conceptIntegrity: number
  }
  strengths: string[]
  weaknesses: string[]
  revisionBrief: string[]
  summary: string
  objections: CreativeObjection[]
}

export interface ScriptRevisionRecord {
  candidateId: string
  candidateVersion: number
  artifactVersion: number
  decision: CreativeScriptReview['verdict']
  script: Awaited<ReturnType<typeof import('./script-writer').writeScript>>
  review: CreativeScriptReview
  recordedAt: string
}

interface ReviewPayload extends Omit<CreativeScriptReview, 'source' | 'objections'> {
  objections: Array<{
    criterion: ReviewCriterion
    defect: string
    rationale: string
    suggestedFix: string
    verificationTest: string
  }>
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string' && item.trim().length > 0)
}

/** Judges the finished creative artifact against the brief and approved concept. */
export async function reviewCreativeScript(args: {
  goal: string
  brief: string
  insight: string
  concept: unknown
  script: unknown
  candidateId?: string
  candidateVersion?: number
  context: LateralThinkingContext
}): Promise<CreativeScriptReview> {
  const candidateId = args.candidateId || 'unknown-candidate'
  const candidateVersion = args.candidateVersion || 1
  const language = args.context.language === 'ar' ? 'fluent Arabic' : 'English'
  const prompt = [
    `Goal: ${args.goal}`,
    `Brief: ${args.brief}`,
    `Strategic insight: ${args.insight}`,
    `Approved concept: ${JSON.stringify(args.concept)}`,
    `Script to judge: ${JSON.stringify(args.script)}`,
    `Candidate identity: ${candidateId}, version ${candidateVersion}. Every objection must refer to this candidate version.`,
    'Act as a demanding creative editor, not a co-writer. Judge the delivered script against the brief and approved concept. Do not reward polish alone; look for a meaningful emotional turn, concrete filmable images, causal coherence, and a non-generic ending.',
    'Give each criterion a score from 0 to 100: goalAlignment, originality, emotionalArc, visualSpecificity, clarityAndPacing, conceptIntegrity. Overall score should be a calibrated judgment, not a mechanical average. verdict must be ready, revise, or blocked. revisionBrief must contain specific actionable edits, not vague advice. Do not invent audience testing or external facts.',
    `Write all natural-language values in ${language}. Return valid JSON only with keys score, verdict, criterionScores, strengths, weaknesses, revisionBrief, summary, objections. criterionScores must contain all six named numeric criteria. strengths, weaknesses, revisionBrief must be non-empty string arrays. objections must be an array; each objection has criterion, defect, rationale, suggestedFix, verificationTest.`,
  ].join('\n\n')
  const response = await args.context.provider.generateCreativeText(
    prompt,
    'You are the TextFX Creative Editor: exacting, specific, constructive, and independent of the generator. Critique the actual artifact. Return valid JSON only.',
    withGatewayTask(args.context.providerConfig, 'critique'),
  )
  const payload = parseJsonObject<ReviewPayload>(response.text, 'Creative script review')
  if (typeof payload.score !== 'number' || !Number.isFinite(payload.score) || payload.score < 0 || payload.score > 100) throw new Error('Creative review score must be between 0 and 100.')
  if (!['ready', 'revise', 'blocked'].includes(payload.verdict)) throw new Error('Creative review verdict is invalid.')
  if (!payload.criterionScores || !['goalAlignment', 'originality', 'emotionalArc', 'visualSpecificity', 'clarityAndPacing', 'conceptIntegrity'].every(key => {
    const score = (payload.criterionScores as unknown as Record<string, unknown>)[key]
    return typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100
  })) throw new Error('Creative review criterion scores are invalid.')
  for (const field of ['strengths', 'weaknesses', 'revisionBrief'] as const) if (!strings(payload[field])) throw new Error(`Creative review ${field} must be a non-empty string array.`)
  if (typeof payload.summary !== 'string' || !payload.summary.trim()) throw new Error('Creative review summary is missing.')
  if (!Array.isArray(payload.objections) || (payload.verdict !== 'ready' && payload.objections.length === 0) || payload.objections.some(item =>
    !item || !['goalAlignment', 'originality', 'emotionalArc', 'visualSpecificity', 'clarityAndPacing', 'conceptIntegrity'].includes(item.criterion) ||
    ![item.defect, item.rationale, item.suggestedFix, item.verificationTest].every(value => typeof value === 'string' && value.trim())
  )) throw new Error('Creative review objections are invalid or missing for a non-ready artifact.')
  assertLanguageMatch(payload, args.context.language || 'en', 'Creative script review')
  return ensureReviewObjections({ ...payload, source: 'model' }, candidateId, candidateVersion)
}

export function ensureReviewObjections(
  review: Omit<CreativeScriptReview, 'objections'> & {
    objections?: Array<Omit<CreativeObjection, 'candidateId' | 'candidateVersion' | 'rubricVersion' | 'source'> & Partial<Pick<CreativeObjection, 'candidateId' | 'candidateVersion' | 'rubricVersion' | 'source'>>>
  },
  candidateId: string,
  candidateVersion: number,
): CreativeScriptReview {
  if (review.objections?.length) {
    return { ...review, objections: review.objections.map(item => ({ ...item, candidateId, candidateVersion, rubricVersion: REVIEW_RUBRIC_VERSION, source: item.source || 'model' })) }
  }
  const criterionScores = review.criterionScores as unknown as Record<ReviewCriterion, number>
  const weakestCriterion = (Object.keys(criterionScores) as ReviewCriterion[])
    .sort((a, b) => criterionScores[a] - criterionScores[b])[0] || 'clarityAndPacing'
  const source: CreativeObjection['source'] = review.source === 'heuristic-fallback' ? 'structural-fallback' : 'legacy-derived'
  const objections = review.weaknesses.map((defect, index) => ({
    candidateId,
    candidateVersion,
    criterion: weakestCriterion,
    rubricVersion: REVIEW_RUBRIC_VERSION,
    defect,
    rationale: `Reviewer weakness for ${weakestCriterion}: ${defect}`,
    suggestedFix: review.revisionBrief[Math.min(index, review.revisionBrief.length - 1)] || 'Address the stated weakness.',
    verificationTest: `Re-review ${weakestCriterion}; confirm the defect is absent and its score is at least 78.`,
    source,
  }))
  return { ...review, objections }
}

/** Clearly labelled emergency fallback; this is structural, not a semantic quality claim. */
export function fallbackCreativeReview(script: any, reason: string, candidateId = 'unknown-candidate', candidateVersion = 1): CreativeScriptReview {
  const hasScript = typeof script?.script === 'string' && script.script.trim().length > 0
  const beatCount = Array.isArray(script?.beats) ? script.beats.filter((beat: unknown) => typeof beat === 'string' && beat.trim()).length : 0
  const score = hasScript && beatCount >= 3 ? 55 : hasScript ? 40 : 0
  const verdict: CreativeScriptReview['verdict'] = score >= 55 ? 'revise' : 'blocked'
  return ensureReviewObjections({
    source: 'heuristic-fallback',
    score,
    verdict,
    criterionScores: { goalAlignment: score, originality: 0, emotionalArc: beatCount >= 3 ? 55 : 20, visualSpecificity: 0, clarityAndPacing: score, conceptIntegrity: score },
    strengths: hasScript ? ['A non-empty script was generated.'] : ['No structural strengths could be verified.'],
    weaknesses: ['Semantic quality was not independently verified because the creative reviewer failed.'],
    revisionBrief: ['Review the script manually against the brief, emotional arc, visual specificity, and concept integrity.'],
    summary: `Fallback structural review only; not a semantic quality judgment. ${reason}`,
  }, candidateId, candidateVersion)
}
