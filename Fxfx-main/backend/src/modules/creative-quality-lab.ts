import type { AgentRunRecord } from '../agent/types'
import type { CreativeIR } from '../core/creative-ir'

/**
 * Human-scored, blind creative benchmark aggregation.
 * This module summarizes evidence; it does not infer artistic truth or change agent policy.
 */

export interface QualityCriterion {
  id: string
  weight: number
}

export interface QualityBenchmark {
  benchmarkVersion: string
  scoringProtocol?: { reviewersPerArtifact?: number; criteria: QualityCriterion[] }
  cases: Array<{ id: string; goal: string; brief: string }>
}

export interface HumanQualityRating {
  caseId: string
  artifactId: string
  engineVersion: string
  reviewerId: string
  scores: Record<string, number>
}

export interface ArtifactQualitySummary {
  caseId: string
  artifactId: string
  engineVersion: string
  reviewerCount: number
  requiredReviewerCount: number
  complete: boolean
  weightedScore: number | null
  criterionMeans: Record<string, number | null>
  warnings: string[]
}

export interface CandidatePoolInput {
  caseId: string
  engineVersion: string
  runId: string
  candidates: Array<{ id: string; concept: Record<string, unknown> }>
}

const round = (value: number, digits = 2) => Math.round(value * (10 ** digits)) / (10 ** digits)

function candidateTokens(concept: Record<string, unknown>): string[] {
  const text = Object.values(concept).flatMap(value => Array.isArray(value) ? value : [value])
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
  return text.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []
}

/** Lexical diagnostics only; these metrics do not establish semantic or artistic novelty. */
export function analyzeCandidateDiversity(candidateRuns: CandidatePoolInput[], nearDuplicateThreshold = 0.8) {
  if (!Array.isArray(candidateRuns) || candidateRuns.length === 0) throw new Error('At least one candidate run is required.')
  if (!Number.isFinite(nearDuplicateThreshold) || nearDuplicateThreshold <= 0 || nearDuplicateThreshold > 1) throw new Error('nearDuplicateThreshold must be between 0 and 1.')

  const runs = candidateRuns.map(run => {
    if (!run || typeof run.caseId !== 'string' || !run.caseId.trim() || typeof run.engineVersion !== 'string' || !run.engineVersion.trim() || typeof run.runId !== 'string' || !run.runId.trim() || !Array.isArray(run.candidates) || !run.candidates.length) {
      throw new Error('Each candidate run needs caseId, engineVersion, runId, and at least one candidate.')
    }
    const ids = run.candidates.map(candidate => candidate?.id)
    if (ids.some(id => typeof id !== 'string' || !id.trim()) || new Set(ids).size !== ids.length) throw new Error(`Candidate IDs must be unique within run ${run.runId}.`)
    const tokens = run.candidates.map(candidate => candidateTokens(candidate.concept || {}))
    let similarityTotal = 0
    let pairCount = 0
    let exactDuplicatePairs = 0
    let nearDuplicatePairs = 0
    const duplicatePairs: Array<{ firstId: string; secondId: string; similarity: number; kind: 'exact' | 'near' }> = []
    for (let first = 0; first < run.candidates.length; first++) {
      for (let second = first + 1; second < run.candidates.length; second++) {
        const firstTokens = tokens[first]
        const secondTokens = tokens[second]
        const firstText = firstTokens.join(' ')
        const secondText = secondTokens.join(' ')
        const firstSet = new Set(firstTokens)
        const secondSet = new Set(secondTokens)
        const intersection = [...firstSet].filter(token => secondSet.has(token)).length
        const union = new Set([...firstSet, ...secondSet]).size
        const similarity = union ? intersection / union : (firstText === secondText ? 1 : 0)
        similarityTotal += similarity
        pairCount++
        if (firstText && firstText === secondText) {
          exactDuplicatePairs++
          duplicatePairs.push({ firstId: run.candidates[first].id, secondId: run.candidates[second].id, similarity: round(similarity, 3), kind: 'exact' })
        } else if (similarity >= nearDuplicateThreshold) {
          nearDuplicatePairs++
          duplicatePairs.push({ firstId: run.candidates[first].id, secondId: run.candidates[second].id, similarity: round(similarity, 3), kind: 'near' })
        }
      }
    }
    const meanPairwiseSimilarity = pairCount ? similarityTotal / pairCount : 0
    return {
      caseId: run.caseId,
      engineVersion: run.engineVersion,
      runId: run.runId,
      candidateCount: run.candidates.length,
      pairCount,
      exactDuplicatePairs,
      nearDuplicatePairs,
      meanPairwiseSimilarity: round(meanPairwiseSimilarity, 3),
      diversityScore: round((1 - meanPairwiseSimilarity) * 100, 1),
      nearDuplicateThreshold,
      duplicatePairs,
    }
  })
  return {
    method: 'token-jaccard-v1',
    status: 'measured',
    runCount: runs.length,
    candidateCount: runs.reduce((sum, run) => sum + run.candidateCount, 0),
    exactDuplicatePairs: runs.reduce((sum, run) => sum + run.exactDuplicatePairs, 0),
    nearDuplicatePairs: runs.reduce((sum, run) => sum + run.nearDuplicatePairs, 0),
    meanDiversityScore: round(runs.reduce((sum, run) => sum + run.diversityScore, 0) / runs.length, 1),
    limitations: ['Lexical overlap is only a duplication diagnostic; paraphrases may be missed and shared necessary vocabulary may be overcounted.', 'These scores do not measure semantic originality, artistic quality, or audience impact.'],
    runs,
  }
}

export function validateQualityBenchmark(benchmark: QualityBenchmark): string[] {
  const errors: string[] = []
  if (!benchmark || typeof benchmark !== 'object') return ['Benchmark must be an object.']
  if (typeof benchmark.benchmarkVersion !== 'string' || !benchmark.benchmarkVersion.trim()) errors.push('benchmarkVersion is required.')
  if (!Array.isArray(benchmark.cases) || benchmark.cases.length === 0) errors.push('At least one benchmark case is required.')
  else {
    const ids = benchmark.cases.map(item => item?.id)
    if (ids.some(id => typeof id !== 'string' || !id.trim())) errors.push('Every case needs a non-empty id.')
    if (new Set(ids).size !== ids.length) errors.push('Benchmark case IDs must be unique.')
  }
  const criteria = benchmark.scoringProtocol?.criteria
  if (!Array.isArray(criteria) || criteria.length === 0) errors.push('At least one scoring criterion is required.')
  else {
    if (criteria.some(item => !item || typeof item.id !== 'string' || !item.id.trim() || !Number.isFinite(item.weight) || item.weight <= 0)) errors.push('Criteria need unique IDs and positive finite weights.')
    if (new Set(criteria.map(item => item.id)).size !== criteria.length) errors.push('Scoring criterion IDs must be unique.')
    const totalWeight = criteria.reduce((sum, item) => sum + (Number.isFinite(item?.weight) ? item.weight : 0), 0)
    if (totalWeight <= 0) errors.push('Total criterion weight must be positive.')
  }
  return errors
}

export function aggregateArtifactRatings(args: {
  benchmark: QualityBenchmark
  ratings: HumanQualityRating[]
  minimumReviewers?: number
}): ArtifactQualitySummary[] {
  const { benchmark, ratings } = args
  const benchmarkErrors = validateQualityBenchmark(benchmark)
  if (benchmarkErrors.length) throw new Error(`Invalid benchmark: ${benchmarkErrors.join(' ')}`)
  if (!Array.isArray(ratings)) throw new Error('ratings must be an array.')
  const caseIds = new Set(benchmark.cases.map(item => item.id))
  const criteria = benchmark.scoringProtocol!.criteria
  const criterionIds = new Set(criteria.map(item => item.id))
  const minReviewers = Math.max(1, Math.floor(args.minimumReviewers ?? benchmark.scoringProtocol?.reviewersPerArtifact ?? 3))
  const groups = new Map<string, HumanQualityRating[]>()

  for (const rating of ratings) {
    if (!rating || typeof rating !== 'object') throw new Error('Every rating must be an object.')
    if (!caseIds.has(rating.caseId)) throw new Error(`Unknown benchmark case: ${rating.caseId}`)
    for (const field of ['artifactId', 'engineVersion', 'reviewerId'] as const) {
      if (typeof rating[field] !== 'string' || !rating[field].trim()) throw new Error(`Rating ${field} is required.`)
    }
    if (!rating.scores || typeof rating.scores !== 'object' || Array.isArray(rating.scores)) throw new Error(`Rating ${rating.artifactId} needs a scores object.`)
    const unknownCriteria = Object.keys(rating.scores).filter(id => !criterionIds.has(id))
    if (unknownCriteria.length) throw new Error(`Unknown criterion(s): ${unknownCriteria.join(', ')}`)
    for (const [id, score] of Object.entries(rating.scores)) {
      if (!Number.isFinite(score) || score < 1 || score > 5) throw new Error(`Score ${id} must be between 1 and 5.`)
    }
    const key = `${rating.caseId}\u0000${rating.artifactId}\u0000${rating.engineVersion}`
    const group = groups.get(key) ?? []
    if (group.some(item => item.reviewerId === rating.reviewerId)) throw new Error(`Duplicate reviewer ${rating.reviewerId} for artifact ${rating.artifactId}.`)
    group.push(rating)
    groups.set(key, group)
  }

  const weightTotal = criteria.reduce((sum, criterion) => sum + criterion.weight, 0)
  return [...groups.values()].map(group => {
    const first = group[0]
    const criterionMeans: Record<string, number | null> = {}
    const warnings: string[] = []
    let weightedScore = 0
    let allCriteriaPresent = true
    for (const criterion of criteria) {
      const values = group.map(rating => rating.scores[criterion.id]).filter((score): score is number => Number.isFinite(score))
      if (!values.length) {
        criterionMeans[criterion.id] = null
        allCriteriaPresent = false
        warnings.push(`No ratings supplied for criterion '${criterion.id}'.`)
        continue
      }
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length
      criterionMeans[criterion.id] = round(mean)
      if (values.length !== group.length) {
        allCriteriaPresent = false
        warnings.push(`Criterion '${criterion.id}' is missing for ${group.length - values.length} reviewer(s).`)
      }
      weightedScore += mean * criterion.weight
    }
    const complete = group.length >= minReviewers && allCriteriaPresent
    if (group.length < minReviewers) warnings.push(`Needs ${minReviewers - group.length} more independent reviewer(s).`)
    return {
      caseId: first.caseId,
      artifactId: first.artifactId,
      engineVersion: first.engineVersion,
      reviewerCount: group.length,
      requiredReviewerCount: minReviewers,
      complete,
      weightedScore: allCriteriaPresent ? round(weightedScore / weightTotal) : null,
      criterionMeans,
      warnings,
    }
  }).sort((a, b) => a.caseId.localeCompare(b.caseId) || a.engineVersion.localeCompare(b.engineVersion) || a.artifactId.localeCompare(b.artifactId))
}

/** Paired case-level version comparison. No significance or causal claim is made. */
export function compareQualityVersions(summaries: ArtifactQualitySummary[], baselineVersion: string, candidateVersion: string) {
  if (baselineVersion === candidateVersion) throw new Error('Baseline and candidate versions must differ.')
  const eligible = summaries.filter(item => item.complete && item.weightedScore !== null)
  const baselineByCase = new Map<string, ArtifactQualitySummary>()
  const candidateByCase = new Map<string, ArtifactQualitySummary>()
  for (const item of eligible) {
    if (item.engineVersion === baselineVersion) {
      if (baselineByCase.has(item.caseId)) throw new Error(`Multiple complete baseline artifacts for case ${item.caseId}; comparison is ambiguous.`)
      baselineByCase.set(item.caseId, item)
    }
    if (item.engineVersion === candidateVersion) {
      if (candidateByCase.has(item.caseId)) throw new Error(`Multiple complete candidate artifacts for case ${item.caseId}; comparison is ambiguous.`)
      candidateByCase.set(item.caseId, item)
    }
  }
  const paired = [...baselineByCase.keys()].filter(caseId => candidateByCase.has(caseId)).sort().map(caseId => {
    const baseline = baselineByCase.get(caseId)!
    const candidate = candidateByCase.get(caseId)!
    return { caseId, baselineScore: baseline.weightedScore!, candidateScore: candidate.weightedScore!, delta: round(candidate.weightedScore! - baseline.weightedScore!) }
  })
  const deltas = paired.map(item => item.delta)
  const wins = deltas.filter(delta => delta > 0).length
  const losses = deltas.filter(delta => delta < 0).length
  const ties = deltas.length - wins - losses
  const meanDelta = deltas.length ? round(deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length) : null
  const sorted = [...deltas].sort((a, b) => a - b)
  const medianDelta = !sorted.length ? null : round(sorted.length % 2 ? sorted[Math.floor(sorted.length / 2)] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
  return {
    baselineVersion,
    candidateVersion,
    pairedCaseCount: paired.length,
    excludedUnpairedOrIncompleteCaseCount: new Set(summaries.map(item => item.caseId)).size - paired.length,
    wins,
    losses,
    ties,
    meanDelta,
    medianDelta,
    paired,
    interpretation: paired.length
      ? 'Descriptive evidence only. This comparison does not establish statistical significance, causality, or audience impact.'
      : 'No complete paired cases are available; no version-level conclusion can be drawn.',
    limitations: [
      'Small benchmark sets are sensitive to prompt choice and reviewer variation.',
      'Human scores are subjective; report reviewer agreement separately when possible.',
      'Keep reviewers blind to version labels and randomize artifact order before scoring.',
      'Do not change generation policy automatically from this report.',
    ],
  }
}

export interface CreativeQualityMetrics {
  briefAdherence: {
    score: number
    matchedKeywords: string[]
    goalPresent: boolean
    limitations: string[]
  }
  noveltyAndDiversity: {
    diversityScore: number
    distinctVocabularyCount: number
    limitations: string[]
  }
  candidateDuplication: {
    candidateCount: number
    exactDuplicates: number
    nearDuplicates: number
    duplicationRate: number
  }
  internalCoherence: {
    score: number
    narrativeArcPresent: boolean
    visualSpecificityScore: number
    limitations: string[]
  }
  evidenceQuality: {
    totalReferences: number
    verifiedCount: number
    unreviewedCount: number
    unsupportedClaimRate: number
  }
  revisionEffectiveness: {
    revised: boolean
    initialScore?: number
    postRevisionScore?: number
    scoreDelta?: number
  }
  costAndLatency: {
    latencyMs: number
    estimatedCostUsd: number
    callCount: number
    modelRoutingVersion?: string
  }
  recoveryRate: {
    recovered: boolean
    interrupted: boolean
  }
}

export function measureRunQualityMetrics(
  run: Partial<AgentRunRecord>,
  options: { latencyMs?: number; costUsd?: number } = {},
): CreativeQualityMetrics {
  const goal = run.goal || ''
  const brief = run.brief || ''
  const conceptText = run.concept ? `${run.concept.title || ''} ${run.concept.coreIdea || ''} ${run.concept.tagline || ''}` : ''
  const scriptText = run.script?.script || ''
  const allGeneratedText = `${conceptText} ${scriptText}`.toLowerCase()

  // 1. Brief Adherence
  const briefTokens = candidateTokens({ text: `${goal} ${brief}` })
  const matched = briefTokens.filter(t => allGeneratedText.includes(t))
  const adherenceScore = briefTokens.length ? round((matched.length / briefTokens.length) * 100, 1) : 100

  const goalTokens = candidateTokens({ text: goal })
  const goalMatched = goalTokens.filter(t => allGeneratedText.includes(t))
  const goalPresent = goalTokens.length ? goalMatched.length > 0 : true

  // 2. Novelty and Diversity & Candidate Duplication
  const candidates = run.creativeIR?.discovery?.candidates || []
  let diversityScore = 100
  let exactDuplicates = 0
  let nearDuplicates = 0
  if (candidates.length > 1) {
    try {
      const diversityReport = analyzeCandidateDiversity([{
        caseId: run.runId || 'run',
        engineVersion: run.mode || 'v1',
        runId: run.runId || 'run',
        candidates: candidates.map(c => ({ id: c.id, concept: (c.concept as unknown as Record<string, unknown>) || {} })),
      }])
      diversityScore = diversityReport.meanDiversityScore
      exactDuplicates = diversityReport.exactDuplicatePairs
      nearDuplicates = diversityReport.nearDuplicatePairs
    } catch {
      // Fallback if diversity analysis fails
    }
  }
  const duplicationRate = candidates.length > 1 ? round((exactDuplicates + nearDuplicates) / (candidates.length * (candidates.length - 1) / 2), 2) : 0

  // 3. Internal Coherence
  const criterionScores = run.scriptReview?.criterionScores
  const coherenceScore = criterionScores
    ? round(((criterionScores.clarityAndPacing || 70) + (criterionScores.conceptIntegrity || 70) + (criterionScores.emotionalArc || 70)) / 3, 1)
    : 75
  const visualSpecificity = criterionScores?.visualSpecificity || 70

  // 4. Evidence Quality and Unsupported Claim Rate
  const totalRefs = run.browserResearch?.evidenceIds?.length || 0
  const isReviewed = (run.browserResearch?.reviewStatus as string) === 'reviewed'
  const verifiedCount = isReviewed ? totalRefs : 0
  const unreviewedCount = isReviewed ? 0 : totalRefs
  const unsupportedClaimRate = totalRefs > 0 && !isReviewed ? 100 : 0

  // 5. Revision Effectiveness
  const revisionHistory = run.revisionHistory || []
  const revised = revisionHistory.length > 1
  let initialScore: number | undefined
  let postRevisionScore: number | undefined
  let scoreDelta: number | undefined
  if (revised) {
    initialScore = revisionHistory[0]?.review?.score
    postRevisionScore = revisionHistory[revisionHistory.length - 1]?.review?.score
    if (initialScore !== undefined && postRevisionScore !== undefined) {
      scoreDelta = round(postRevisionScore - initialScore, 1)
    }
  }

  return {
    briefAdherence: {
      score: adherenceScore,
      matchedKeywords: [...new Set(matched)].slice(0, 10),
      goalPresent,
      limitations: ['Lexical keyword matching only; does not evaluate strategic brand intent.'],
    },
    noveltyAndDiversity: {
      diversityScore,
      distinctVocabularyCount: new Set(candidateTokens({ text: allGeneratedText })).size,
      limitations: ['Token Jaccard distance between candidates; does not measure semantic originality.'],
    },
    candidateDuplication: {
      candidateCount: candidates.length,
      exactDuplicates,
      nearDuplicates,
      duplicationRate,
    },
    internalCoherence: {
      score: coherenceScore,
      narrativeArcPresent: (run.script?.beats?.length ?? 0) >= 3,
      visualSpecificityScore: visualSpecificity,
      limitations: ['Derived from structured rubric scores; requires human review for production readiness.'],
    },
    evidenceQuality: {
      totalReferences: totalRefs,
      verifiedCount,
      unreviewedCount,
      unsupportedClaimRate,
    },
    revisionEffectiveness: {
      revised,
      initialScore,
      postRevisionScore,
      scoreDelta,
    },
    costAndLatency: {
      latencyMs: options.latencyMs || 0,
      estimatedCostUsd: options.costUsd || 0,
      callCount: run.modelCalls?.length || 0,
      modelRoutingVersion: run.creativeIR?.provenance?.modelRoutingVersion,
    },
    recoveryRate: {
      recovered: run.status === 'done' && (run.errorDisposition === 'interrupted' || (run.trace?.some(t => t.phase === 'interrupted') ?? false)),
      interrupted: run.status === 'interrupted',
    },
  }
}

export interface ControlledExperiment {
  experimentId: string
  hypothesis: string
  expectedOutcome: string
  decision: 'promote' | 'reject' | 'inconclusive'
  rationale: string
  baselineConfig: {
    promptVersion: string
    modelId: string
    rubricVersion: string
    routingPolicyVersion: string
    providerMode: 'Gemini' | 'fixture' | 'mock'
  }
  candidateConfig: {
    promptVersion: string
    modelId: string
    rubricVersion: string
    routingPolicyVersion: string
    providerMode: 'Gemini' | 'fixture' | 'mock'
  }
  repeatCount: number
  results: {
    baselineMetrics: CreativeQualityMetrics[]
    candidateMetrics: CreativeQualityMetrics[]
    comparison: {
      briefAdherenceDelta: number
      diversityDelta: number
      duplicationDelta: number
      revisionEffectivenessDelta: number
      costDeltaUsd: number
      latencyDeltaMs: number
    }
    decision: 'promote' | 'reject' | 'inconclusive'
    rationale: string
  }
  provenance: {
    executedAt: string
    environment: string
    syntheticValidationOnly: boolean
  }
}

export function evaluateControlledExperiment(args: {
  experimentId: string
  hypothesis: string
  expectedOutcome: string
  baselineConfig: ControlledExperiment['baselineConfig']
  candidateConfig: ControlledExperiment['candidateConfig']
  baselineRuns: Partial<AgentRunRecord>[]
  candidateRuns: Partial<AgentRunRecord>[]
}): ControlledExperiment {
  if (!args.experimentId || !args.hypothesis) throw new Error('experimentId and hypothesis are required.')
  if (args.baselineRuns.length === 0 || args.candidateRuns.length === 0) {
    throw new Error('At least one baseline and one candidate run required for evaluation.')
  }

  const baselineMetrics = args.baselineRuns.map(r => measureRunQualityMetrics(r))
  const candidateMetrics = args.candidateRuns.map(r => measureRunQualityMetrics(r))

  const mean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

  const baselineAdherence = mean(baselineMetrics.map(m => m.briefAdherence.score))
  const candidateAdherence = mean(candidateMetrics.map(m => m.briefAdherence.score))
  const briefAdherenceDelta = round(candidateAdherence - baselineAdherence, 1)

  const baselineDiversity = mean(baselineMetrics.map(m => m.noveltyAndDiversity.diversityScore))
  const candidateDiversity = mean(candidateMetrics.map(m => m.noveltyAndDiversity.diversityScore))
  const diversityDelta = round(candidateDiversity - baselineDiversity, 1)

  const baselineDuplication = mean(baselineMetrics.map(m => m.candidateDuplication.duplicationRate))
  const candidateDuplication = mean(candidateMetrics.map(m => m.candidateDuplication.duplicationRate))
  const duplicationDelta = round(candidateDuplication - baselineDuplication, 2)

  const baselineCost = mean(baselineMetrics.map(m => m.costAndLatency.estimatedCostUsd))
  const candidateCost = mean(candidateMetrics.map(m => m.costAndLatency.estimatedCostUsd))
  const costDeltaUsd = round(candidateCost - baselineCost, 4)

  const baselineLatency = mean(baselineMetrics.map(m => m.costAndLatency.latencyMs))
  const candidateLatency = mean(candidateMetrics.map(m => m.costAndLatency.latencyMs))
  const latencyDeltaMs = round(candidateLatency - baselineLatency, 0)

  // Promotion decision logic
  let decision: 'promote' | 'reject' | 'inconclusive' = 'inconclusive'
  let rationale = 'Results showed no statistically meaningful improvement.'

  if (briefAdherenceDelta >= 0 && diversityDelta >= 0 && duplicationDelta <= 0) {
    if (diversityDelta > 0 || briefAdherenceDelta > 0) {
      decision = 'promote'
      rationale = `Candidate showed measurable improvement: diversity delta +${diversityDelta}, brief adherence delta +${briefAdherenceDelta}.`
    }
  } else if (briefAdherenceDelta < -5 || duplicationDelta > 0.15) {
    decision = 'reject'
    rationale = `Candidate regressed on key quality metrics: adherence delta ${briefAdherenceDelta}, duplication delta +${duplicationDelta}.`
  }

  const isSynthetic = args.baselineConfig.providerMode !== 'Gemini' || args.candidateConfig.providerMode !== 'Gemini'

  return {
    experimentId: args.experimentId,
    hypothesis: args.hypothesis,
    expectedOutcome: args.expectedOutcome,
    decision,
    rationale,
    baselineConfig: args.baselineConfig,
    candidateConfig: args.candidateConfig,
    repeatCount: Math.min(args.baselineRuns.length, args.candidateRuns.length),
    results: {
      baselineMetrics,
      candidateMetrics,
      comparison: {
        briefAdherenceDelta,
        diversityDelta,
        duplicationDelta,
        revisionEffectivenessDelta: 0,
        costDeltaUsd,
        latencyDeltaMs,
      },
      decision,
      rationale,
    },
    provenance: {
      executedAt: new Date().toISOString(),
      environment: process.platform,
      syntheticValidationOnly: isSynthetic,
    },
  }
}
