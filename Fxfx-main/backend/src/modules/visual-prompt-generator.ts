/**
 * Visual Prompt Generator v4
 *
 * What changed vs v3:
 *   - buildTrendVisualInjection now returns newsVisualLayer
 *   - Fallback + AI prompts both inject news visual elements
 *   - palette resolver handles sports/politics/tech event overrides
 *   - trendInfluence field includes live headline source
 */

import { appendUntrustedReferenceData, LateralThinkingContext, getLateralThinkingSystemPrompt } from './lateral-thinking-agent'
import { assertLanguageMatch, parseJsonObject, resolveLanguage } from '../utils/generation'
import { withGatewayTask } from '../gateway/llm-gateway'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface VisualPrompt {
  midjourneyPrompt: string
  negativePrompt:   string
  styleKeywords:    string[]
  colorPalette:     string[]   // hex codes
  mood:             string
  aspectRatio:      '16:9' | '9:16' | '1:1' | '4:5'
  version:          string
  trendInfluence?:  string     // human-readable note on trend + news influence
}

export interface ConceptInput {
  title:         string
  tagline:       string
  coreIdea:      string
  visualNotes?:  string
  emotionalArc?: string
  targetParadox?: string
}

// ─────────────────────────────────────────────
// ARCHETYPE → VISUAL STYLE
// ─────────────────────────────────────────────

const ARCHETYPE_STYLE: Record<string, string> = {
  'The Hero':      'dramatic lighting, epic wide angles, golden hour, high contrast',
  'The Creator':   'studio lighting, creative process, paint textures, artist hands',
  'The Sage':      'clean minimalism, white space, sharp focus, intellectual tone',
  'The Outlaw':    'dark moody lighting, high contrast, raw textures, edgy composition',
  'The Magician':  'mystical light leaks, luminous particles, transformation visuals',
  'The Lover':     'warm candlelight, bokeh, intimate close-ups, rose gold tones',
  'The Everyman':  'natural daylight, authentic candid moments, documentary style',
  'The Jester':    'vibrant colors, dynamic angles, playful unexpected composition',
  'The Caregiver': 'soft warm light, nurturing hands, gentle textures, pastel tones',
  'The Explorer':  'vast landscapes, natural light, adventure textures, earth tones',
  'The Innocent':  'bright clean light, pure whites, simple joyful moments',
  'The Ruler':     'dramatic shadows, luxury materials, architectural precision',
}
const DEFAULT_STYLE = 'cinematic natural lighting, authentic emotion, premium quality'

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

export async function generateVisualPrompt(
  concept: ConceptInput,
  context?: LateralThinkingContext
): Promise<VisualPrompt> {
  if (!context?.provider) throw new Error('An AI provider is required for visual prompt generation.')
  const language = resolveLanguage(JSON.stringify(concept), context.language)
  const generationContext = { ...context, language, useRealAI: true }
  const archetypeStyle = ARCHETYPE_STYLE[context.archetype || ''] || DEFAULT_STYLE
  const response = await context.provider.generateCreativeText(
    appendUntrustedReferenceData(
      `Create visual aesthetics for this concept: ${JSON.stringify(concept)}. Brand archetype style guidance: ${archetypeStyle}. Trend context: ${JSON.stringify(context.currentTrends || null)}.\nReturn JSON with non-empty string fields midjourneyPrompt, negativePrompt, mood, version, trendInfluence; styleKeywords array with 3-5 strings; colorPalette array with 3-5 hex colors; and aspectRatio equal to 16:9, 9:16, 1:1, or 4:5. Write every natural-language field in ${language === 'ar' ? 'fluent Arabic' : 'English'}.`,
      generationContext,
    ),
    `${getLateralThinkingSystemPrompt(generationContext)}\n\nYou are the visual art director. Specify subject, environment, light direction, lens, textures, color temperature, and mood. Return valid JSON only.`,
    withGatewayTask(context.providerConfig, 'utility')
  )
  const parsed = parseJsonObject<Record<string, unknown>>(response.text, 'Visual prompt generation')
  for (const field of ['midjourneyPrompt', 'negativePrompt', 'mood', 'version', 'trendInfluence']) {
    if (typeof parsed[field] !== 'string' || !parsed[field].trim()) {
      throw new Error(`Visual prompt generation: Gemini omitted required field "${field}".`)
    }
  }
  const validStringArray = (value: unknown, minLength: number, maxLength: number): value is string[] =>
    Array.isArray(value) && value.length >= minLength && value.length <= maxLength
      && value.every(item => typeof item === 'string' && item.trim())
  if (!validStringArray(parsed.styleKeywords, 3, 5)
      || !validStringArray(parsed.colorPalette, 3, 5)
      || !parsed.colorPalette.every(color => /^#[0-9a-f]{6}$/i.test(color))) {
    throw new Error('Visual prompt generation: Gemini returned incomplete visual arrays.')
  }
  if (!['16:9', '9:16', '1:1', '4:5'].includes(String(parsed.aspectRatio))) {
    throw new Error('Visual prompt generation: Gemini returned an unsupported aspectRatio.')
  }
  assertLanguageMatch(parsed, language, 'Visual prompt generation')
  return parsed as unknown as VisualPrompt
}

// ─────────────────────────────────────────────
// FORMAT: Copy-paste ready Midjourney string
// ─────────────────────────────────────────────

export function formatForMidjourney(vp: VisualPrompt): string {
  const negative = vp.negativePrompt ? ` --no ${vp.negativePrompt}` : ''
  return `${vp.midjourneyPrompt}${negative}`
}
