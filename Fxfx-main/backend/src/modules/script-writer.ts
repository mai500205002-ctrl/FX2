import { LateralThinkingContext, getLateralThinkingSystemPrompt } from './lateral-thinking-agent'
import { assertLanguageMatch, parseJsonObject, resolveLanguage } from '../utils/generation'
import { withGatewayTask } from '../gateway/llm-gateway'
import { extractEvidenceReferences, formatUntrustedEvidence } from '../browser/reference-context'

/**
 * Script Writer with Advanced Lateral Thinking
 */

interface ScriptOutput {
  script: string
  beats: string[]
  cameraLanguage: string
  narrativeStrategy: string
  emotionalTurning: string
  lateralThinkingTechniques: string[]
  evidenceReferences?: ReturnType<typeof extractEvidenceReferences>
}


export async function writeScript(concept: any, context?: LateralThinkingContext, revisionBrief?: string[]): Promise<ScriptOutput> {
  if (!concept || typeof concept !== 'object') throw new Error('Script generation requires a concept object.')
  if (!context?.provider) throw new Error('An AI provider is required for script generation.')
  const conceptText = [concept.title, concept.tagline, concept.coreIdea].filter((value): value is string => typeof value === 'string').join('\n')
  if (!conceptText.trim()) throw new Error('Script generation requires concept title, tagline, or core idea.')

  const language = resolveLanguage(conceptText, context.language)
  const generationContext = { ...context, language, useRealAI: true }
  const evidenceReferences = extractEvidenceReferences(concept)
  const evidenceContext = formatUntrustedEvidence(evidenceReferences)
  const response = await context.provider.generateCreativeText(
    `Write a cinematic 30-second screenplay based on this approved concept.\n${conceptText}\n${evidenceContext ? `\n${evidenceContext}\n` : ''}\nUse three story beats: recognition, transformation, and arrival. ${revisionBrief?.length ? `This is a targeted revision. Address these editor notes without abandoning the approved concept: ${revisionBrief.join('; ')}. Improve the actual story rather than merely adding exposition.` : ''} Return exactly this JSON shape and preserve all property names in English: {"script":"complete screenplay","beats":["recognition","transformation","arrival"],"cameraLanguage":"...","narrativeStrategy":"...","emotionalTurning":"...","lateralThinkingTechniques":["..."]}. Every natural-language value must be in ${language === 'ar' ? 'fluent Arabic' : 'English'}.`,
    `${getLateralThinkingSystemPrompt(generationContext)}\n\nSpecific task: Write a distinctive cinematic script with emotionally precise pacing and visual storytelling.`,
    withGatewayTask(context.providerConfig, 'final-artifact')
  )
  const parsed = parseJsonObject<ScriptOutput>(response.text, 'Script generation')
  for (const field of ['script', 'cameraLanguage', 'narrativeStrategy', 'emotionalTurning'] as const) {
    if (typeof parsed[field] !== 'string' || !parsed[field].trim()) {
      throw new Error(`Script generation: Gemini omitted required field "${field}".`)
    }
  }
  if (!Array.isArray(parsed.beats) || parsed.beats.length < 3 || !parsed.beats.every(beat => typeof beat === 'string' && beat.trim())) {
    throw new Error('Script generation: Gemini must return at least three non-empty beats.')
  }
  if (!Array.isArray(parsed.lateralThinkingTechniques)
      || !parsed.lateralThinkingTechniques.length
      || !parsed.lateralThinkingTechniques.every(technique => typeof technique === 'string' && technique.trim())) {
    throw new Error('Script generation: Gemini omitted lateralThinkingTechniques.')
  }
  assertLanguageMatch(parsed, language, 'Script generation')
  return { ...parsed, evidenceReferences }
}
