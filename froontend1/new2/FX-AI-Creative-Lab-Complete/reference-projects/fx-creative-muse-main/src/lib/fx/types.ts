export type Lang = "en" | "ar";
export type StageId = "home" | "brief" | "engine" | "insight" | "concept" | "script" | "output";
export type EngineId = "provocation" | "analogies" | "random" | "opposite" | "constraint";
export type AiStatus = "idle" | "analyzing" | "tensions" | "concept" | "script" | "done";

export interface Brief {
  projectName: string;
  brand: string;
  audience: string;
  challenge: string;
  objective: string;
  tension: string;
  keyMessage: string;
  tone: string;
  constraints: string;
  language: Lang;
}

export interface Insight {
  id: string;
  engine: EngineId;
  title: string;
  tension: string;
  contradiction: string;
  opportunity: string;
}

export interface Concept {
  id: string;
  insightId: string;
  coreIdea: string;
  theme: string;
  mechanism: string;
  emotion: string;
  keyMessage: string;
  score: { originality: number; relevance: number; impact: number };
  mood: string[];
  moodWords: string[];
}

export interface Scene {
  id: string;
  duration: number;
  visual: string;
  camera: string;
  dialogue: string;
  music: string;
  sound: string;
  transition: string;
}

export interface Project {
  id: string;
  updatedAt: number;
  brief: Brief;
  engine: EngineId;
  insights: Insight[];
  selectedInsight?: string | undefined;
  concepts: Concept[];
  selectedConcept?: string | undefined;
  scenes: Scene[];
  rationale: string;
  seed: number;
}
