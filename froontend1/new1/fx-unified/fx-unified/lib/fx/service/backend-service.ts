import type {
  Brief,
  EngineId,
  Idea,
  Locale,
  Project,
  Script,
  Strategy,
} from '../types'
import {
  api,
  BackendError,
  type BackendConcept,
  type BackendInsight,
  type BackendScript,
} from '../backend-api'
import type { FxService, RequestOptions } from './contract'
import { FxServiceError, progressSteps } from './contract'

/* ───────────────────────── mappers (exported: the Agent view reuses them) ─────────────────────── */

const estimateTokens = (...parts: unknown[]) =>
  Math.ceil(parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p ?? ''))).join('').length / 4)

export function briefToText(b: Brief): string {
  return [
    `Project: ${b.project}`,
    `Brand: ${b.brand}`,
    `Product: ${b.product}`,
    `Objective: ${b.objective}`,
    `Audience: ${b.audience}`,
    `Challenge: ${b.challenge}`,
    `Context: ${b.context}`,
    `Requirements: ${b.requirements}`,
  ]
    .filter((l) => !/:\s*$/.test(l))
    .join('\n')
}

export function insightToStrategy(i: BackendInsight): Strategy {
  return {
    insight: i.mainInsight ?? '',
    audienceInsight: i.emotionalTruth ?? '',
    tension: (i.constraints ?? []).join(' · '),
    opportunity: (i.opportunities ?? []).join(' · '),
    territory: i.metaphoricFraming ?? '',
    direction: i.creativeMethod ?? '',
  }
}

/** Rebuild the backend's insight shape from the (user-editable) strategy fields. */
function strategyToInsight(s: Strategy): BackendInsight {
  return {
    mainInsight: s.insight,
    emotionalTruth: s.audienceInsight,
    constraints: s.tension ? [s.tension] : [],
    opportunities: s.opportunity ? [s.opportunity] : [],
    metaphoricFraming: s.territory,
    creativeMethod: s.direction,
  }
}

let ideaCounter = 0
export function conceptToIdea(c: BackendConcept, engine: EngineId): Idea {
  // The backend returns no score. Estimate from technique richness; shown as a soft signal only.
  const techniques = c.lateralThinkingTechniques?.length ?? 0
  return {
    id: `idea_${Date.now().toString(36)}_${(ideaCounter++).toString(36)}`,
    engine,
    bigIdea: c.title ?? '',
    territory: c.targetParadox ?? '',
    theme: c.creativeDevice ?? '',
    hook: c.tagline ?? '',
    message: c.coreIdea ?? '',
    score: Math.min(95, 68 + techniques * 6 + Math.min(10, Math.floor((c.coreIdea?.length ?? 0) / 40))),
    version: 1,
    refinements: [],
  }
}

function ideaToConcept(idea: Idea): BackendConcept {
  return {
    title: idea.bigIdea,
    tagline: idea.hook,
    coreIdea: idea.message,
    visualNotes: '',
    creativeDevice: idea.theme,
    emotionalArc: '',
    targetParadox: idea.territory,
    lateralThinkingTechniques: [],
  }
}

const BEAT_LABELS: Record<Locale, string[]> = {
  en: ['Recognition', 'Surrender', 'Arrival'],
  ar: ['الإدراك', 'الاستسلام', 'الوصول'],
}

let sceneCounter = 0
export function scriptToScript(s: BackendScript, idea: { bigIdea: string; hook: string }, locale: Locale): Script {
  const beats = s.beats?.length ? s.beats : [s.script]
  const per = Math.max(3, Math.round(30 / beats.length))
  return {
    title: idea.bigIdea,
    logline: idea.hook || s.narrativeStrategy || '',
    scenes: beats.map((beat, i) => ({
      id: `scene_${Date.now().toString(36)}_${(sceneCounter++).toString(36)}`,
      duration: per,
      scene: BEAT_LABELS[locale][i] ?? `${i + 1}`,
      action: beat,
      visual: beat,
      camera: s.cameraLanguage ?? '',
      dialogue: '',
      voiceover: i === 0 ? (s.narrativeStrategy ?? '') : '',
      music: i === beats.length - 1 ? (s.emotionalTurning ?? '') : '',
      sound: '',
    })),
  }
}

/* ───────────────────────── transport ───────────────────────── */

const ENGINE_ORDER: EngineId[] = ['provocation', 'analogies', 'random', 'opposite', 'constraint']

async function call<T>(
  path: string,
  body: Record<string, unknown>,
  opts: RequestOptions | undefined,
  steps: number,
  progress = true,
): Promise<T> {
  if (progress) opts?.onProgress?.(0)
  let step = 0
  const ticker =
    progress && steps > 1
      ? setInterval(() => {
          step = Math.min(step + 1, steps - 1)
          opts?.onProgress?.(step)
        }, 2500)
      : undefined
  try {
    return await api<T>(path, { method: 'POST', json: body, signal: opts?.signal })
  } catch (e) {
    if (e instanceof BackendError) throw new FxServiceError(e.message, e.status)
    throw e
  } finally {
    if (ticker) clearInterval(ticker)
  }
}

/**
 * Some backend builds only accept strings on /concept and /script (the sanitizer
 * rejects objects). Try the structured payload first, then degrade to flat text.
 */
async function callFlexible<T>(
  path: string,
  key: 'insight' | 'concept',
  structured: object,
  flat: string,
  rest: Record<string, unknown>,
  opts: RequestOptions | undefined,
  steps: number,
  progress = true,
): Promise<T> {
  try {
    return await call<T>(path, { [key]: structured, ...rest }, opts, steps, progress)
  } catch (e) {
    if (e instanceof FxServiceError && e.status === 400) {
      return call<T>(path, { [key]: flat, ...rest }, opts, steps, false)
    }
    throw e
  }
}

const voice = { formalLevel: 6, metaphorLevel: 7, intensity: 6 }

export function createBackendService(): FxService {
  const oneConcept = async (
    brief: Brief,
    strategy: Strategy,
    engine: EngineId,
    locale: Locale,
    opts: RequestOptions | undefined,
    progress: boolean,
  ) => {
    const insight = strategyToInsight(strategy)
    const flat = `${strategy.insight}\n${strategy.audienceInsight}\n${strategy.territory}\n${strategy.direction}\nBrand: ${brief.brand}`
    const c = await callFlexible<BackendConcept>(
      '/concept',
      'insight',
      insight,
      flat,
      { archetype: engine, brandVoice: voice, language: locale },
      opts,
      progressSteps.ideas.length,
      progress,
    )
    return { idea: conceptToIdea(c, engine), raw: c }
  }

  return {
    async generateStrategy({ brief, locale }, opts) {
      const text = briefToText(brief)
      const data = await call<BackendInsight>(
        '/insight',
        { brief: text, brandVoice: voice, language: locale },
        opts,
        progressSteps.strategy.length,
      )
      return { data: insightToStrategy(data), usage: { tokens: estimateTokens(text, data) } }
    },

    async generateIdeas({ brief, strategy, engines, locale, count }, opts) {
      opts?.onProgress?.(0)
      const picks = Array.from({ length: count }, (_, i) => engines[i % Math.max(1, engines.length)] ?? ENGINE_ORDER[i])
      const settled = await Promise.allSettled(
        picks.map((engine, i) => oneConcept(brief, strategy, engine, locale, opts, i === 0)),
      )
      const ok = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
      if (!ok.length) {
        const first = settled.find((r): r is PromiseRejectedResult => r.status === 'rejected')
        throw first?.reason ?? new FxServiceError('no ideas generated')
      }
      return { data: ok.map((o) => o.idea), usage: { tokens: estimateTokens(strategy, ok.map((o) => o.raw)) } }
    },

    async regenerateIdea({ brief, strategy, engines, locale, idea, excludeEngines }, opts) {
      const pool = (engines.length ? engines : ENGINE_ORDER).filter((e) => !excludeEngines.includes(e))
      const engine = pool[0] ?? idea.engine
      const { idea: next, raw } = await oneConcept(brief, strategy, engine, locale, opts, true)
      return { data: { ...next, id: idea.id, version: idea.version + 1 }, usage: { tokens: estimateTokens(strategy, raw) } }
    },

    async refineIdea({ idea, instruction, locale }, opts) {
      // No dedicated endpoint: steer the concept mapper with the instruction.
      const flat = `${idea.bigIdea}\n${idea.message}\nRefine: ${instruction}`
      const c = await callFlexible<BackendConcept>(
        '/concept',
        'insight',
        { mainInsight: `${idea.message} — ${instruction}`, metaphoricFraming: idea.theme, emotionalTruth: idea.territory },
        flat,
        { archetype: idea.engine, brandVoice: voice, language: locale },
        opts,
        progressSteps.refineIdea.length,
      )
      const next = conceptToIdea(c, idea.engine)
      return {
        data: { ...next, id: idea.id, version: idea.version + 1, refinements: [...idea.refinements, instruction] },
        usage: { tokens: estimateTokens(idea, c) },
      }
    },

    async generateScript({ brief, idea, locale }, opts) {
      const concept = ideaToConcept(idea)
      const flat = `Title: ${concept.title}\nTagline: ${concept.tagline}\nCore idea: ${concept.coreIdea}`
      const s = await callFlexible<BackendScript>(
        '/script',
        'concept',
        concept,
        flat,
        { brandVoice: voice, language: locale },
        opts,
        progressSteps.script.length,
      )
      void brief
      return { data: scriptToScript(s, idea, locale), usage: { tokens: estimateTokens(concept, s) } }
    },

    // The backend has no project persistence yet — keep projects in this browser.
    async saveProject(project: Project) {
      const savedAt = new Date().toISOString()
      try {
        localStorage.setItem(`fx:project:${project.id}`, JSON.stringify({ ...project, savedAt }))
      } catch {
        throw new FxServiceError('local save failed')
      }
      return { savedAt }
    },
  }
}
