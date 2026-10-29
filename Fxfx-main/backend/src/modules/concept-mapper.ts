import { LateralThinkingContext, getLateralThinkingSystemPrompt } from './lateral-thinking-agent'
import { assertLanguageMatch, parseJsonObject, resolveLanguage } from '../utils/generation'
import { withGatewayTask } from '../gateway/llm-gateway'
import { extractEvidenceReferences, formatUntrustedEvidence } from '../browser/reference-context'

/**
 * Concept Mapper with Advanced Lateral Thinking
 */

interface ConceptOutput {
  title: string
  tagline: string
  coreIdea: string
  visualNotes: string
  creativeDevice: string
  emotionalArc: string
  targetParadox: string
  lateralThinkingTechniques: string[]
  evidenceReferences?: ReturnType<typeof extractEvidenceReferences>
}


export async function mapConcept(insight: any, context?: LateralThinkingContext): Promise<ConceptOutput> {
  const insightText = typeof insight === 'string'
    ? insight
    : [insight?.mainInsight, insight?.insight].filter((value): value is string => typeof value === 'string').join('\n')
  if (!insightText.trim()) throw new Error('Concept generation requires a non-empty insight.')
  if (!context?.provider) throw new Error('An AI provider is required for concept generation.')

  const language = resolveLanguage(insightText, context.language)
  const generationContext = { ...context, language, useRealAI: true }
  const evidenceReferences = extractEvidenceReferences(insight)
  const evidenceContext = formatUntrustedEvidence(evidenceReferences)
  const response = await context.provider.generateCreativeText(
    `Transform this strategic insight into an original creative concept.\nInsight:\n${insightText}\n${evidenceContext ? `\n${evidenceContext}\n` : ''}\nReturn a JSON object with non-empty string fields title, tagline, coreIdea, visualNotes, creativeDevice, emotionalArc, targetParadox, and an array lateralThinkingTechniques. All field values must be written in ${language === 'ar' ? 'fluent Arabic' : 'English'}.`,
    `${getLateralThinkingSystemPrompt(generationContext)}\n\nSpecific task: Create a distinctive strategic concept, including visual aesthetics and the emotional paradox.`,
    withGatewayTask(context.providerConfig, 'candidate-generation')
  )
  const parsed = parseJsonObject<ConceptOutput>(response.text, 'Concept generation')
  const requiredText = ['title', 'tagline', 'coreIdea', 'visualNotes', 'creativeDevice', 'emotionalArc', 'targetParadox'] as const
  for (const field of requiredText) {
    if (typeof parsed[field] !== 'string' || !parsed[field].trim()) {
      throw new Error(`Concept generation: Gemini omitted required field "${field}".`)
    }
  }
  if (!Array.isArray(parsed.lateralThinkingTechniques)
      || !parsed.lateralThinkingTechniques.length
      || !parsed.lateralThinkingTechniques.every(value => typeof value === 'string' && value.trim())) {
    throw new Error('Concept generation: Gemini omitted lateralThinkingTechniques.')
  }
  assertLanguageMatch(parsed, language, 'Concept generation')
  return { ...parsed, evidenceReferences }
}
