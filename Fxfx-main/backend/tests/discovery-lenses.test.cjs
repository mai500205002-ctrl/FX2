'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { discoverConcepts } = require('../dist/modules/discovery-engine.js')
const { metabolizeIdeas } = require('../dist/modules/idea-metabolism.js')
const conceptMapper = require('../dist/modules/concept-mapper.js')
const { regulateCreativeEntropy } = require('../dist/modules/creative-entropy.js')

const insight = {
  mainInsight: 'A strategic synthesis',
  lateralThinkingBreakdown: {
    provocation: { provocation: 'provocation-marker', reversal: 'reverse', opportunity: 'open', creativeInsight: 'insight' },
    analogies: [{ sourceField: 'analogy-marker', sharedPrinciple: 'principle', application: 'apply', metaphor: 'metaphor' }],
    randomStimulus: { randomWord: 'random-marker', forcedConnection: 'connect', visualMetaphor: 'visual', unexpectedAngle: 'angle' },
    oppositeThinking: { extremePositive: 'positive', extremeNegative: 'opposite-marker', desirableMiddle: 'middle', paradox: 'paradox' },
    constraintReversal: { constraint: 'constraint-marker', reversal: 'reverse', opportunity: 'opportunity', insight: 'insight' },
  },
}

function concept(title) {
  return { title, tagline: `${title} tagline`, coreIdea: `${title} core`, visualNotes: 'filmable image', creativeDevice: 'mechanism', emotionalArc: 'turn', targetParadox: 'paradox', lateralThinkingTechniques: ['fixture'] }
}

const context = { target: 'audience', problem: 'brief', runId: 'run-fixture', promptVersion: 'prompt-test' }

test('discovery generates one independently attributable candidate from each established technique', async () => {
  const prompts = []
  const result = await discoverConcepts(insight, context, 5, async text => {
    prompts.push(text)
    return concept(`candidate-${prompts.length}`)
  })

  assert.deepEqual(result.candidates.map(item => item.lensId).sort(), [
    'analogy', 'constraint-reversal', 'opposite-thinking', 'provocation', 'random-stimulus',
  ])
  assert.equal(result.candidates.length, 5)
  assert.equal(result.strategy, 'five-technique-v1')
  assert.deepEqual(result.failedLenses, [])
  assert.ok(result.candidates.every(item => item.runId === context.runId && item.promptVersion === context.promptVersion && item.version === 1))
  for (const marker of ['provocation-marker', 'analogy-marker', 'random-marker', 'opposite-marker', 'constraint-marker']) {
    assert.equal(prompts.filter(prompt => prompt.includes(marker)).length, 1, `${marker} must reach only its own technique prompt`)
  }
})

test('a failed technique is recorded without discarding other valid candidates', async () => {
  const result = await discoverConcepts(insight, context, 5, async (text, lensContext) => {
    if (lensContext.problem.includes('Analogy')) throw new Error('fixture lens failure')
    return concept(lensContext.promptVersion)
  })

  assert.equal(result.candidates.length, 4)
  assert.deepEqual(result.failedLenses, [{ lensId: 'analogy', error: 'fixture lens failure' }])
  assert.ok(!result.candidates.some(item => item.lensId === 'analogy'))
})

test('discovery uses Jaccard similarity so a subset concept is not misclassified as a duplicate', async () => {
  const sharedFields = {
    title: 'ember',
    tagline: 'lantern',
    coreIdea: 'signal',
    visualNotes: 'silver',
    creativeDevice: 'compass',
    emotionalArc: 'threshold',
    targetParadox: 'horizon',
  }
  const richer = { ...sharedFields, lateralThinkingTechniques: ['cobalt'] }
  const concise = { ...sharedFields }

  const result = await discoverConcepts(insight, context, 2, async (_text, lensContext) => (
    lensContext.problem.includes('Provocation') ? richer : concise
  ))

  assert.equal(result.candidates.length, 2)
  assert.ok(result.candidates.every(candidate =>
    candidate.rationale.includes('Relative distinctiveness heuristic: 13%.')
  ))
})

test('discovery compares separate lenses even when a mapper reuses the same concept object', async () => {
  const sharedConcept = concept('shared concept')
  const result = await discoverConcepts(insight, context, 2, async () => sharedConcept)

  assert.equal(result.candidates.length, 2)
  assert.ok(result.candidates.every(candidate =>
    candidate.rationale.includes('Relative distinctiveness heuristic: 0%.')
  ))
})

function metabolismSeed(id, score, conceptValue) {
  return {
    id,
    lens: id,
    lensId: id,
    version: 1,
    runId: context.runId,
    promptVersion: context.promptVersion,
    concept: conceptValue,
    score,
    rationale: [],
    generation: 0,
  }
}

test('idea metabolism crosses the strongest seed with its most distinct available partner', async () => {
  const primary = concept('solar lantern')
  Object.assign(primary, {
    tagline: 'glass beacon',
    coreIdea: 'reflective light',
    visualNotes: 'copper mirror',
    creativeDevice: 'prismatic lens',
    emotionalArc: 'fear becomes wonder',
    targetParadox: 'darkness reveals path',
  })
  const nearDuplicate = {
    ...primary,
    title: 'solar lamp',
    tagline: 'glass beacon',
    coreIdea: 'reflective light',
    visualNotes: 'copper mirror',
    creativeDevice: 'prismatic lens',
    emotionalArc: 'fear becomes wonder',
    targetParadox: 'darkness reveals path',
  }
  const distinct = {
    title: 'tidal orchestra',
    tagline: 'submerged rhythm',
    coreIdea: 'currents conduct sound',
    visualNotes: 'blue pressure chamber',
    creativeDevice: 'hydrophone choir',
    emotionalArc: 'isolation becomes belonging',
    targetParadox: 'silence carries music',
    lateralThinkingTechniques: ['analogy'],
  }
  const seeds = [
    metabolismSeed('primary', 96, primary),
    metabolismSeed('near-duplicate', 92, nearDuplicate),
    metabolismSeed('distinct-partner', 78, distinct),
  ]
  const originalMapConcept = conceptMapper.mapConcept
  conceptMapper.mapConcept = async () => concept('generated offspring')

  try {
    const result = await metabolizeIdeas(
      seeds,
      { mainInsight: 'A brief insight' },
      context,
      2,
    )
    assert.equal(result.offspring.length, 2)
    assert.deepEqual(result.offspring[0].parentIds, ['primary'])
    assert.deepEqual(result.offspring[1].parentIds, ['primary', 'distinct-partner'])
    assert.equal(result.events[1].type, 'crossover')
  } finally {
    conceptMapper.mapConcept = originalMapConcept
  }
})

function entropyCandidate(id, score, tokenText) {
  return {
    id,
    lens: id,
    lensId: id,
    version: 1,
    runId: context.runId,
    promptVersion: context.promptVersion,
    concept: {
      title: tokenText,
      tagline: '',
      coreIdea: '',
      visualNotes: '',
      creativeDevice: '',
      emotionalArc: '',
      targetParadox: '',
      lateralThinkingTechniques: [],
    },
    score,
    rationale: [],
    generation: 0,
  }
}

test('creative entropy regenerates the more redundant pair member, not merely the lower-scored one', async () => {
  const candidates = [
    entropyCandidate('networked-direction', 95, 'alpha bravo charlie delta echo foxtrot'),
    entropyCandidate('lower-score-direction', 60, 'alpha bravo charlie delta echo golf'),
    entropyCandidate('external-neighbor', 80, 'alpha bravo charlie juliet kilo lima'),
  ]
  let generationTarget = ''
  const originalMapConcept = conceptMapper.mapConcept
  conceptMapper.mapConcept = async (_insight, generationContext) => {
    generationTarget = generationContext.target
    return {
      title: 'quartz nebula',
      tagline: 'violet orbit',
      coreIdea: 'gravity conducts silence',
      visualNotes: 'luminous tidal chamber',
      creativeDevice: 'resonant prism',
      emotionalArc: 'distance becomes intimacy',
      targetParadox: 'stillness creates motion',
      lateralThinkingTechniques: ['analogy'],
    }
  }

  try {
    const result = await regulateCreativeEntropy({
      candidates,
      insight: { mainInsight: 'A concise strategic insight' },
      context,
      antiTasteMemory: { lessons: [], prompt: '' },
      threshold: 0.68,
    })

    assert.equal(result.report.action, 'diversified')
    assert.match(generationTarget, /Candidate to differentiate: alpha bravo charlie delta echo foxtrot/)
    assert.equal(result.candidates.find(item => item.id === 'networked-direction').version, 2)
    assert.equal(result.candidates.find(item => item.id === 'lower-score-direction').version, 1)
    assert.equal(result.candidates.find(item => item.id === 'external-neighbor').version, 1)
  } finally {
    conceptMapper.mapConcept = originalMapConcept
  }
})
