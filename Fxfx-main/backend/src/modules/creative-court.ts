import { assertLanguageMatch, parseJsonObject } from '../utils/generation'
import type { CreativeCandidate } from '../core/creative-ir'
import type { LateralThinkingContext } from './lateral-thinking-agent'
import { withGatewayTask } from '../gateway/llm-gateway'

/** Versioned Court rubric: recorded in every run's provenance via rubricVersions.court.
 * Rubric weight changes bump this version independently of schema and prompt changes. */
export const COURT_RUBRIC_VERSION = '1.0.0' as const

export interface CourtCandidateReview {
  candidateId: string
  score: number
  verdict: 'advance' | 'revise' | 'reject'
  rationale: string[]
  strengths: string[]
  weaknesses: string[]
  nextActions: string[]
}

export interface CreativeCourtDecision {
  source: 'model' | 'heuristic-fallback'
  selectedCandidateId: string
  reviews: CourtCandidateReview[]
  summary: string
  rubric: string[]
}

interface CourtPayload {
  selectedCandidateId: string
  summary: string
  rubric: string[]
  reviews: Array<{
    candidateId: string
    score: number
    verdict: 'advance' | 'revise' | 'reject'
    rationale: string[]
    strengths: string[]
    weaknesses: string[]
    nextActions: string[]
  }>
}

function validStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string' && item.trim().length > 0)
}

/** Independent critic: compares discovered concepts against the actual brief, not just field presence. */
export async function judgeConceptCandidates(args: {
  goal: string
  brief: string
  insight: string
  candidates: CreativeCandidate[]
  context: LateralThinkingContext
}): Promise<CreativeCourtDecision> {
  if (!args.candidates.length) throw new Error('Creative Court requires at least one candidate.')
  const candidateIds = new Set(args.candidates.map(candidate => candidate.id))
  const language = args.context.language === 'ar' ? 'fluent Arabic' : 'English'
  const prompt = [
    `Goal: ${args.goal}`,
    `Brief: ${args.brief}`,
    `Strategic insight: ${args.insight}`,
    'Evaluate the following candidate concepts as an independent creative judge. Do not reward verbosity or merely complete fields.',
    'Score each candidate from 0 to 100 using: brief/goal fit (25%), insight depth (20%), originality and non-obviousness (20%), emotional/strategic coherence (15%), execution clarity (10%), and risk/ethical awareness (10%).',
    'Select exactly one candidateId. Give evidence-based reasons tied to the supplied concepts. Do not invent audience research or factual claims.',
    `Write every natural-language value in ${language}. Return JSON only with keys: selectedCandidateId, summary, rubric (array of strings), reviews (array). Each review must contain candidateId, score, verdict (advance|revise|reject), rationale (array), strengths (array), weaknesses (array), nextActions (array). Include one review per candidate.`,
    `Candidates: ${JSON.stringify(args.candidates.map(candidate => ({ id: candidate.id, lens: candidate.lens, heuristicScore: candidate.score, concept: candidate.concept })))}`,
  ].join('\n\n')
  const systemPrompt = 'You are the Creative Court: a rigorous, independent evaluator, not a concept generator. Compare all candidates against the same rubric. Be specific, candid, and calibrated. Return valid JSON only.'
  const response = await args.context.provider.generateCreativeText(prompt, systemPrompt, withGatewayTask(args.context.providerConfig, 'critique'))
  const payload = parseJsonObject<CourtPayload>(response.text, 'Creative Court')
  if (typeof payload.selectedCandidateId !== 'string' || !candidateIds.has(payload.selectedCandidateId)) throw new Error('Creative Court returned an unknown selectedCandidateId.')
  if (typeof payload.summary !== 'string' || !payload.summary.trim() || !validStrings(payload.rubric)) throw new Error('Creative Court returned an invalid summary or rubric.')
  if (!Array.isArray(payload.reviews) || payload.reviews.length !== args.candidates.length) throw new Error('Creative Court must review every candidate exactly once.')
  const seen = new Set<string>()
  for (const review of payload.reviews) {
    if (!review || !candidateIds.has(review.candidateId) || seen.has(review.candidateId)) throw new Error('Creative Court returned missing, duplicate, or unknown candidate IDs.')
    seen.add(review.candidateId)
    if (typeof review.score !== 'number' || !Number.isFinite(review.score) || review.score < 0 || review.score > 100) throw new Error('Creative Court score must be between 0 and 100.')
    if (!['advance', 'revise', 'reject'].includes(review.verdict)) throw new Error('Creative Court returned an invalid verdict.')
    for (const field of ['rationale', 'strengths', 'weaknesses', 'nextActions'] as const) if (!validStrings(review[field])) throw new Error(`Creative Court returned invalid ${field}.`)
  }
  assertLanguageMatch(payload, args.context.language || 'en', 'Creative Court')
  return { source: 'model', selectedCandidateId: payload.selectedCandidateId, reviews: payload.reviews, summary: payload.summary, rubric: payload.rubric }
}

/** Deterministic fallback keeps the pipeline usable when the judge provider fails; it is labelled explicitly. */
export function fallbackCourtDecision(candidates: CreativeCandidate[], reason: string): CreativeCourtDecision {
  const ordered = [...candidates].sort((a, b) => b.score - a.score)
  const selected = ordered[0]
  return {
    source: 'heuristic-fallback',
    selectedCandidateId: selected.id,
    summary: `Independent model judgment was unavailable; selection fell back to discovery heuristics. ${reason}`,
    rubric: ['Fallback only: relative distinctiveness heuristic', 'Fallback only: insight keyword alignment', 'Fallback only: required-field completeness'],
    reviews: ordered.map((candidate, index) => ({
      candidateId: candidate.id,
      score: candidate.score,
      verdict: index === 0 ? 'advance' : 'revise',
      rationale: [...candidate.rationale, 'This is a heuristic fallback, not an independent semantic judgment.'],
      strengths: index === 0 ? ['Highest heuristic discovery score.'] : ['Generated successfully through a distinct creative lens.'],
      weaknesses: ['Not independently judged against the full creative brief.'],
      nextActions: index === 0 ? ['Validate strategic fit with a human reviewer.'] : ['Consider only if the leading concept fails review.'],
    })),
  }
}
