import { format, type Dictionary } from './i18n'
import type { BriefField, StageId } from './types'
import { isBriefReady, type WorkspaceState } from './workspace-reducer'

export type SuggestionAction =
  | { kind: 'goto'; stage: StageId }
  | { kind: 'generateStrategy' }
  | { kind: 'generateIdeas' }
  | { kind: 'compare' }
  | { kind: 'generateScript' }
  | { kind: 'addScene' }
  | { kind: 'none' }

export interface Suggestion {
  id: string
  text: string
  action: SuggestionAction
}

const SCRIPT_TARGET_SECONDS = 60

/** Context-aware next steps, derived purely from workspace state. */
export function buildSuggestions(state: WorkspaceState, t: Dictionary): Suggestion[] {
  const out: Suggestion[] = []

  if (state.stage === 'brief') {
    const optional: BriefField[] = ['context', 'requirements']
    const missing = (Object.keys(state.brief) as BriefField[]).filter(
      (f) => !state.brief[f].trim(),
    )
    missing
      .filter((f) => !optional.includes(f))
      .concat(missing.filter((f) => optional.includes(f)))
      .slice(0, 2)
      .forEach((f) =>
        out.push({
          id: `fill-${f}`,
          text: format(t.suggest.fillField, { field: t.brief.fields[f].label }),
          action: { kind: 'none' },
        }),
      )
    if (isBriefReady(state.brief))
      out.push({ id: 'brief-ready', text: t.suggest.briefReady, action: { kind: 'generateStrategy' } })
  }

  if (state.stage === 'strategy' && state.strategy) {
    out.push({ id: 'tension', text: t.suggest.sharpenTension, action: { kind: 'none' } })
    if (!state.ideas.length)
      out.push({ id: 'ideas', text: t.suggest.generateIdeas, action: { kind: 'generateIdeas' } })
  }

  if (state.stage === 'idea' && state.ideas.length) {
    if (!state.compareMode && state.ideas.length > 1)
      out.push({ id: 'compare', text: t.suggest.compareIdeas, action: { kind: 'compare' } })
    if (!state.selectedIdeaId)
      out.push({ id: 'select', text: t.suggest.selectIdea, action: { kind: 'none' } })
    else if (!state.script)
      out.push({ id: 'script', text: t.suggest.buildScript, action: { kind: 'generateScript' } })
  }

  if (state.stage === 'script' && state.script) {
    const total = state.script.scenes.reduce((s, x) => s + x.duration, 0)
    if (total > SCRIPT_TARGET_SECONDS)
      out.push({
        id: 'tighten',
        text: format(t.suggest.tightenScript, { sec: SCRIPT_TARGET_SECONDS }),
        action: { kind: 'none' },
      })
    if (state.script.scenes.length < 4)
      out.push({ id: 'closer', text: t.suggest.addCloser, action: { kind: 'addScene' } })
  }

  if (!out.length) out.push({ id: 'ok', text: t.suggest.allGood, action: { kind: 'none' } })
  return out
}
