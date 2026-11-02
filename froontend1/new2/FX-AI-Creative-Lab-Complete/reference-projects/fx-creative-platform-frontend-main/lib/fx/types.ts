export type Locale = 'ar' | 'en'
export type Theme = 'dark' | 'light'

export type StageId = 'brief' | 'strategy' | 'idea' | 'script'

export type EngineId =
  | 'provocation'
  | 'analogies'
  | 'random'
  | 'opposite'
  | 'constraint'

export interface Brief {
  project: string
  brand: string
  product: string
  objective: string
  audience: string
  challenge: string
  context: string
  requirements: string
}

export type BriefField = keyof Brief

export interface Strategy {
  insight: string
  audienceInsight: string
  tension: string
  opportunity: string
  territory: string
  direction: string
}

export type StrategyField = keyof Strategy

export interface Idea {
  id: string
  engine: EngineId
  bigIdea: string
  territory: string
  theme: string
  hook: string
  message: string
  score: number
  version: number
  refinements: string[]
}

export type IdeaField = 'bigIdea' | 'territory' | 'theme' | 'hook' | 'message'

export interface Scene {
  id: string
  duration: number
  scene: string
  action: string
  visual: string
  camera: string
  dialogue: string
  voiceover: string
  music: string
  sound: string
}

export type SceneField = Exclude<keyof Scene, 'id' | 'duration'>

export interface Script {
  title: string
  logline: string
  scenes: Scene[]
}

export type OperationId =
  | 'strategy'
  | 'ideas'
  | 'regenerateIdea'
  | 'refineIdea'
  | 'script'

export interface GenerationState {
  operation: OperationId
  steps: string[]
  stepIndex: number
  targetId?: string
}

export interface Usage {
  tokens: number
}

export interface ServiceResult<T> {
  data: T
  usage: Usage
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export interface Project {
  id: string
  brief: Brief
  strategy: Strategy | null
  ideas: Idea[]
  selectedIdeaId: string | null
  script: Script | null
  engines: EngineId[]
  locale: Locale
}
