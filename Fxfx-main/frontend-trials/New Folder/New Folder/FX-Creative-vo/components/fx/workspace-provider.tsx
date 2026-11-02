'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import { dictionaries, type Dictionary } from '@/lib/fx/i18n'
import { nextSceneId } from '@/lib/fx/mock-content'
import { getFxService, progressSteps } from '@/lib/fx/service'
import type { OperationId, Project, StageId } from '@/lib/fx/types'
import {
  initialState,
  selectedIdea,
  workspaceReducer,
  type Action,
  type WorkspaceState,
} from '@/lib/fx/workspace-reducer'

interface WorkspaceActions {
  dispatch: (action: Action) => void
  goTo: (stage: StageId) => void
  generateStrategy: () => Promise<void>
  generateIdeas: () => Promise<void>
  regenerateIdea: (id: string) => Promise<void>
  refineIdea: (id: string, instruction: string) => Promise<void>
  generateScript: () => Promise<void>
  cancelGeneration: () => void
  addScene: (afterId?: string) => void
  toggleLocale: () => void
  toggleTheme: () => void
  togglePanel: () => void
}

interface WorkspaceContextValue {
  state: WorkspaceState
  t: Dictionary
  actions: WorkspaceActions
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, initialState)
  const stateRef = useRef(state)
  stateRef.current = state
  const abortRef = useRef<AbortController | null>(null)

  const service = getFxService()

  const run = useCallback(
    async <T,>(
      operation: OperationId,
      task: (signal: AbortSignal, onProgress: (i: number) => void) => Promise<T>,
      targetId?: string,
    ): Promise<T | null> => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      dispatch({
        type: 'generationStart',
        generation: {
          operation,
          steps: [...progressSteps[operation]],
          stepIndex: 0,
          targetId,
        },
      })
      try {
        return await task(controller.signal, (stepIndex) =>
          dispatch({ type: 'generationProgress', stepIndex }),
        )
      } catch (error) {
        if (isAbort(error)) dispatch({ type: 'generationEnd' })
        else dispatch({ type: 'generationError', operation, targetId })
        return null
      } finally {
        if (abortRef.current === controller) abortRef.current = null
      }
    },
    [],
  )

  const actions = useMemo<WorkspaceActions>(
    () => ({
      dispatch,
      goTo: (stage) => dispatch({ type: 'setStage', stage }),

      generateStrategy: async () => {
        const { brief, locale } = stateRef.current
        dispatch({ type: 'setStage', stage: 'strategy' })
        const result = await run('strategy', (signal, onProgress) =>
          service.generateStrategy({ brief, locale }, { signal, onProgress }),
        )
        if (result)
          dispatch({ type: 'strategyReady', strategy: result.data, tokens: result.usage.tokens })
      },

      generateIdeas: async () => {
        const { brief, strategy, engines, locale } = stateRef.current
        if (!strategy) return
        dispatch({ type: 'setStage', stage: 'idea' })
        const result = await run('ideas', (signal, onProgress) =>
          service.generateIdeas(
            { brief, strategy, engines, locale, count: 3 },
            { signal, onProgress },
          ),
        )
        if (result)
          dispatch({ type: 'ideasReady', ideas: result.data, tokens: result.usage.tokens })
      },

      regenerateIdea: async (id) => {
        const { brief, strategy, engines, locale, ideas } = stateRef.current
        const idea = ideas.find((i) => i.id === id)
        if (!strategy || !idea) return
        const result = await run(
          'regenerateIdea',
          (signal, onProgress) =>
            service.regenerateIdea(
              {
                brief,
                strategy,
                engines,
                locale,
                idea,
                excludeEngines: ideas.map((i) => i.engine),
              },
              { signal, onProgress },
            ),
          id,
        )
        if (result)
          dispatch({ type: 'ideaReplaced', id, idea: result.data, tokens: result.usage.tokens })
      },

      refineIdea: async (id, instruction) => {
        const { ideas, locale } = stateRef.current
        const idea = ideas.find((i) => i.id === id)
        if (!idea || !instruction.trim()) return
        const result = await run(
          'refineIdea',
          (signal, onProgress) =>
            service.refineIdea({ idea, instruction, locale }, { signal, onProgress }),
          id,
        )
        if (result)
          dispatch({ type: 'ideaReplaced', id, idea: result.data, tokens: result.usage.tokens })
      },

      generateScript: async () => {
        const current = stateRef.current
        const idea = selectedIdea(current)
        if (!current.strategy || !idea) return
        dispatch({ type: 'setStage', stage: 'script' })
        const result = await run('script', (signal, onProgress) =>
          service.generateScript(
            {
              brief: current.brief,
              strategy: current.strategy!,
              idea,
              locale: current.locale,
            },
            { signal, onProgress },
          ),
        )
        if (result)
          dispatch({ type: 'scriptReady', script: result.data, tokens: result.usage.tokens })
      },

      cancelGeneration: () => abortRef.current?.abort(),

      addScene: (afterId) => {
        const { locale } = stateRef.current
        const t = dictionaries[locale]
        dispatch({
          type: 'addScene',
          afterId,
          scene: {
            id: nextSceneId(),
            duration: 5,
            scene: t.script.newScene,
            action: '',
            visual: '',
            camera: '',
            dialogue: '',
            voiceover: '',
            music: '',
            sound: '',
          },
        })
      },

      toggleLocale: () =>
        dispatch({ type: 'setLocale', locale: stateRef.current.locale === 'ar' ? 'en' : 'ar' }),
      toggleTheme: () =>
        dispatch({ type: 'setTheme', theme: stateRef.current.theme === 'dark' ? 'light' : 'dark' }),
      togglePanel: () => {
        const s = stateRef.current
        if (window.matchMedia('(min-width: 1280px)').matches) {
          dispatch({ type: 'setPanelOpen', open: !s.panelOpen })
        } else {
          dispatch({ type: 'setMobilePanelOpen', open: !s.mobilePanelOpen })
        }
      },
    }),
    [run, service],
  )

  // Keep <html> lang/dir/theme in sync with workspace preferences.
  useEffect(() => {
    const root = document.documentElement
    root.lang = state.locale
    root.dir = state.locale === 'ar' ? 'rtl' : 'ltr'
  }, [state.locale])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
  }, [state.theme])

  // Debounced autosave through the service layer.
  useEffect(() => {
    if (state.revision === 0) return
    const controller = new AbortController()
    const revision = state.revision
    const timer = setTimeout(async () => {
      const s = stateRef.current
      const project: Project = {
        id: s.projectId,
        brief: s.brief,
        strategy: s.strategy,
        ideas: s.ideas,
        selectedIdeaId: s.selectedIdeaId,
        script: s.script,
        engines: s.engines,
        locale: s.locale,
      }
      dispatch({ type: 'saveStart' })
      try {
        const { savedAt } = await service.saveProject(project, { signal: controller.signal })
        dispatch({ type: 'saveSuccess', savedAt, revision })
      } catch (error) {
        if (!isAbort(error)) dispatch({ type: 'saveError' })
      }
    }, 900)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [state.revision, service])

  const value = useMemo(
    () => ({ state, t: dictionaries[state.locale], actions }),
    [state, actions],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
