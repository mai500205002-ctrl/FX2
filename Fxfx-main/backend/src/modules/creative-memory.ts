import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { CreativeScriptReview } from './creative-reviewer'
import type { CounterfactualReplay } from './counterfactual-replay'

export interface CreativeLesson {
  id: string
  polarity: 'reinforce' | 'avoid'
  lesson: string
  sourceRunId: string
  sourceScore: number
  createdAt: string
  tags: string[]
}

export interface CreativeMemoryContext {
  lessons: CreativeLesson[]
  prompt: string
}

interface CounterfactualEvidence {
  runId: string
  recordedAt: string
  status: CounterfactualReplay['status']
  primarySource: CreativeScriptReview['source']
  shadowSource?: CreativeScriptReview['source']
  primaryScore: number
  shadowScore?: number
  scoreDelta?: number
}

interface PersistedCreativeMemory {
  schemaVersion: 1
  lessons: CreativeLesson[]
  counterfactualEvidence: CounterfactualEvidence[]
}

const MAX_LESSONS = 160
const MAX_COUNTERFACTUAL_EVIDENCE = 200
const memory: CreativeLesson[] = []
const counterfactualEvidence: CounterfactualEvidence[] = []
const memoryPath = resolve(process.env.TEXTFX_CREATIVE_MEMORY_PATH || resolve(process.cwd(), 'data', 'creative-memory.json'))
let persistence: 'durable' | 'volatile' = 'volatile'
let persistenceError: string | undefined
const STOP_WORDS = new Set(['the','and','for','with','that','this','from','into','your','you','are','was','were','have','has','will','can','not','but','من','في','على','إلى','عن','مع','هذا','هذه','الذي','التي','هو','هي','كل','بين','عند','لكن'])

function tokens(value: string): string[] {
  return [...new Set((value.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []).filter(word => !STOP_WORDS.has(word)))]
}

function overlap(queryTokens: string[], lessonTokens: string[]): number {
  if (!queryTokens.length || !lessonTokens.length) return 0
  const lessonSet = new Set(lessonTokens)
  const common = queryTokens.filter(token => lessonSet.has(token)).length
  return common / Math.sqrt(queryTokens.length * lessonTokens.length)
}

function isLesson(value: unknown): value is CreativeLesson {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CreativeLesson>
  return typeof item.id === 'string' && (item.polarity === 'reinforce' || item.polarity === 'avoid') &&
    typeof item.lesson === 'string' && typeof item.sourceRunId === 'string' &&
    typeof item.sourceScore === 'number' && typeof item.createdAt === 'string' &&
    Array.isArray(item.tags) && item.tags.every(tag => typeof tag === 'string')
}

function persistState(): void {
  try {
    mkdirSync(dirname(memoryPath), { recursive: true })
    const state: PersistedCreativeMemory = {
      schemaVersion: 1,
      lessons: memory.slice(-MAX_LESSONS),
      counterfactualEvidence: counterfactualEvidence.slice(-MAX_COUNTERFACTUAL_EVIDENCE),
    }
    const temporaryPath = `${memoryPath}.${process.pid}.tmp`
    writeFileSync(temporaryPath, JSON.stringify(state, null, 2), { encoding: 'utf8', mode: 0o600 })
    renameSync(temporaryPath, memoryPath)
    persistence = 'durable'
    persistenceError = undefined
  } catch (error) {
    persistence = 'volatile'
    persistenceError = 'Could not write creative memory state; check the configured path and file permissions.'
  }
}

function loadState(): void {
  if (!existsSync(memoryPath)) {
    persistState()
    return
  }
  try {
    const parsed = JSON.parse(readFileSync(memoryPath, 'utf8')) as Partial<PersistedCreativeMemory>
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.lessons) || !Array.isArray(parsed.counterfactualEvidence)) {
      persistence = 'volatile'
      persistenceError = 'Creative memory state has an unsupported or invalid schema; the existing file was preserved and memory started empty.'
      return
    }
    for (const lesson of parsed.lessons.filter(isLesson).slice(-MAX_LESSONS)) memory.push({ ...lesson, tags: [...lesson.tags] })
    for (const item of parsed.counterfactualEvidence.slice(-MAX_COUNTERFACTUAL_EVIDENCE)) {
      if (item && typeof item === 'object' && typeof item.runId === 'string' && typeof item.recordedAt === 'string' &&
          ['compared', 'inconclusive', 'skipped', 'failed'].includes(item.status) &&
          typeof item.primaryScore === 'number') counterfactualEvidence.push(item as CounterfactualEvidence)
    }
    persistence = 'durable'
    persistenceError = undefined
  } catch (error) {
    persistence = 'volatile'
    persistenceError = 'Could not load creative memory; the existing file was preserved. Check file permissions and JSON validity.'
  }
}

loadState()

/** Retrieve relevant lessons without exposing prior full briefs or scripts to new generation. */
export function retrieveCreativeMemory(query: string, limit = 5): CreativeMemoryContext {
  const queryTokens = tokens(query)
  const ranked = memory
    .map(lesson => ({ lesson, score: overlap(queryTokens, lesson.tags) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || b.lesson.createdAt.localeCompare(a.lesson.createdAt))
    .slice(0, Math.max(0, Math.min(8, limit)))
  const lessons = ranked.map(item => item.lesson)
  const prompt = lessons.length
    ? [
        'TextFX Creative Memory — use as contextual guidance, not universal law:',
        ...lessons.map((lesson, index) => `${index + 1}. ${lesson.polarity === 'reinforce' ? 'REINFORCE' : 'AVOID'}: ${lesson.lesson}`),
        'Do not copy prior concepts. Apply only lessons relevant to this brief, and preserve originality.',
      ].join('\n')
    : ''
  return { lessons: lessons.map(lesson => ({ ...lesson, tags: [...lesson.tags] })), prompt }
}

/** Learn only from model-based review; structural fallbacks are not evidence of creative quality. */
export function learnFromCreativeReview(args: {
  runId: string
  query: string
  review: CreativeScriptReview
}): CreativeLesson[] {
  if (args.review.source !== 'model') return []
  const baseTags = tokens(args.query).slice(0, 24)
  const candidates: Array<{ polarity: CreativeLesson['polarity']; lesson: string }> = [
    ...args.review.strengths.slice(0, 2).map(lesson => ({ polarity: 'reinforce' as const, lesson })),
    ...args.review.weaknesses.slice(0, 3).map(lesson => ({ polarity: 'avoid' as const, lesson })),
  ]
  const added: CreativeLesson[] = []
  for (const candidate of candidates) {
    const lessonText = candidate.lesson.replace(/\s+/g, ' ').trim().slice(0, 320)
    if (!lessonText) continue
    const duplicate = memory.some(existing => existing.polarity === candidate.polarity && existing.lesson.toLocaleLowerCase() === lessonText.toLocaleLowerCase())
    if (duplicate) continue
    const lesson: CreativeLesson = {
      id: randomUUID(),
      polarity: candidate.polarity,
      lesson: lessonText,
      sourceRunId: args.runId,
      sourceScore: args.review.score,
      createdAt: new Date().toISOString(),
      tags: [...new Set([...baseTags, ...tokens(lessonText).slice(0, 12)])],
    }
    memory.push(lesson)
    added.push(lesson)
  }
  while (memory.length > MAX_LESSONS) memory.shift()
  if (added.length) persistState()
  return added.map(lesson => ({ ...lesson, tags: [...lesson.tags] }))
}

/** Store bounded comparison evidence for evaluation; it never changes selection policy. */
export function recordCounterfactualEvidence(runId: string, replay: CounterfactualReplay): void {
  counterfactualEvidence.push({
    runId,
    recordedAt: new Date().toISOString(),
    status: replay.status,
    primarySource: replay.primaryReviewSource,
    shadowSource: replay.shadowReviewSource,
    primaryScore: replay.primaryScore,
    shadowScore: replay.shadowScore,
    scoreDelta: replay.scoreDelta,
  })
  while (counterfactualEvidence.length > MAX_COUNTERFACTUAL_EVIDENCE) counterfactualEvidence.shift()
  persistState()
}

export function getCreativeMemoryStatus() {
  const comparable = counterfactualEvidence.filter(item => item.status === 'compared' && item.primarySource === 'model' && item.shadowSource === 'model' && typeof item.scoreDelta === 'number')
  const deltaTotal = comparable.reduce((sum, item) => sum + (item.scoreDelta ?? 0), 0)
  const positive = comparable.filter(item => (item.scoreDelta ?? 0) > 0).length
  const negative = comparable.filter(item => (item.scoreDelta ?? 0) < 0).length
  const neutral = comparable.length - positive - negative
  return {
    lessonCount: memory.length,
    reinforceCount: memory.filter(item => item.polarity === 'reinforce').length,
    avoidCount: memory.filter(item => item.polarity === 'avoid').length,
    capacity: MAX_LESSONS,
    persistence,
    persistenceError,
    evaluation: {
      evidenceCount: counterfactualEvidence.length,
      comparableModelReviewCount: comparable.length,
      positiveShadowCount: positive,
      negativeShadowCount: negative,
      neutralCount: neutral,
      meanShadowScoreDelta: comparable.length ? Math.round((deltaTotal / comparable.length) * 100) / 100 : null,
      policy: 'observe-only; no automatic policy changes from unvalidated single-run comparisons',
    },
  }
}

/** Return anti-taste constraints separately so diversity control can use them without treating
 * every historical weakness as a universal prohibition. */
export function retrieveAntiTasteMemory(query: string, limit = 4): CreativeMemoryContext {
  const result = retrieveCreativeMemory(query, MAX_LESSONS)
  const lessons = result.lessons.filter(lesson => lesson.polarity === 'avoid').slice(0, Math.max(0, Math.min(6, limit)))
  const prompt = lessons.length
    ? [
        'ANTI-TASTE MEMORY — these are context-specific patterns to challenge, not absolute bans:',
        ...lessons.map((lesson, index) => `${index + 1}. Avoid repeating: ${lesson.lesson}`),
        'If a pattern is strategically necessary, justify it through the brief rather than blindly obeying this memory.',
      ].join('\n')
    : ''
  return { lessons: lessons.map(lesson => ({ ...lesson, tags: [...lesson.tags] })), prompt }
}
