import { sampleBrief } from './mock-content'
import type {
  Brief,
  BriefField,
  EngineId,
  GenerationState,
  Idea,
  IdeaField,
  Locale,
  OperationId,
  SaveStatus,
  Scene,
  Script,
  StageId,
  Strategy,
  StrategyField,
  Theme,
} from './types'

export const TOKEN_LIMIT = 50_000

export interface WorkspaceState {
  projectId: string
  locale: Locale
  theme: Theme
  stage: StageId
  brief: Brief
  strategy: Strategy | null
  ideas: Idea[]
  selectedIdeaId: string | null
  compareMode: boolean
  compareIds: string[]
  script: Script | null
  engines: EngineId[]
  generation: GenerationState | null
  error: { operation: OperationId; targetId?: string } | null
  tokens: number
  saveStatus: SaveStatus
  lastSavedAt: string | null
  revision: number
  panelOpen: boolean
  mobilePanelOpen: boolean
  paletteOpen: boolean
}

export const initialState: WorkspaceState = {
  projectId: 'prj_memory_2027',
  locale: 'ar',
  theme: 'dark',
  stage: 'brief',
  brief: sampleBrief.ar,
  strategy: null,
  ideas: [],
  selectedIdeaId: null,
  compareMode: false,
  compareIds: [],
  script: null,
  engines: ['provocation', 'analogies', 'opposite'],
  generation: null,
  error: null,
  tokens: 0,
  saveStatus: 'saved',
  lastSavedAt: null,
  revision: 0,
  panelOpen: true,
  mobilePanelOpen: false,
  paletteOpen: false,
}

export type Action =
  | { type: 'setLocale'; locale: Locale }
  | { type: 'setTheme'; theme: Theme }
  | { type: 'setStage'; stage: StageId }
  | { type: 'updateBrief'; field: BriefField; value: string }
  | { type: 'updateStrategy'; field: StrategyField; value: string }
  | { type: 'updateIdea'; id: string; field: IdeaField; value: string }
  | { type: 'toggleEngine'; engine: EngineId }
  | { type: 'selectIdea'; id: string }
  | { type: 'toggleCompareMode' }
  | { type: 'toggleCompareId'; id: string }
  | { type: 'updateScene'; id: string; patch: Partial<Omit<Scene, 'id'>> }
  | { type: 'addScene'; scene: Scene; afterId?: string }
  | { type: 'removeScene'; id: string }
  | { type: 'moveScene'; id: string; direction: -1 | 1 }
  | { type: 'generationStart'; generation: GenerationState }
  | { type: 'generationProgress'; stepIndex: number }
  | { type: 'generationEnd' }
  | { type: 'generationError'; operation: OperationId; targetId?: string }
  | { type: 'dismissError' }
  | { type: 'strategyReady'; strategy: Strategy; tokens: number }
  | { type: 'ideasReady'; ideas: Idea[]; tokens: number }
  | { type: 'ideaReplaced'; id: string; idea: Idea; tokens: number }
  | { type: 'scriptReady'; script: Script; tokens: number }
  | { type: 'saveStart' }
  | { type: 'saveSuccess'; savedAt: string; revision: number }
  | { type: 'saveError' }
  | { type: 'setPanelOpen'; open: boolean }
  | { type: 'setMobilePanelOpen'; open: boolean }
  | { type: 'setPaletteOpen'; open: boolean }

function touch(state: WorkspaceState, patch: Partial<WorkspaceState>): WorkspaceState {
  return { ...state, ...patch, revision: state.revision + 1, saveStatus: 'unsaved' }
}

export function workspaceReducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case 'setLocale': {
      // Swap the untouched sample brief so the demo reads naturally in either language.
      const untouched =
        JSON.stringify(state.brief) === JSON.stringify(sampleBrief[state.locale])
      return {
        ...state,
        locale: action.locale,
        brief: untouched ? sampleBrief[action.locale] : state.brief,
      }
    }
    case 'setTheme':
      return { ...state, theme: action.theme }
    case 'setStage':
      return { ...state, stage: action.stage }
    case 'updateBrief':
      return touch(state, { brief: { ...state.brief, [action.field]: action.value } })
    case 'updateStrategy':
      if (!state.strategy) return state
      return touch(state, { strategy: { ...state.strategy, [action.field]: action.value } })
    case 'updateIdea':
      return touch(state, {
        ideas: state.ideas.map((idea) =>
          idea.id === action.id ? { ...idea, [action.field]: action.value } : idea,
        ),
      })
    case 'toggleEngine': {
      const active = state.engines.includes(action.engine)
      if (active && state.engines.length === 1) return state
      return touch(state, {
        engines: active
          ? state.engines.filter((e) => e !== action.engine)
          : [...state.engines, action.engine],
      })
    }
    case 'selectIdea':
      return touch(state, {
        selectedIdeaId: state.selectedIdeaId === action.id ? null : action.id,
      })
    case 'toggleCompareMode':
      return {
        ...state,
        compareMode: !state.compareMode,
        compareIds: state.compareMode ? [] : state.ideas.slice(0, 2).map((i) => i.id),
      }
    case 'toggleCompareId': {
      const has = state.compareIds.includes(action.id)
      const next = has
        ? state.compareIds.filter((id) => id !== action.id)
        : [...state.compareIds, action.id].slice(-2)
      return { ...state, compareIds: next }
    }
    case 'updateScene':
      if (!state.script) return state
      return touch(state, {
        script: {
          ...state.script,
          scenes: state.script.scenes.map((s) =>
            s.id === action.id ? { ...s, ...action.patch } : s,
          ),
        },
      })
    case 'addScene': {
      if (!state.script) return state
      const scenes = [...state.script.scenes]
      const index = action.afterId ? scenes.findIndex((s) => s.id === action.afterId) : -1
      scenes.splice(index === -1 ? scenes.length : index + 1, 0, action.scene)
      return touch(state, { script: { ...state.script, scenes } })
    }
    case 'removeScene':
      if (!state.script) return state
      return touch(state, {
        script: {
          ...state.script,
          scenes: state.script.scenes.filter((s) => s.id !== action.id),
        },
      })
    case 'moveScene': {
      if (!state.script) return state
      const scenes = [...state.script.scenes]
      const from = scenes.findIndex((s) => s.id === action.id)
      const to = from + action.direction
      if (from === -1 || to < 0 || to >= scenes.length) return state
      ;[scenes[from], scenes[to]] = [scenes[to], scenes[from]]
      return touch(state, { script: { ...state.script, scenes } })
    }
    case 'generationStart':
      return { ...state, generation: action.generation, error: null }
    case 'generationProgress':
      if (!state.generation) return state
      return { ...state, generation: { ...state.generation, stepIndex: action.stepIndex } }
    case 'generationEnd':
      return { ...state, generation: null }
    case 'generationError':
      return {
        ...state,
        generation: null,
        error: { operation: action.operation, targetId: action.targetId },
      }
    case 'dismissError':
      return { ...state, error: null }
    case 'strategyReady':
      return touch(state, {
        strategy: action.strategy,
        generation: null,
        tokens: state.tokens + action.tokens,
      })
    case 'ideasReady':
      return touch(state, {
        ideas: action.ideas,
        selectedIdeaId: null,
        compareMode: false,
        compareIds: [],
        generation: null,
        tokens: state.tokens + action.tokens,
      })
    case 'ideaReplaced':
      return touch(state, {
        ideas: state.ideas.map((idea) => (idea.id === action.id ? action.idea : idea)),
        selectedIdeaId: state.selectedIdeaId === action.id ? action.idea.id : state.selectedIdeaId,
        compareIds: state.compareIds.map((id) => (id === action.id ? action.idea.id : id)),
        generation: null,
        tokens: state.tokens + action.tokens,
      })
    case 'scriptReady':
      return touch(state, {
        script: action.script,
        generation: null,
        tokens: state.tokens + action.tokens,
      })
    case 'saveStart':
      return { ...state, saveStatus: 'saving' }
    case 'saveSuccess':
      return {
        ...state,
        lastSavedAt: action.savedAt,
        saveStatus: state.revision === action.revision ? 'saved' : 'unsaved',
      }
    case 'saveError':
      return { ...state, saveStatus: 'error' }
    case 'setPanelOpen':
      return { ...state, panelOpen: action.open }
    case 'setMobilePanelOpen':
      return { ...state, mobilePanelOpen: action.open }
    case 'setPaletteOpen':
      return { ...state, paletteOpen: action.open }
    default:
      return state
  }
}

export function selectedIdea(state: WorkspaceState) {
  return state.ideas.find((i) => i.id === state.selectedIdeaId) ?? null
}

const requiredBriefFields: BriefField[] = ['brand', 'product', 'objective', 'audience', 'challenge']

export function briefCompleteness(brief: Brief) {
  const fields = Object.values(brief)
  const filled = fields.filter((v) => v.trim().length > 0).length
  return Math.round((filled / fields.length) * 100)
}

export function isBriefReady(brief: Brief) {
  return requiredBriefFields.every((f) => brief[f].trim().length > 0)
}

export function stageStatus(state: WorkspaceState, stage: StageId): 'done' | 'pending' {
  switch (stage) {
    case 'brief':
      return isBriefReady(state.brief) ? 'done' : 'pending'
    case 'strategy':
      return state.strategy ? 'done' : 'pending'
    case 'idea':
      return state.selectedIdeaId ? 'done' : 'pending'
    case 'script':
      return state.script && state.script.scenes.length > 0 ? 'done' : 'pending'
  }
}

export const stageOrder: StageId[] = ['brief', 'strategy', 'idea', 'script']
