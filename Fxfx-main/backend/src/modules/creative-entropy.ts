import { mapConcept } from './concept-mapper'
import type { CreativeCandidate } from '../core/creative-ir'
import type { LateralThinkingContext } from './lateral-thinking-agent'
import type { CreativeMemoryContext } from './creative-memory'

export interface CreativeEntropyReport {
  diversityScore: number
  maxSimilarity: number
  threshold: number
  action: 'unchanged' | 'diversified' | 'attempt-failed' | 'not-needed'
  candidateCount: number
  mostSimilarPair?: [string, string]
  antiTasteLessonIds: string[]
  notes: string[]
}

function words(candidate: CreativeCandidate): Set<string> {
  const concept = candidate.concept
  const text = [concept.title, concept.tagline, concept.coreIdea, concept.visualNotes, concept.creativeDevice, concept.emotionalArc, concept.targetParadox, ...(concept.lateralThinkingTechniques || [])].join(' ')
  return new Set((text.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []))
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let intersection = 0
  for (const token of a) if (b.has(token)) intersection++
  return intersection / (a.size + b.size - intersection)
}

function measure(candidates: CreativeCandidate[]) {
  let maxSimilarity = 0
  let pair: [string, string] | undefined
  const pairs: number[] = []
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const score = similarity(words(candidates[i]), words(candidates[j]))
      pairs.push(score)
      if (score > maxSimilarity) {
        maxSimilarity = score
        pair = [candidates[i].id, candidates[j].id]
      }
    }
  }
  const average = pairs.length ? pairs.reduce((sum, value) => sum + value, 0) / pairs.length : 0
  return { maxSimilarity, pair, diversityScore: Math.round((1 - average) * 100) }
}

/**
 * A bounded novelty thermostat: measures lexical overlap, then makes at most one
 * targeted regeneration of the weaker member of the most similar pair. Scores are
 * diagnostic heuristics, not a claim to measure artistic value.
 */
export async function regulateCreativeEntropy(args: {
  candidates: CreativeCandidate[]
  insight: { mainInsight?: string }
  context: LateralThinkingContext
  antiTasteMemory: CreativeMemoryContext
  threshold?: number
}): Promise<{ candidates: CreativeCandidate[]; report: CreativeEntropyReport }> {
  const threshold = args.threshold ?? 0.68
  const antiTasteLessonIds = args.antiTasteMemory.lessons.map(lesson => lesson.id)
  const notes: string[] = []
  if (args.candidates.length < 2) {
    return { candidates: args.candidates, report: { diversityScore: 100, maxSimilarity: 0, threshold, action: 'not-needed', candidateCount: args.candidates.length, antiTasteLessonIds, notes: ['Fewer than two candidates; pairwise diversity is not applicable.'] } }
  }
  const initial = measure(args.candidates)
  if (initial.maxSimilarity < threshold || !initial.pair) {
    return { candidates: args.candidates, report: { diversityScore: initial.diversityScore, maxSimilarity: initial.maxSimilarity, threshold, action: 'not-needed', candidateCount: args.candidates.length, mostSimilarPair: initial.pair, antiTasteLessonIds, notes: [`Maximum lexical Jaccard similarity ${initial.maxSimilarity.toFixed(3)} is below the ${threshold.toFixed(2)} trigger.`] } }
  }

  const [firstId, secondId] = initial.pair
  const first = args.candidates.find(candidate => candidate.id === firstId)!
  const second = args.candidates.find(candidate => candidate.id === secondId)!
  const target = first.score <= second.score ? first : second
  const other = target.id === first.id ? second : first
  const antiTaste = args.antiTasteMemory.prompt ? `\n\n${args.antiTasteMemory.prompt}` : ''
  const instruction = [
    'CREATIVE ENTROPY THERMOSTAT: this candidate is too similar to another direction in the current pool.',
    `Candidate to differentiate: ${target.concept.title}. Competing direction to avoid echoing: ${other.concept.title} — ${other.concept.creativeDevice}.`,
    'Keep the strategic brief and human insight intact, but change the underlying creative mechanism, metaphor family, scene logic, and emotional turn. Do not merely replace words. Avoid generic inspirational tropes. The result must remain executable and relevant.',
    antiTaste,
  ].join('\n')
  const diversifiedContext: LateralThinkingContext = {
    ...args.context,
    target: `${args.context.target}\n\n${instruction}`,
    problem: `${args.context.problem}\n\n${instruction}`,
  }
  try {
    const concept = await mapConcept({ mainInsight: `${args.insight.mainInsight || ''}\n\n${instruction}` }, diversifiedContext)
    const replacement: CreativeCandidate = {
      ...target,
      version: (target.version ?? 1) + 1,
      lens: `${target.lens} · Entropy Diversification`,
      concept,
      rationale: [...target.rationale, `Entropy thermostat regenerated this candidate once because pairwise lexical similarity reached ${initial.maxSimilarity.toFixed(3)}.`, 'Diversity score is a lexical diagnostic, not an artistic-quality score.'],
    }
    const proposed = args.candidates.map(candidate => candidate.id === target.id ? replacement : candidate)
    const after = measure(proposed)
    if (after.maxSimilarity < initial.maxSimilarity) {
      notes.push(`Reduced maximum pairwise lexical similarity from ${initial.maxSimilarity.toFixed(3)} to ${after.maxSimilarity.toFixed(3)}.`)
      return { candidates: proposed, report: { diversityScore: after.diversityScore, maxSimilarity: after.maxSimilarity, threshold, action: 'diversified', candidateCount: proposed.length, mostSimilarPair: after.pair, antiTasteLessonIds, notes } }
    }
    notes.push('The regenerated candidate did not reduce measured overlap; original candidate retained.')
    return { candidates: args.candidates, report: { diversityScore: initial.diversityScore, maxSimilarity: initial.maxSimilarity, threshold, action: 'attempt-failed', candidateCount: args.candidates.length, mostSimilarPair: initial.pair, antiTasteLessonIds, notes } }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    notes.push(`Diversification attempt failed; original candidate pool retained: ${message}`)
    return { candidates: args.candidates, report: { diversityScore: initial.diversityScore, maxSimilarity: initial.maxSimilarity, threshold, action: 'attempt-failed', candidateCount: args.candidates.length, mostSimilarPair: initial.pair, antiTasteLessonIds, notes } }
  }
}
