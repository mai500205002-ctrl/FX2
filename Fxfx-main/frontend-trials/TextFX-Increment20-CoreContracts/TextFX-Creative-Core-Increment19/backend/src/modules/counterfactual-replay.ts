import type { CreativeCandidate } from '../core/creative-ir'
import type { CreativeCourtDecision } from './creative-court'
import type { CreativeScriptReview } from './creative-reviewer'

export interface CounterfactualReplay {
  status: 'compared' | 'inconclusive' | 'skipped' | 'failed'
  method: 'bounded-shadow-script-review-v1'
  selectedCandidateId: string
  alternativeCandidateId?: string
  primaryReviewSource: CreativeScriptReview['source']
  shadowReviewSource?: CreativeScriptReview['source']
  primaryScore: number
  shadowScore?: number
  scoreDelta?: number
  primaryVerdict: CreativeScriptReview['verdict']
  shadowVerdict?: CreativeScriptReview['verdict']
  interpretation: string
  limitations: string[]
}

/** Pick exactly one runner-up using Court scores when available, otherwise discovery heuristics. */
export function selectCounterfactualCandidate(
  candidates: CreativeCandidate[],
  selectedCandidateId: string,
  court?: CreativeCourtDecision,
): CreativeCandidate | undefined {
  const alternatives = candidates.filter(candidate => candidate.id !== selectedCandidateId)
  if (!alternatives.length) return undefined
  const courtScores = new Map((court?.reviews ?? []).map(review => [review.candidateId, review.score]))
  return [...alternatives].sort((a, b) =>
    (courtScores.get(b.id) ?? b.score) - (courtScores.get(a.id) ?? a.score)
  )[0]
}

export function compareCounterfactualReviews(args: {
  selectedCandidateId: string
  alternativeCandidateId: string
  primary: CreativeScriptReview
  shadow: CreativeScriptReview
}): CounterfactualReplay {
  const limitations = [
    'This is a single-run comparison, not a controlled audience experiment.',
    'The shadow script receives one generation and one review; it does not get a revision pass.',
    'A score difference is reviewer judgment, not proof of audience impact or causal superiority.',
  ]
  if (args.primary.source !== 'model' || args.shadow.source !== 'model') {
    return {
      status: 'inconclusive', method: 'bounded-shadow-script-review-v1',
      selectedCandidateId: args.selectedCandidateId, alternativeCandidateId: args.alternativeCandidateId,
      primaryReviewSource: args.primary.source, shadowReviewSource: args.shadow.source,
      primaryScore: args.primary.score, shadowScore: args.shadow.score,
      scoreDelta: args.shadow.score - args.primary.score,
      primaryVerdict: args.primary.verdict, shadowVerdict: args.shadow.verdict,
      interpretation: 'Comparison retained for audit, but at least one score came from a structural fallback; no quality winner is declared.',
      limitations,
    }
  }
  const delta = args.shadow.score - args.primary.score
  const interpretation = Math.abs(delta) < 5
    ? 'The reviewer scores are close; this run does not establish a meaningful winner.'
    : delta > 0
      ? 'The shadow alternative scored higher in this review; retain as evidence for future evaluation, without changing the delivered selection.'
      : 'The selected script scored higher in this review; retain as evidence, not proof of general superiority.'
  return {
    status: 'compared', method: 'bounded-shadow-script-review-v1',
    selectedCandidateId: args.selectedCandidateId, alternativeCandidateId: args.alternativeCandidateId,
    primaryReviewSource: args.primary.source, shadowReviewSource: args.shadow.source,
    primaryScore: args.primary.score, shadowScore: args.shadow.score, scoreDelta: delta,
    primaryVerdict: args.primary.verdict, shadowVerdict: args.shadow.verdict,
    interpretation, limitations,
  }
}
