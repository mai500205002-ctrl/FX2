import type {
  Brief,
  EngineId,
  Idea,
  Locale,
  Project,
  Script,
  ServiceResult,
  Strategy,
} from '../types'

export interface RequestOptions {
  signal?: AbortSignal
  /** Called with the index of the current progress step (see `progressSteps`). */
  onProgress?: (stepIndex: number) => void
}

export interface StrategyRequest {
  brief: Brief
  locale: Locale
}

export interface IdeasRequest {
  brief: Brief
  strategy: Strategy
  engines: EngineId[]
  locale: Locale
  count: number
}

export interface RegenerateIdeaRequest {
  brief: Brief
  strategy: Strategy
  engines: EngineId[]
  locale: Locale
  idea: Idea
  /** Engines already represented on screen, so the backend can diversify. */
  excludeEngines: EngineId[]
}

export interface RefineIdeaRequest {
  idea: Idea
  instruction: string
  locale: Locale
}

export interface ScriptRequest {
  brief: Brief
  strategy: Strategy
  idea: Idea
  locale: Locale
}

/**
 * The single seam between the FX frontend and the FX backend.
 * Swap implementations in `./index.ts` — no UI code depends on transport details.
 */
export interface FxService {
  generateStrategy(req: StrategyRequest, opts?: RequestOptions): Promise<ServiceResult<Strategy>>
  generateIdeas(req: IdeasRequest, opts?: RequestOptions): Promise<ServiceResult<Idea[]>>
  regenerateIdea(req: RegenerateIdeaRequest, opts?: RequestOptions): Promise<ServiceResult<Idea>>
  refineIdea(req: RefineIdeaRequest, opts?: RequestOptions): Promise<ServiceResult<Idea>>
  generateScript(req: ScriptRequest, opts?: RequestOptions): Promise<ServiceResult<Script>>
  saveProject(project: Project, opts?: Pick<RequestOptions, 'signal'>): Promise<{ savedAt: string }>
}

/** Progress copy keys (in `dictionary.generation`) for each long-running operation. */
export const progressSteps = {
  strategy: ['analyzingBrief', 'findingTension', 'shapingStrategy'],
  ideas: ['exploringPaths', 'developingIdea', 'scoring'],
  regenerateIdea: ['exploringPaths', 'developingIdea'],
  refineIdea: ['refining', 'scoring'],
  script: ['buildingScript', 'framingScenes', 'scoringSound'],
} as const

export class FxServiceError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'FxServiceError'
  }
}
