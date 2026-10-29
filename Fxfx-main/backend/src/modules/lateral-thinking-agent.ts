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
  untrustedReferenceData?: string
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

export function appendUntrustedReferenceData(prompt: string, context: LateralThinkingContext): string {
  return context.untrustedReferenceData?.trim()
    ? `${prompt}\n\n${context.untrustedReferenceData}`
    : prompt
}

async function generateJson<T extends object = Record<string, unknown>>(
  context: LateralThinkingContext,
  label: string,
  prompt: string,
  requiredFields: string[]
): Promise<T> {
  if (!context.provider || typeof context.provider.generateCreativeText !== 'function') {
    throw new Error(`${label}: an AI provider is required.`)
  }
  const response = await context.provider.generateCreativeText(
    appendUntrustedReferenceData(prompt, context),
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
      throw new Error(`${label}: provider omitted required field "${field}".`)
    }
  }
  assertLanguageMatch(parsed, context.language || 'en', label)
  return parsed as T
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
    if (!analogy || typeof analogy !== 'object' || ['sourceField', 'sharedPrinciple', 'application', 'metaphor'].some(field => {
      const value = (analogy as Record<string, unknown>)[field]
      return typeof value !== 'string' || !value.trim()
    })) {
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
  const debateContext = {
    synthesizedInsight: raw.synthesizedInsight,
    creativeBreakthrough: raw.creativeBreakthrough,
    provocation: raw.provocation.creativeInsight,
    analogy: raw.analogies[0].metaphor,
    unexpectedAngle: raw.randomStimulus.unexpectedAngle,
    paradox: raw.oppositeThinking.paradox,
    reversedConstraint: raw.constraintReversal.insight,
  }
  const result = await generateJson<AgentDebateResult>(ctx, 'Creative debate',
    `Create a concise debate between Creative Rebel, Strategy Master, and Picky Client. Use only the following validated strategic inputs: ${JSON.stringify(debateContext)}. Keep every natural-language value to at most 8 words; use empty strings only for live-event fields when no event exists. Return exactly this JSON shape, with the three named voices in order and every other field a non-empty string:\n{"voices":[{"agent":"Creative Rebel","stance":"...","sharpCritique":"...","contribution":"..."},{"agent":"Strategy Master","stance":"...","sharpCritique":"...","contribution":"...","trendAngle":"...","liveEventCite":"..."},{"agent":"Picky Client","stance":"...","sharpCritique":"...","contribution":"..."}],"conflictPoint":"...","resolution":"...","debateSummary":"...","trendConnection":"...","liveEventUsed":"","finalMasterpiece":{"headline":"...","tagline":"...","coreIdea":"...","emotionalTruth":"...","creativeDevice":"...","visualNotes":"..."}}. All natural-language values must follow the requested output language.`,
    ['voices', 'conflictPoint', 'resolution', 'debateSummary', 'trendConnection', 'finalMasterpiece'])
  if (!Array.isArray(result.voices) || result.voices.length !== 3) {
    throw new Error('Creative debate: provider must return exactly three voices.')
  }
  const voiceFields = ['stance', 'sharpCritique', 'contribution']
  const expectedAgents = ['Creative Rebel', 'Strategy Master', 'Picky Client']
  result.voices.forEach((value, index) => {
    if (!value || typeof value !== 'object' || value.agent !== expectedAgents[index]) {
      throw new Error(`Creative debate: voice ${index + 1} has an invalid agent.`)
    }
    for (const field of voiceFields) {
      const fieldValue = value[field as keyof AgentVoice]
      if (typeof fieldValue !== 'string' || !fieldValue.trim()) {
        throw new Error(`Creative debate: voice ${index + 1} omitted ${field}.`)
      }
    }
  })
  const strategyVoice = result.voices[1]
  for (const field of ['trendAngle', 'liveEventCite'] as const) {
    if (typeof strategyVoice[field] !== 'string') {
      throw new Error(`Creative debate: Strategy Master omitted ${field}.`)
    }
  }
  for (const field of ['conflictPoint', 'resolution', 'debateSummary', 'trendConnection'] as const) {
    if (typeof result[field] !== 'string' || !result[field].trim()) {
      throw new Error(`Creative debate: provider omitted ${field}.`)
    }
  }
  if (typeof result.liveEventUsed !== 'string') {
    throw new Error('Creative debate: provider omitted liveEventUsed.')
  }
  const masterpiece = result.finalMasterpiece
  if (!masterpiece || typeof masterpiece !== 'object') {
    throw new Error('Creative debate: provider omitted finalMasterpiece.')
  }
  for (const field of ['headline', 'tagline', 'coreIdea', 'emotionalTruth', 'creativeDevice', 'visualNotes']) {
    const value = masterpiece[field as keyof typeof masterpiece]
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`Creative debate: provider omitted finalMasterpiece.${field}.`)
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

  const parentSignal = generationContext.providerConfig?.signal as AbortSignal | undefined
  const controller = new AbortController()
  const abortFromParent = () => controller.abort(parentSignal?.reason)
  parentSignal?.addEventListener('abort', abortFromParent, { once: true })
  const taskContext = {
    ...generationContext,
    providerConfig: generationContext.providerConfig
      ? { ...generationContext.providerConfig, signal: controller.signal }
      : generationContext.providerConfig,
  }
  let provocation: ProvocationResult
  let analogies: AnalogyResult[]
  let randomStimulus: RandomStimulusResult
  let oppositeThinking: OppositeThinkingResult
  let constraintReversal: ConstraintReversalResult
  try {
    [provocation, analogies, randomStimulus, oppositeThinking, constraintReversal] = await Promise.all([
      generateProvocation(taskContext),
      generateAnalogies(taskContext),
      generateRandomStimulus(taskContext),
      generateOppositeThinking(taskContext),
      generateConstraintReversal(taskContext),
    ])
  } catch (error) {
    controller.abort(error)
    throw error
  } finally {
    parentSignal?.removeEventListener('abort', abortFromParent)
  }

  const synthesis = await generateJson<{ synthesizedInsight: string; creativeBreakthrough: string }>(
    taskContext,
    'Insight synthesis',
    `Synthesize these five lateral-thinking outputs into one coherent strategic insight and one original creative breakthrough: ${JSON.stringify({ provocation, analogies, randomStimulus, oppositeThinking, constraintReversal })}.\nReturn JSON with non-empty string fields synthesizedInsight and creativeBreakthrough.`,
    ['synthesizedInsight', 'creativeBreakthrough']
  )

  const raw = { provocation, analogies, randomStimulus, oppositeThinking, constraintReversal, ...synthesis }

  const agentDebate = await runAgentDebate(raw, taskContext)

  const mp = agentDebate.finalMasterpiece
  const visualPrompt = await generateVisualPrompt(
    { title: mp.headline, tagline: mp.tagline, coreIdea: mp.coreIdea, visualNotes: mp.visualNotes, emotionalArc: mp.emotionalTruth },
    taskContext
  )

  return { ...raw, agentDebate, visualPrompt }
}
