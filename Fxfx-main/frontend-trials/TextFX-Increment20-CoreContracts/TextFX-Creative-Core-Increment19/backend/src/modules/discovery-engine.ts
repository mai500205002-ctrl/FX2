import { randomUUID } from 'node:crypto'
import { mapConcept } from './concept-mapper'
import type { LateralThinkingContext } from './lateral-thinking-agent'
import type { CreativeCandidate } from '../core/creative-ir'

type Concept = CreativeCandidate['concept']

export interface DiscoveryResult {
  candidates: CreativeCandidate[]
  selected: CreativeCandidate
  strategy: 'multi-lens-v1'
}

interface Lens {
  id: string
  name: string
  instruction: string
}

const LENSES: Lens[] = [
  { id: 'human-truth', name: 'Human Truth', instruction: 'Start from a sharp, emotionally honest human contradiction. Avoid generic inspirational messaging.' },
  { id: 'system-reversal', name: 'System Reversal', instruction: 'Invert an accepted assumption in the category. Make the reversal strategically useful, not weird for its own sake.' },
  { id: 'unexpected-analogy', name: 'Unexpected Analogy', instruction: 'Borrow a mechanism from a distant domain and translate it into a clear, executable creative device.' },
]

function words(value: string): Set<string> {
  return new Set((value.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []).filter(w => !STOP_WORDS.has(w)))
}
const STOP_WORDS = new Set(['the','and','for','with','that','this','from','into','your','you','are','but','not','was','were','have','has','will','can','من','في','على','إلى','عن','مع','هذا','هذه','ذلك','التي','الذي','هو','هي','كل','بين','عند','عشان','لكن'])

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let common = 0
  for (const token of a) if (b.has(token)) common++
  return common / Math.max(1, Math.min(a.size, b.size))
}

function conceptText(c: Concept): string {
  return [c.title, c.tagline, c.coreIdea, c.visualNotes, c.creativeDevice, c.emotionalArc, c.targetParadox, ...(c.lateralThinkingTechniques || [])].join(' ')
}

/**
 * Generates candidates through genuinely different creative lenses, then ranks them using
 * explicit, inspectable heuristics. This is a discovery stage, not a claim of objective taste.
 */
export async function discoverConcepts(insight: unknown, context: LateralThinkingContext, candidateLimit = 3): Promise<DiscoveryResult> {
  const count = Math.max(2, Math.min(LENSES.length, Math.floor(candidateLimit)))
  const lenses = LENSES.slice(0, count)
  const results = await Promise.all(lenses.map(async lens => {
    const lensContext: LateralThinkingContext = {
      ...context,
      target: `${context.target}\nCreative lens: ${lens.name}. ${lens.instruction}`,
      problem: `${context.problem}\n\nDiscovery instruction: ${lens.instruction}`,
    }
    try {
      const concept = await mapConcept(insight, lensContext)
      return { ok: true as const, value: { lens, concept } }
    } catch (error) {
      return { ok: false as const, error }
    }
  }))

  const generated = results.flatMap(result => result.ok ? [result.value] : [])
  if (!generated.length) {
    const firstFailure = results.find(result => !result.ok)
    throw firstFailure && !firstFailure.ok ? firstFailure.error : new Error('Discovery engine generated no candidates.')
  }

  const insightText = typeof insight === 'string' ? insight : JSON.stringify(insight ?? '')
  const insightWords = words(insightText)
  const candidates: CreativeCandidate[] = generated.map(({ lens, concept }, index) => {
    const ownWords = words(conceptText(concept))
    const otherConcepts = generated.filter(other => other.concept !== concept)
    const relevance = overlap(ownWords, insightWords)
    const similarityToOthers = otherConcepts.length
      ? otherConcepts.reduce((sum, other) => sum + overlap(ownWords, words(conceptText(other.concept))), 0) / otherConcepts.length
      : 0.5
    const distinctiveness = Math.max(0, 1 - similarityToOthers)
    const completeness = [concept.title, concept.tagline, concept.coreIdea, concept.visualNotes, concept.creativeDevice, concept.emotionalArc, concept.targetParadox].filter(v => typeof v === 'string' && v.trim()).length / 7
    const score = Math.round(Math.max(0, Math.min(100, relevance * 45 + distinctiveness * 35 + completeness * 20)))
    const rationale = [
      `Lens: ${lens.name}.`,
      `Insight keyword alignment heuristic: ${Math.round(relevance * 100)}%.`,
      `Relative distinctiveness heuristic: ${Math.round(distinctiveness * 100)}%.`,
      `Required-field completeness: ${Math.round(completeness * 100)}%.`,
    ]
    return { id: randomUUID(), lens: lens.name, concept, score, rationale, origin: 'seed' as const, parentIds: [], generation: 0 }
  }).sort((a, b) => b.score - a.score)

  return { candidates, selected: candidates[0], strategy: 'multi-lens-v1' }
}
