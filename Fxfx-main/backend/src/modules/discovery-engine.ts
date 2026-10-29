import { randomUUID } from 'node:crypto'
import { mapConcept } from './concept-mapper'
import { SYSTEM_PROMPT_VERSION, type LateralThinkingContext } from './lateral-thinking-agent'
import type { CreativeCandidate } from '../core/creative-ir'

type Concept = CreativeCandidate['concept']

export interface DiscoveryResult {
  candidates: CreativeCandidate[]
  selected: CreativeCandidate
  strategy: 'five-technique-v1'
  failedLenses: Array<{ lensId: string; error: string }>
}

interface Lens {
  id: string
  name: string
  technique: string
  instruction: string
}

const LENSES: Lens[] = [
  { id: 'provocation', name: 'Provocation', technique: 'provocation', instruction: 'Reverse a specific assumption from the provocation, then turn its opportunity into an executable concept.' },
  { id: 'analogy', name: 'Analogy', technique: 'analogies', instruction: 'Build the concept around one supplied cross-domain analogy and translate its shared principle into a clear creative device.' },
  { id: 'random-stimulus', name: 'Random Stimulus', technique: 'randomStimulus', instruction: 'Use the supplied random stimulus and forced connection as the central mechanism; make the connection legible and useful.' },
  { id: 'opposite-thinking', name: 'Opposite Thinking', technique: 'oppositeThinking', instruction: 'Resolve the supplied positive and negative extremes through the desirable middle and its paradox.' },
  { id: 'constraint-reversal', name: 'Constraint Reversal', technique: 'constraintReversal', instruction: 'Turn the supplied constraint and reversal into a practical creative opportunity.' },
]

function lensInsight(insight: unknown, lens: Lens): string {
  const value = insight as { mainInsight?: unknown; lateralThinkingBreakdown?: Record<string, unknown> } | null
  const breakdown = value?.lateralThinkingBreakdown
  const techniqueOutput = breakdown?.[lens.technique]
  if (!techniqueOutput || typeof techniqueOutput !== 'object') {
    throw new Error(`Discovery is missing the ${lens.name} technique output.`)
  }
  return [
    typeof value?.mainInsight === 'string' ? `Strategic context: ${value.mainInsight}` : '',
    `${lens.name} technique output: ${JSON.stringify(techniqueOutput)}`,
    `Apply this technique independently. ${lens.instruction}`,
  ].filter(Boolean).join('\n\n')
}

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
export async function discoverConcepts(
  insight: unknown,
  context: LateralThinkingContext,
  candidateLimit = LENSES.length,
  mapConceptImpl: typeof mapConcept = mapConcept,
): Promise<DiscoveryResult> {
  const count = Math.max(1, Math.min(LENSES.length, Math.floor(candidateLimit)))
  const lenses = LENSES.slice(0, count)
  const generated: Array<{ lens: Lens; concept: Concept }> = []
  const failedLenses: DiscoveryResult['failedLenses'] = []
  const runId = context.runId || randomUUID()

  for (const lens of lenses) {
    const lensContext: LateralThinkingContext = {
      ...context,
      runId,
      promptVersion: context.promptVersion || SYSTEM_PROMPT_VERSION,
      target: `${context.target}\nCreative technique: ${lens.name}. ${lens.instruction}`,
      problem: `${context.problem}\n\nDiscovery technique: ${lens.name}. ${lens.instruction}`,
    }
    try {
      const concept = await mapConceptImpl(lensInsight(insight, lens), lensContext)
      generated.push({ lens, concept })
    } catch (error) {
      failedLenses.push({ lensId: lens.id, error: error instanceof Error ? error.message : String(error) })
    }
  }
  if (!generated.length) {
    throw new Error(`Discovery engine generated no candidates. ${failedLenses.map(item => `${item.lensId}: ${item.error}`).join('; ')}`)
  }

  const insightText = typeof insight === 'string' ? insight : JSON.stringify(insight ?? '')
  const insightWords = words(insightText)
  const candidates: CreativeCandidate[] = generated.map(({ lens, concept }) => {
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
    return {
      id: randomUUID(),
      lens: lens.name,
      lensId: lens.id,
      version: 1,
      runId,
      promptVersion: context.promptVersion || SYSTEM_PROMPT_VERSION,
      concept,
      score,
      rationale,
      origin: 'seed' as const,
      parentIds: [],
      generation: 0,
    }
  }).sort((a, b) => b.score - a.score)

  return { candidates, selected: candidates[0], strategy: 'five-technique-v1', failedLenses }
}
