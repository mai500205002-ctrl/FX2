/**
 * Lateral Thinking Agent v4 — Live Context Debate
 *
 * What changed vs v3:
 *   - Strategy Master now cites a REAL headline in their Trend Round
 *   - Debate prompt passes liveContext.strategicAngle verbatim
 *   - trendConnection in output includes the live event reference
 *   - ✨ NEW (v4.1): Constraint Reversal added as 5th technique (active AI function)
 */

import { generateVisualPrompt, VisualPrompt, ConceptInput } from './visual-prompt-generator'
import { TrendBundle, buildTrendInjectionBlock } from './trend-service'
import { assertLanguageMatch, parseJsonObject, resolveLanguage } from '../utils/generation'
import { withGatewayTask } from '../gateway/llm-gateway'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface LateralThinkingContext {
  domain: string
  problem: string
  target: string
  emotionalContext?: string
  language?: 'en' | 'ar'
  runId?: string
  promptVersion?: string
  useRealAI?: boolean
  knowledgePrompt?: string
  archetype?: string
  brandVoice?: {
    formalLevel: number
    metaphorLevel: number
    intensity: number
    tone?: string
  }
  provider?: any
  providerConfig?: any
  currentTrends?: TrendBundle
}

export interface ProvocationResult {
  provocation: string; reversal: string; opportunity: string; creativeInsight: string
}
export interface AnalogyResult {
  sourceField: string; sharedPrinciple: string; application: string; metaphor: string
}
export interface RandomStimulusResult {
  randomWord: string; forcedConnection: string; visualMetaphor: string; unexpectedAngle: string
}
export interface OppositeThinkingResult {
  extremePositive: string; extremeNegative: string; desirableMiddle: string; paradox: string
}
export interface ConstraintReversalResult {
  constraint: string; reversal: string; opportunity: string; insight: string
}

export interface AgentVoice {
  agent: 'Creative Rebel' | 'Strategy Master' | 'Picky Client'
  stance: string
  sharpCritique: string
  contribution: string
  trendAngle?: string
  liveEventCite?: string   // ← NEW: "بما إن النهاردة حصل..."
}

export interface AgentDebateResult {
  voices: AgentVoice[]
  conflictPoint: string
  resolution: string
  debateSummary: string
  trendConnection: string
  liveEventUsed?: string   // ← NEW: which headline was woven in
  finalMasterpiece: {
    headline: string
    tagline: string
    coreIdea: string
    emotionalTruth: string
    creativeDevice: string
    visualNotes: string
  }
}

export interface LateralThinkingOutput {
  provocation: ProvocationResult
  analogies: AnalogyResult[]
  randomStimulus: RandomStimulusResult
  oppositeThinking: OppositeThinkingResult
  constraintReversal: ConstraintReversalResult
  synthesizedInsight: string
  creativeBreakthrough: string
  agentDebate: AgentDebateResult
  visualPrompt: VisualPrompt
}

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────

/** Versioned system prompt: this version identifier is recorded in every run's provenance.
 * Prompt content changes bump this version independently of schema changes. */
export const SYSTEM_PROMPT_VERSION = '1.0.0' as const

export function getLateralThinkingSystemPrompt(context?: LateralThinkingContext): string {
  const language  = context?.language  || 'en'
  const archetype = context?.archetype || 'The Everyman'
  const voice     = context?.brandVoice || { formalLevel: 5, metaphorLevel: 5, intensity: 5 }
  const archetypeVoice: Record<string, { en: string; ar: string }> = {
    'The Sage': { en: 'philosophical, truth-seeking, precise, and insight-led', ar: 'فلسفي، باحث عن الحقيقة، دقيق، ومنطلق من البصيرة' },
    'The Magician': { en: 'transformative, evocative, possibility-driven, and quietly wondrous', ar: 'تحويلي، موحٍ، يفتح الاحتمالات، ويصنع الدهشة بهدوء' },
    'The Outlaw': { en: 'rebellious, provocative, anti-conformist, and willing to challenge power', ar: 'متمرد، استفزازي، رافض للامتثال، ومستعد لمساءلة السائد' },
  }
  const archetypeCharacter = archetypeVoice[archetype] || {
    en: `distinctive to ${archetype}; express its defining values in the idea and voice`,
    ar: `متفرد بشخصية ${archetype}؛ أظهر قيمها في الفكرة والصوت`,
  }
  const tone = voice.tone || (voice.formalLevel > 7 ? 'formal' : voice.formalLevel < 3 ? 'conversational' : 'balanced')

  const trendBlock = context?.currentTrends
    ? buildTrendInjectionBlock(context.currentTrends, language) : ''

  // knowledgePrompt carries the reworkDirective from the Orchestrator on iteration 2+
  // Prepended to system prompt so EVERY technique + debate sees the fix directive
  const reworkBlock = context?.knowledgePrompt ? `\n${context.knowledgePrompt}` : ''

  if (language === 'ar') {
    return `أنت مدير إبداعي عالمي متخصص في التفكير الجانبي.
دورك: قلب الطاولة على الافتراضات التقليدية.

[BRAND PERSONALITY]
      - النمط: ${archetype} (${archetypeCharacter.ar})
      - النبرة المختارة: ${tone}; الرسمية ${voice.formalLevel}/10
      - كثافة الاستعارة: ${voice.metaphorLevel}/10
      - الشدة الإبداعية: ${voice.intensity}/10
      - اكتب كل القيم النصية في JSON بعربية فصيحة وحيوية فقط، مع الحفاظ على أسماء العلامات التجارية كما هي.
${trendBlock}${reworkBlock}
أعد JSON فقط — بدون شرح.`
  }

  return `You are a Creative Director trained in lateral thinking.
Think SIDEWAYS, not forward.
Archetype: ${archetype} (${archetypeCharacter.en})
Tone: ${tone} | Formality: ${voice.formalLevel}/10 | Metaphor scale: ${voice.metaphorLevel}/10 | Intensity: ${voice.intensity}/10
Write all natural-language JSON values in fluent English only.
${trendBlock}${reworkBlock}
Return JSON only.`
}

async function generateJson<T extends object = Record<string, unknown>>(
  context: LateralThinkingContext,
  label: string,
  prompt: string,
  requiredFields: string[]
): Promise<T> {
  if (!context.provider || typeof context.provider.generateCreativeText !== 'function') {
    throw new Error(`${label}: Gemini provider is required.`)
  }
  const response = await context.provider.generateCreativeText(
    prompt,
    getLateralThinkingSystemPrompt({ ...context, useRealAI: true }),
    withGatewayTask(context.providerConfig, 'candidate-generation')
  )
  const parsed = parseJsonObject<Record<string, unknown>>(response.text, label)
  for (const field of requiredFields) {
    const value = parsed[field]
    const valid = typeof value === 'string'
      ? !!value.trim()
      : Array.isArray(value)
        ? value.length > 0
        : !!value && typeof value === 'object'
    if (!valid) {
      throw new Error(`${label}: Gemini omitted required field "${field}".`)
    }
  }
  assertLanguageMatch(parsed, context.language || 'en', label)
  return parsed as unknown as T
}

// ─────────────────────────────────────────────
// TECHNIQUES  (4 original + NEW 5th: Constraint Reversal)
// ─────────────────────────────────────────────

export async function generateProvocation(c: LateralThinkingContext): Promise<ProvocationResult> {
  const trend = c.currentTrends ? `\nTrend context: ${c.currentTrends.primary.keyword}` : ''
  return await generateJson<ProvocationResult>(c, 'Provocation',
    `Use provocation to reverse an assumption in this brief. Domain: ${c.domain}. Problem: ${c.problem}. Audience: ${c.target}.${trend}\nReturn JSON with non-empty string fields provocation, reversal, opportunity, and creativeInsight.`,
    ['provocation', 'reversal', 'opportunity', 'creativeInsight']) as ProvocationResult
}

export async function generateAnalogies(c: LateralThinkingContext): Promise<AnalogyResult[]> {
  const result = await generateJson<{ analogies: unknown[] }>(c, 'Analogy generation',
    `Create original cross-domain analogies for this brief. Domain: ${c.domain}. Problem: ${c.problem}. Audience: ${c.target}.\nReturn JSON with an analogies array containing at least one object with non-empty string fields sourceField, sharedPrinciple, application, and metaphor.`,
    ['analogies'])
  if (!Array.isArray(result.analogies) || !result.analogies.length) throw new Error('Analogy generation: Gemini returned no analogies.')
  for (const analogy of result.analogies) {
    if (!analogy || typeof analogy !== 'object' || ['sourceField', 'sharedPrinciple', 'application', 'metaphor'].some(field => typeof (analogy as Record<string, unknown>)[field] !== 'string')) {
      throw new Error('Analogy generation: Gemini returned an invalid analogy.')
    }
  }
  return result.analogies as AnalogyResult[]
}

export async function generateRandomStimulus(c: LateralThinkingContext): Promise<RandomStimulusResult> {
  return await generateJson<RandomStimulusResult>(c, 'Random-stimulus generation',
    `Choose an unexpected random stimulus and connect it creatively to this brief. Domain: ${c.domain}. Problem: ${c.problem}.\nReturn JSON with non-empty string fields randomWord, forcedConnection, visualMetaphor, and unexpectedAngle.`,
    ['randomWord', 'forcedConnection', 'visualMetaphor', 'unexpectedAngle']) as RandomStimulusResult
}

export async function generateOppositeThinking(c: LateralThinkingContext): Promise<OppositeThinkingResult> {
  return await generateJson<OppositeThinkingResult>(c, 'Opposite-thinking generation',
    `Explore the positive and negative extremes of this brief, then find the useful paradoxical middle. Problem: ${c.problem}. Audience: ${c.target}.\nReturn JSON with non-empty string fields extremePositive, extremeNegative, desirableMiddle, and paradox.`,
    ['extremePositive', 'extremeNegative', 'desirableMiddle', 'paradox']) as OppositeThinkingResult
}

export async function generateConstraintReversal(c: LateralThinkingContext): Promise<ConstraintReversalResult> {
  const trend = c.currentTrends ? `\nTrend context: ${c.currentTrends.primary.keyword}` : ''
  return await generateJson<ConstraintReversalResult>(c, 'Constraint-reversal generation',
    `Turn the constraint itself into a solution. Domain: ${c.domain}. Constraint: ${c.problem}. Audience: ${c.target}.${trend}\nReturn JSON with non-empty string fields constraint, reversal, opportunity, and insight.`,
    ['constraint', 'reversal', 'opportunity', 'insight']) as ConstraintReversalResult
}

// ─────────────────────────────────────────────
// AGENT DEBATE
// ─────────────────────────────────────────────

async function runAgentDebate(
  raw: Omit<LateralThinkingOutput, 'agentDebate' | 'visualPrompt'>,
  ctx: LateralThinkingContext
): Promise<AgentDebateResult> {
  const result = await generateJson<AgentDebateResult>(ctx, 'Creative debate',
    `Create a useful internal debate between Creative Rebel, Strategy Master, and Picky Client based on this context: ${JSON.stringify({ context: { domain: ctx.domain, problem: ctx.problem, target: ctx.target, trends: ctx.currentTrends }, outputs: raw })}.\nReturn exactly this JSON shape; preserve every property name in English and fill every placeholder with generated content:\n{"voices":[{"agent":"Creative Rebel","stance":"...","sharpCritique":"...","contribution":"..."},{"agent":"Strategy Master","stance":"...","sharpCritique":"...","contribution":"...","trendAngle":"...","liveEventCite":"..."},{"agent":"Picky Client","stance":"...","sharpCritique":"...","contribution":"..."}],"conflictPoint":"...","resolution":"...","debateSummary":"...","trendConnection":"...","liveEventUsed":"...","finalMasterpiece":{"headline":"...","tagline":"...","coreIdea":"...","emotionalTruth":"...","creativeDevice":"...","visualNotes":"..."}}. All natural-language values must follow the requested output language.`,
    ['voices', 'conflictPoint', 'resolution', 'debateSummary', 'trendConnection', 'finalMasterpiece'])
  if (!Array.isArray(result.voices) || result.voices.length < 3) {
    throw new Error('Creative debate: Gemini must return three voices.')
  }
  const masterpiece = result.finalMasterpiece as Record<string, unknown>
  for (const field of ['headline', 'tagline', 'coreIdea', 'emotionalTruth', 'creativeDevice', 'visualNotes']) {
    if (typeof masterpiece[field] !== 'string' || !masterpiece[field]) {
      throw new Error(`Creative debate: Gemini omitted finalMasterpiece.${field}.`)
    }
  }
  return result
}

// ─────────────────────────────────────────────
// SYNTHESIZE — Now with all 5 techniques
// ─────────────────────────────────────────────

export async function synthesizeLateralThinking(
  ctx: LateralThinkingContext
): Promise<LateralThinkingOutput> {
  const language = resolveLanguage([ctx.domain, ctx.problem, ctx.target].join('\n'), ctx.language)
  const generationContext = { ...ctx, language, useRealAI: true }

  const [provocation, analogies, randomStimulus, oppositeThinking, constraintReversal] = await Promise.all([
    generateProvocation(generationContext),
    generateAnalogies(generationContext),
    generateRandomStimulus(generationContext),
    generateOppositeThinking(generationContext),
    generateConstraintReversal(generationContext),
  ])

  const synthesis = await generateJson<{ synthesizedInsight: string; creativeBreakthrough: string }>(
    generationContext,
    'Insight synthesis',
    `Synthesize these five lateral-thinking outputs into one coherent strategic insight and one original creative breakthrough: ${JSON.stringify({ provocation, analogies, randomStimulus, oppositeThinking, constraintReversal })}.\nReturn JSON with non-empty string fields synthesizedInsight and creativeBreakthrough.`,
    ['synthesizedInsight', 'creativeBreakthrough']
  )

  const raw = { provocation, analogies, randomStimulus, oppositeThinking, constraintReversal, ...synthesis }

  const agentDebate = await runAgentDebate(raw, generationContext)

  const mp = agentDebate.finalMasterpiece
  const visualPrompt = await generateVisualPrompt(
    { title: mp.headline, tagline: mp.tagline, coreIdea: mp.coreIdea, visualNotes: mp.visualNotes, emotionalArc: mp.emotionalTruth },
    generationContext
  )

  return { ...raw, agentDebate, visualPrompt }
}
