'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { discoverConcepts } = require('../dist/modules/discovery-engine.js')

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