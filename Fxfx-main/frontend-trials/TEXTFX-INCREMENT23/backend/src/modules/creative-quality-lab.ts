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
